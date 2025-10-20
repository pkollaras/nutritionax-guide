import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callGeminiWithFallback(
  endpoint: string,
  body: any,
  primaryKey: string,
  secondaryKey: string | null
): Promise<Response> {
  console.log('Attempting Gemini API call with primary key...');
  
  const primaryResponse = await fetch(endpoint.replace('{KEY}', primaryKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (primaryResponse.ok || !secondaryKey) {
    if (primaryResponse.ok) {
      console.log('Primary key successful');
    }
    return primaryResponse;
  }

  const status = primaryResponse.status;
  if (status === 429 || status === 403) {
    console.log(`Primary key rate limited (${status}), trying secondary key...`);
    
    const secondaryResponse = await fetch(endpoint.replace('{KEY}', secondaryKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (secondaryResponse.ok) {
      console.log('Secondary key successful');
    } else {
      console.log(`Secondary key also failed: ${secondaryResponse.status}`);
    }
    
    return secondaryResponse;
  }

  return primaryResponse;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all diet plans for the user
    const { data: dietPlans, error: dietError } = await supabaseClient
      .from('diet_plans')
      .select('*')
      .eq('user_id', userId);

    if (dietError) {
      console.error('Error fetching diet plans:', dietError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch diet plans' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!dietPlans || dietPlans.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No diet plan found',
          message: 'Please upload your diet plan first to generate a shopping list' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract all meals from all days
    const allMeals = dietPlans.flatMap(day => {
      const meals = day.meals || [];
      return meals.map((meal: any) => ({
        day: day.day_of_week,
        ...meal
      }));
    });

    // Prepare prompt for Gemini
    const prompt = `Είσαι βοηθός για τη δημιουργία λίστας αγορών από ελληνικό πρόγραμμα διατροφής. Ανάλυσε τα γεύματα της εβδομάδας και δημιούργησε μια πλήρη λίστα αγορών.

Τα Γεύματα της Εβδομάδας:
${JSON.stringify(allMeals, null, 2)}

ΕΡΓΑΣΙΑ:
1. Εξάγε όλα τα συστατικά από όλα τα γεύματα
2. Συγκέντρωσε διπλότυπα είδη (π.χ., αν τα αυγά αναφέρονται 3 φορές, άθροισε τις ποσότητες)
3. Ομαδοποίησε τα είδη σε κατηγορίες:
   - Λαχανικά (Vegetables)
   - Πρωτεΐνες (Proteins) 
   - Γαλακτοκομικά (Dairy)
   - Φρούτα (Fruits)
   - Δημητριακά & Ζυμαρικά (Grains)
   - Άλλα (Other)

4. Κράτησε τα ελληνικά ονόματα και τις μονάδες μέτρησης
5. Υπολόγισε τις συνολικές ποσότητες που χρειάζονται για την εβδομάδα

ΜΟΡΦΗ ΑΠΑΝΤΗΣΗΣ (JSON):
{
  "categories": [
    {
      "name": "Λαχανικά",
      "items": [
        { "name": "Ντομάτα", "quantity": "1kg", "notes": "Φρέσκια" }
      ]
    }
  ],
  "summary": "Σύντομη περίληψη της λίστας αγορών στα ελληνικά"
}

Απάντησε ΜΟΝΟ με το JSON object, χωρίς επιπλέον κείμενο.`;

    // Call Gemini API with fallback
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const GEMINI_API_KEY_2 = Deno.env.get('GEMINI_API_KEY_2');

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiResponse = await callGeminiWithFallback(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={KEY}',
      {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 4096,
        }
      },
      GEMINI_API_KEY,
      GEMINI_API_KEY_2 || null
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      const status = geminiResponse.status;
      
      console.error('Gemini API error:', status, errorText);
      
      let errorMessage = 'AI service unavailable';
      if (status === 429 || status === 403) {
        errorMessage = 'Rate limit exceeded on all available API keys. Please try again later.';
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates[0].content.parts[0].text;
    
    // Parse the AI response
    let parsedData;
    try {
      // Remove markdown code blocks if present
      let cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // If response is truncated, try to find the last complete JSON object
      if (!cleanedResponse.endsWith('}') && !cleanedResponse.endsWith(']')) {
        console.warn('Response appears truncated, attempting to recover...');
        // Find the last complete object/array closing
        const lastBrace = cleanedResponse.lastIndexOf('}');
        const lastBracket = cleanedResponse.lastIndexOf(']');
        const cutPoint = Math.max(lastBrace, lastBracket);
        if (cutPoint > 0) {
          cleanedResponse = cleanedResponse.substring(0, cutPoint + 1);
        }
      }
      
      parsedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response. The shopping list might be too long. Please try again.',
          rawResponse: aiResponse.substring(0, 500)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate week start date (Monday of current week)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // Calculate days since last Monday
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysSinceMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekStartDate = weekStart.toISOString().split('T')[0];

    // Save to database
    const { data: savedList, error: saveError } = await supabaseClient
      .from('shopping_lists')
      .upsert({
        user_id: userId,
        week_start_date: weekStartDate,
        generated_content: parsedData.summary || 'Lista de compras generada',
        items: parsedData.categories || []
      }, {
        onConflict: 'user_id,week_start_date'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving shopping list:', saveError);
      // Return the data anyway but inform about save issue
      return new Response(
        JSON.stringify({ 
          ...parsedData,
          warning: 'Shopping list generated but not saved',
          weekStartDate
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        categories: parsedData.categories || [],
        summary: parsedData.summary || '',
        weekStartDate: savedList.week_start_date,
        createdAt: savedList.created_at
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
