import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecurringService {
  id: number;
  product_id: number;
  customer_id: number;
  price: string;
  next_recurring_billing_date: string;
  card_number: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    
    // Service Role Client for database operations (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // User Client for authentication (when called by user)
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    // Try to get the authenticated user first
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    
    // If there's no authenticated user, treat as cron call
    const isCronCall = !user || userError;
    
    console.log('Update subscription status called:', { 
      isCronCall,
      hasUser: !!user,
      timestamp: new Date().toISOString() 
    });

    if (isCronCall) {
      // Cron job: Update all nutritionists
      await updateAllNutritionists(supabaseAdmin);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All nutritionists updated',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // User-triggered: Update specific nutritionist
      if (!user) {
        console.error('No authenticated user found');
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await updateNutritionistSubscription(supabaseAdmin, user.id);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Subscription status updated',
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in update-subscription-status:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function updateAllNutritionists(supabaseClient: any) {
  console.log('Starting bulk update of all nutritionists');
  
  // Get all nutritionists with API tokens
  const { data: nutritionists, error } = await supabaseClient
    .from('nutritionists')
    .select('id, user_id, services_api_token, services_customer_id, email')
    .not('services_api_token', 'is', null);

  if (error) {
    console.error('Error fetching nutritionists:', error);
    throw error;
  }

  console.log(`Found ${nutritionists?.length || 0} nutritionists to update`);

  // Update each nutritionist
  const results = await Promise.allSettled(
    (nutritionists || []).map((nutritionist: any) => 
      updateSingleNutritionist(supabaseClient, nutritionist)
    )
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`Bulk update complete: ${successful} successful, ${failed} failed`);
}

async function updateNutritionistSubscription(supabaseClient: any, userId: string) {
  console.log('Updating subscription for user:', userId);
  
  // Get nutritionist data
  const { data: nutritionist, error } = await supabaseClient
    .from('nutritionists')
    .select('id, services_api_token, services_customer_id, email')
    .eq('user_id', userId)
    .single();

  if (error || !nutritionist) {
    console.error('Error fetching nutritionist:', error);
    throw new Error('Nutritionist not found');
  }

  await updateSingleNutritionist(supabaseClient, nutritionist);
}

async function updateSingleNutritionist(supabaseClient: any, nutritionist: any) {
  const { id, services_api_token, services_customer_id, email } = nutritionist;
  
  console.log(`Updating subscription for nutritionist: ${email}`);

  if (!services_api_token) {
    console.log(`No API token for ${email}, skipping`);
    return;
  }

  try {
    // Get OTP
    const otpResponse = await fetch('https://services.advisable.gr/api/services/customer/getOTP', {
      method: 'GET',
      headers: {
        'X-Customer-API-Token': services_api_token,
        'Content-Type': 'application/json',
      },
    });

    if (!otpResponse.ok) {
      console.error(`Failed to get OTP for ${email}:`, otpResponse.status);
      return;
    }

    const otpData = await otpResponse.json();
    const otp = otpData.data.otp;

    // Get recurring services
    const servicesResponse = await fetch(
      `https://services.advisable.gr/api/services/customer/services/recurring?status=active`,
      {
        method: 'GET',
        headers: {
          'X-Customer-API-Token': services_api_token,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!servicesResponse.ok) {
      console.error(`Failed to fetch services for ${email}:`, servicesResponse.status);
      return;
    }

    const servicesData = await servicesResponse.json();
    console.log('Services data received:', JSON.stringify(servicesData).substring(0, 200));
    
    // Check if there are active recurring services in the correct structure
    const recurringServices = servicesData?.data?.recurring_services;
    
    // Check if there's an active subscription
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let isActive = false;
    let nextBillingDate = null;

    if (recurringServices && Array.isArray(recurringServices) && recurringServices.length > 0) {
      const activeService = recurringServices[0];
      const nextBilling = new Date(activeService.next_recurring_billing_date);
      nextBilling.setHours(0, 0, 0, 0);
      
      isActive = nextBilling > today;
      nextBillingDate = activeService.next_recurring_billing_date;
      
      console.log(`Subscription check for ${email}:`, {
        nextBilling: nextBillingDate,
        today: today.toISOString().split('T')[0],
        isActive,
        hasRecurringServices: true
      });
    } else {
      console.log(`No active services found for ${email}`);
    }

    // Update database
    const { error: updateError } = await supabaseClient
      .from('nutritionists')
      .update({
        subscription_active: isActive,
        subscription_next_billing_date: nextBillingDate,
        subscription_last_checked_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error(`Error updating database for ${email}:`, updateError);
      throw updateError;
    }

    console.log(`Successfully updated ${email}: active=${isActive}`);
  } catch (error) {
    console.error(`Error processing ${email}:`, error);
    throw error;
  }
}
