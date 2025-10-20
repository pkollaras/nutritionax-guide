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

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    // Allow admins to upload for any user, but regular users can only upload for themselves
    if (user.id !== userId && !isAdmin) {
      throw new Error('Cannot upload diet for another user');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const systemPrompt = `You are a diet plan parser. Extract diet information from Greek diet plans and return JSON.
            
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

Extract all food items for each meal (Γεύμα) including quantities. Keep the original Greek text.`;

    // Call Google Gemini API directly with vision to parse the diet plan from PDF
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nPlease analyze this diet plan PDF and extract the meal information according to the format specified.`
              },
              {
                inline_data: {
                  mime_type: 'application/pdf',
                  data: pdfBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: 'application/json'
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const dietPlanText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!dietPlanText) {
      throw new Error('No content returned from Gemini');
    }
    const dietPlan = JSON.parse(dietPlanText);
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