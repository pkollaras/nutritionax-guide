import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface RegistrationData {
  firstName: string;
  lastName: string;
  contactPhone: string;
  contactPhone2?: string;
  email: string;
  password: string;
  city: string;
  postalCode: string;
  address: string;
  region: string;
  country: string;
  county?: string;
  taxReferenceNumber?: string;
  taxOffice?: string;
  profession?: string;
  companyName?: string;
  companyAddress?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const data: RegistrationData = await req.json();
    
    console.log("Registration request received for:", data.email);

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.password || 
        !data.contactPhone || !data.city || !data.postalCode || !data.address || 
        !data.region || !data.country) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user account as nutritionist
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        name: `${data.firstName} ${data.lastName}`,
        account_type: 'nutritionist'
      }
    });

    if (userError) {
      console.error("Error creating user:", userError);
      return new Response(
        JSON.stringify({ error: userError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User created successfully:", userData.user.id);

    // Get the nutritionist record (created automatically by trigger)
    const { data: nutritionistData, error: nutritionistError } = await supabaseAdmin
      .from('nutritionists')
      .select('id')
      .eq('user_id', userData.user.id)
      .single();

    if (nutritionistError) {
      console.error("Error fetching nutritionist:", nutritionistError);
      return new Response(
        JSON.stringify({ error: "Failed to create nutritionist profile" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Nutritionist record found:", nutritionistData.id);

    // Create order record
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        nutritionist_id: nutritionistData.id,
        user_id: userData.user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        contact_phone: data.contactPhone,
        contact_phone_2: data.contactPhone2 || null,
        email: data.email,
        city: data.city,
        postal_code: data.postalCode,
        address: data.address,
        region: data.region,
        country: data.country,
        county: data.county || null,
        tax_reference_number: data.taxReferenceNumber || null,
        tax_office: data.taxOffice || null,
        profession: data.profession || null,
        company_name: data.companyName || null,
        company_address: data.companyAddress || null,
        status: 'pending'
      });

    if (orderError) {
      console.error("Error creating order:", orderError);
      // Don't fail the whole request if order creation fails
    } else {
      console.log("Order created successfully");
    }

    // Send welcome email
    try {
      await resend.emails.send({
        from: "Nutritionax <onboarding@resend.dev>",
        to: [data.email],
        subject: "Καλώς ήρθατε στο Nutritionax!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Καλώς ήρθατε στο Nutritionax!</h1>
            <p>Γεια σας ${data.firstName} ${data.lastName},</p>
            <p>Ο λογαριασμός σας έχει δημιουργηθεί επιτυχώς!</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #333; margin-top: 0;">Στοιχεία Σύνδεσης</h2>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Κωδικός:</strong> Ο κωδικός που επιλέξατε</p>
            </div>
            
            <p>Μπορείτε να συνδεθείτε στην πλατφόρμα μας εδώ:</p>
            <a href="https://nutritionax.mini-site.gr/auth" 
               style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; margin: 10px 0;">
              Σύνδεση στο Nutritionax
            </a>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <h3 style="color: #333;">Τι περιλαμβάνει η συνδρομή σας:</h3>
              <ul style="line-height: 1.8;">
                <li>Διαχείριση πελατών</li>
                <li>Παρακολούθηση προόδου</li>
                <li>Δημιουργία διατροφικών πλάνων</li>
                <li>ΑΙ δημιουργία λίστας αγορών</li>
                <li>Διαχείριση μετρήσεων σώματος</li>
              </ul>
              <p style="color: #4CAF50; font-weight: bold;">🎉 Ο πρώτος μήνας είναι ΔΩΡΕΑΝ!</p>
            </div>
            
            <p style="margin-top: 30px;">Αν έχετε οποιαδήποτε ερώτηση, μη διστάσετε να επικοινωνήσετε μαζί μας.</p>
            
            <p>Με εκτίμηση,<br>Η ομάδα του Nutritionax<br><small>by Advisable</small></p>
          </div>
        `,
      });
      console.log("Welcome email sent successfully");
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Don't fail the whole request if email sending fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Registration successful",
        userId: userData.user.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in register-nutritionist:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);