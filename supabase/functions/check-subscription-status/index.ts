import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Checking subscription status...');

    // Create Supabase client with service role key and auth header
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the auth token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', hasSubscription: false }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    console.log('User authenticated:', user.id);

    // Get nutritionist data to fetch API token
    const { data: nutritionist, error: nutritionistError } = await supabaseClient
      .from('nutritionists')
      .select('services_api_token')
      .eq('user_id', user.id)
      .single();

    if (nutritionistError || !nutritionist?.services_api_token) {
      console.log('No nutritionist data found or missing API token');
      return new Response(
        JSON.stringify({ hasSubscription: false }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log('Fetching OTP...');

    // Fetch OTP from external service
    const otpResponse = await fetch('https://services.advisable.gr/api/services/customer/getOTP', {
      method: 'GET',
      headers: {
        'X-Customer-API-Token': nutritionist.services_api_token,
        'Content-Type': 'application/json',
      },
    });

    if (!otpResponse.ok) {
      console.error('Failed to fetch OTP:', otpResponse.status);
      return new Response(
        JSON.stringify({ hasSubscription: false }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    const otpData = await otpResponse.json();
    console.log('OTP fetched successfully');

    // Fetch active recurring services using API token
    const servicesResponse = await fetch(
      `https://services.advisable.gr/api/services/customer/services/recurring?status=active`,
      {
        method: 'GET',
        headers: {
          'X-Customer-API-Token': nutritionist.services_api_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!servicesResponse.ok) {
      console.error('Failed to fetch services:', servicesResponse.status);
      return new Response(
        JSON.stringify({ hasSubscription: false }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    const servicesData = await servicesResponse.json();
    console.log('Services data received:', JSON.stringify(servicesData).substring(0, 200));

    // Check if there are active recurring services in the correct structure
    const recurringServices = servicesData?.data?.recurring_services;
    const hasActiveSubscription = recurringServices && Array.isArray(recurringServices) && recurringServices.length > 0;

    console.log('Active subscription found:', hasActiveSubscription);

    return new Response(
      JSON.stringify({ hasSubscription: hasActiveSubscription }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in check-subscription-status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, hasSubscription: false }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
