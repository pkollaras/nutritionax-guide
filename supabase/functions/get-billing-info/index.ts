import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecurringService {
  id: string;
  name: string;
  price: string;
  recurring_type: string;
  status: string;
  next_recurring_billing_date: string;
  CardNum: string;
  is_card_verification: string;
}

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

    console.log('Getting billing info for user:', user.id);

    // Get nutritionist's API token from database
    const { data: nutritionist, error: nutritionistError } = await supabase
      .from('nutritionists')
      .select('services_api_token, services_customer_id')
      .eq('user_id', user.id)
      .single();

    if (nutritionistError || !nutritionist?.services_api_token) {
      console.log('No API token found for nutritionist');
      return new Response(
        JSON.stringify({ hasSubscription: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found API token, fetching OTP...');

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
      throw new Error('Failed to get OTP from Services');
    }

    const otpData = await otpResponse.json();
    console.log('OTP received, fetching recurring services...');

    // Get recurring services (active subscriptions)
    const servicesResponse = await fetch(
      'https://services.advisable.gr/api/services/customer/services/recurring?status=active',
      {
        method: 'GET',
        headers: {
          'X-Customer-API-Token': nutritionist.services_api_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!servicesResponse.ok) {
      console.error('Failed to get recurring services:', servicesResponse.status);
      throw new Error('Failed to get recurring services');
    }

    const servicesData = await servicesResponse.json();
    console.log('Services data received:', servicesData);

    // Check if there are any active subscriptions
    if (!servicesData.data?.recurring_services || servicesData.data.recurring_services.length === 0) {
      return new Response(
        JSON.stringify({ hasSubscription: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the first active subscription
    const service: RecurringService = servicesData.data.recurring_services[0];

    const billingInfo = {
      hasSubscription: true,
      subscription: {
        id: service.id,
        name: service.name,
        price: parseFloat(service.price || '0').toFixed(2),
        recurringType: service.recurring_type,
        status: service.status,
        nextBillingDate: service.next_recurring_billing_date,
        cardNumber: service.CardNum,
        isCardVerification: service.is_card_verification === "1",
      },
    };

    console.log('Billing info compiled successfully');

    return new Response(
      JSON.stringify(billingInfo),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-billing-info:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        hasSubscription: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
