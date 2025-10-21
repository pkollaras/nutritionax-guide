import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Getting OTP for user:', user.id);

    // Get nutritionist's API token from database
    const { data: nutritionist, error: nutritionistError } = await supabase
      .from('nutritionists')
      .select('services_api_token')
      .eq('user_id', user.id)
      .single();

    if (nutritionistError || !nutritionist?.services_api_token) {
      console.error('No API token found:', nutritionistError);
      return new Response(
        JSON.stringify({ error: 'No API token found for nutritionist' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found API token, fetching OTP from Services...');

    // Get OTP from Advisable Services
    const otpResponse = await fetch(
      'https://services.advisable.gr/api/services/customer/getOTP',
      {
        method: 'GET',
        headers: {
          'X-Customer-API-Token': nutritionist.services_api_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!otpResponse.ok) {
      console.error('Failed to get OTP:', otpResponse.status);
      const errorText = await otpResponse.text();
      console.error('Error response:', errorText);
      throw new Error('Failed to get OTP from Services');
    }

    const otpData = await otpResponse.json();
    console.log('OTP received successfully');

    return new Response(
      JSON.stringify({ otp: otpData.data.otp }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-billing-otp:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
