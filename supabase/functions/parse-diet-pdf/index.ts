import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64, userId } = await req.json();
    console.log('Parsing diet PDF for user:', userId);

    // Security: Verify the authenticated user matches the requested userId
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    if (user.id !== userId) {
      throw new Error('Cannot upload diet for another user');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Call Gemini with vision to parse the diet plan from PDF
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a diet plan parser. Extract diet information from Greek diet plans and return JSON.
            
Map Greek days to English:
- ΔΕΥΤΕΡΑ = Monday
- ΤΡΙΤΗ = Tuesday  
- ΤΕΤΑΡΤΗ = Wednesday
- ΠΕΜΠΤΗ = Thursday
- ΠΑΡΑΣΚΕΥΗ = Friday
- ΣΑΒΒΑΤΟ = Saturday
- ΚΥΡΙΑΚΗ = Sunday
- ΔΕΥΤΕΡΑ-ΠΕΜΠΤΗ = Monday (apply to Monday, Tuesday, Wednesday, Thursday)
- ΤΡΙΤΗ-ΠΑΡΑΣΚΕΥΗ = Tuesday (apply to Tuesday, Wednesday, Thursday, Friday)

Return JSON with this structure:
{
  "Monday": ["meal1 text", "meal2 text", "meal3 text", "meal4 text", "meal5 text"],
  "Tuesday": ["meal1 text", ...],
  ...
}

Extract all food items for each meal (Γεύμα) including quantities. Keep the original Greek text.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this diet plan PDF and extract the meal information according to the format specified.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const dietPlan = JSON.parse(data.choices[0].message.content);
    console.log('Parsed diet plan:', dietPlan);

    // Save to database (reuse supabase client from auth check)
    // Delete existing diet plans for this user
    await supabase
      .from('diet_plans')
      .delete()
      .eq('user_id', userId);

    // Insert new diet plans
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (const day of days) {
      if (dietPlan[day]) {
        const { error } = await supabase
          .from('diet_plans')
          .insert({
            user_id: userId,
            day_of_week: day,
            meals: dietPlan[day]
          });

        if (error) {
          console.error(`Error inserting ${day}:`, error);
          throw error;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, dietPlan }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-diet-pdf:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});