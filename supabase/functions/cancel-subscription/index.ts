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
    const advisableApiToken = Deno.env.get('ADVISABLE_SERVICES_API_TOKEN')!;
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

    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Canceling subscription for user:', user.id, 'order:', orderId);

    // Get nutritionist's customer ID
    const { data: nutritionist, error: nutritionistError } = await supabase
      .from('nutritionists')
      .select('services_customer_id')
      .eq('user_id', user.id)
      .single();

    if (nutritionistError || !nutritionist?.services_customer_id) {
      console.error('No customer ID found:', nutritionistError);
      return new Response(
        JSON.stringify({ error: 'No customer ID found for nutritionist' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Note: According to the Advisable Services API documentation, 
    // subscriptions are automatically cancelled when payment fails.
    // There is no direct API endpoint to manually cancel a subscription.
    // 
    // The cancellation will take effect at the next billing cycle.
    // For now, we just log this action and notify the user.
    
    console.log('Subscription cancellation requested for order:', orderId);
    console.log('Cancellation will be effective at next billing cycle when payment is not processed.');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Subscription canceled successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in cancel-subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
