import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64, clientId } = await req.json();
    console.log('Parsing body measurements PDF for client:', clientId);

    // Security: Verify the authenticated user is a nutritionist
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

    // Check if user is admin/nutritionist
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      throw new Error('Only nutritionists can upload body measurements');
    }

    // Verify nutritionist has access to this client
    const { data: nutritionist } = await supabase
      .from('nutritionists')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!nutritionist) {
      throw new Error('Nutritionist profile not found');
    }

    const { data: relationship } = await supabase
      .from('client_nutritionists')
      .select('id')
      .eq('nutritionist_id', nutritionist.id)
      .eq('client_id', clientId)
      .single();

    if (!relationship) {
      throw new Error('You do not have access to this client');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const GEMINI_API_KEY_2 = Deno.env.get('GEMINI_API_KEY_2');
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const systemPrompt = `You are a body measurements document parser. Extract body composition data from Greek body measurement PDFs and return structured JSON.

Extract the following fields:
1. measurement_date: The date of the measurement (format: YYYY-MM-DD)
2. Skinfold measurements (7 sites, 2 measurements each in mm):
   - triceps_1, triceps_2 (Τρικέφαλος)
   - waist_1, waist_2 (Οσφύς)
   - back_1, back_2 (Πλάτη)
   - armpit_1, armpit_2 (Μασχάλη)
   - chest_1, chest_2 (Στήθος)
   - abdomen_1, abdomen_2 (Κοιλιά)
   - thigh_1, thigh_2 (Μηρός)
3. Calculated results:
   - body_fat_percentage (%BF - ποσοστό λίπους)
   - body_mass_percentage (%BM - ποσοστό μυικής μάζας)
   - fat_mass (FM in kg - λιπώδης μάζα)
   - lean_body_mass (LBM in kg - μυική μάζα)
4. notes: Any additional notes or comments (Σημειώσεις)

Return JSON with this exact structure:
{
  "measurement_date": "YYYY-MM-DD",
  "triceps_1": number,
  "triceps_2": number,
  "waist_1": number,
  "waist_2": number,
  "back_1": number,
  "back_2": number,
  "armpit_1": number,
  "armpit_2": number,
  "chest_1": number,
  "chest_2": number,
  "abdomen_1": number,
  "abdomen_2": number,
  "thigh_1": number,
  "thigh_2": number,
  "body_fat_percentage": number,
  "body_mass_percentage": number,
  "fat_mass": number,
  "lean_body_mass": number,
  "notes": "string or null"
}

All numeric values should be numbers (not strings). If a value is missing, use null.
If multiple measurements are found, return only the most recent one.`;

    // Call Google Gemini API with fallback
    const response = await callGeminiWithFallback(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key={KEY}',
      {
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nPlease analyze this body measurements PDF and extract the data according to the format specified.`
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
      },
      GEMINI_API_KEY,
      GEMINI_API_KEY_2 || null
    );

    if (!response.ok) {
      const errorText = await response.text();
      const status = response.status;
      
      console.error('Gemini API error:', status, errorText);
      
      let errorMessage = `Gemini API error: ${status}`;
      if (status === 429 || status === 403) {
        errorMessage = 'Rate limit exceeded on all available API keys. Please try again later.';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const measurementText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!measurementText) {
      throw new Error('No content returned from Gemini');
    }

    let parsedMeasurement = JSON.parse(measurementText);
    console.log('Parsed body measurement:', parsedMeasurement);
    
    // Validate the structure
    if (!parsedMeasurement || typeof parsedMeasurement !== 'object') {
      throw new Error('Invalid measurement format');
    }

    return new Response(
      JSON.stringify({ success: true, measurement: parsedMeasurement }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-body-measurements-pdf:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
