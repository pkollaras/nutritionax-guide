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

    // Note: According to the Advisable Services docs, there's no direct API endpoint
    // to cancel a subscription. The system automatically cancels it when payment fails.
    // 
    // As a workaround, we'll send a notification email to Advisable Services
    // or we could use the admin API if we have access.
    //
    // For now, we'll call the admin API to update the order's is_recurring to 0

    const cancelResponse = await fetch(
      'https://services.advisable.gr/api/services/admin/orders',
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${advisableApiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: orderId,
          customer_id: nutritionist.services_customer_id,
          is_recurring: 0,
        }),
      }
    );

    if (!cancelResponse.ok) {
      console.error('Failed to cancel subscription:', cancelResponse.status);
      const errorText = await cancelResponse.text();
      console.error('Error response:', errorText);
      
      // If the admin API doesn't work, we could send an email notification instead
      throw new Error('Failed to cancel subscription. Please contact support.');
    }

    const cancelData = await cancelResponse.json();
    console.log('Subscription canceled successfully:', cancelData);

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
