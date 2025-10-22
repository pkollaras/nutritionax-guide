import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Restarting subscription for existing nutritionist...');

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Get the user from the JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    console.log('User authenticated:', user.id);

    // Get nutritionist data with Services credentials
    const { data: nutritionist, error: nutritionistError } = await supabaseClient
      .from('nutritionists')
      .select('services_api_token, services_customer_id, name, email')
      .eq('user_id', user.id)
      .single();

    if (nutritionistError || !nutritionist) {
      console.error('Nutritionist not found:', nutritionistError);
      return new Response(
        JSON.stringify({ error: 'Nutritionist profile not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    if (!nutritionist.services_api_token || !nutritionist.services_customer_id) {
      console.log('No Services credentials found, redirect to signup');
      return new Response(
        JSON.stringify({ 
          requiresSignup: true,
          message: 'No existing subscription found. Please complete registration.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log('Found existing Services credentials for customer:', nutritionist.services_customer_id);

    // Get OTP from Services API
    const otpResponse = await fetch('https://services.advisable.gr/api/services/customer/getOTP', {
      method: 'GET',
      headers: {
        'X-Customer-API-Token': nutritionist.services_api_token,
        'Content-Type': 'application/json',
      },
    });

    if (!otpResponse.ok) {
      const errorText = await otpResponse.text();
      console.error('Failed to get OTP:', otpResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to authenticate with billing service',
          details: errorText 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    const otpData = await otpResponse.json();
    console.log('OTP obtained successfully');

    // Generate payment URL directly (like register-nutritionist does)
    const servicesUrl = "https://services.advisable.gr";
    const redirectUrl = encodeURIComponent("https://nutritionax.com/dashboard");
    const productCodeId = 1237; // Same product as registration
    const quantity = 1;
    const productList = `${productCodeId}:${quantity}`;
    const otp = otpData.data.otp;

    const paymentUrl = `${servicesUrl}/customer/begin_subscription/${productList}?otp=${otp}&redirectUrl=${redirectUrl}`;

    console.log('Payment URL created successfully');

    return new Response(
      JSON.stringify({ 
        paymentUrl: paymentUrl,
        message: 'Payment URL created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in restart-subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
