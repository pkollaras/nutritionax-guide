import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Call Gemini API
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'AI service unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates[0].content.parts[0].text;
    
    // Parse the AI response
    let parsedData;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate week start date (Monday of current week)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Sunday = 0, Monday = 1
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diff);
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
        ...parsedData,
        id: savedList.id,
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
