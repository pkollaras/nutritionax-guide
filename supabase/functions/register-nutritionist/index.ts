import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

interface ServicesCustomerData {
  provider: string;
  friendly_name: string;
  first_name: string;
  last_name: string;
  email: string;
  address: string;
  city: string;
  postal_code: string;
  phone: string;
  company_afm?: string;
  company_doy?: string;
  company_name?: string;
  company_profession?: string;
  company_address?: string;
}

interface ServicesCustomerResponse {
  data: {
    customer_id: number;
    services_api_token: string;
  };
}

interface ServicesOTPResponse {
  data: {
    otp: string;
  };
}

// Helper function to create customer in Advisable Services
async function createServicesCustomer(customerData: ServicesCustomerData): Promise<ServicesCustomerResponse> {
  const servicesApiToken = Deno.env.get("ADVISABLE_SERVICES_API_TOKEN")!;
  const servicesUrl = "https://services.advisable.gr";
  
  console.log("Creating customer in Advisable Services...");
  
  const response = await fetch(`${servicesUrl}/api/services/admin/customer`, {
    method: 'POST',
    headers: {
      'X-Advisable-API-Token': servicesApiToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Services API error:", errorText);
    throw new Error(`Failed to create customer in Services: ${response.statusText}`);
  }
  
  const result = await response.json();
  console.log("Services customer created:", result);
  return result;
}

// Helper function to get OTP
async function getServicesOTP(customerApiToken: string): Promise<string> {
  const servicesUrl = "https://services.advisable.gr";
  
  console.log("Getting OTP from Services...");
  
  const response = await fetch(`${servicesUrl}/api/services/customer/getOTP`, {
    method: 'GET',
    headers: {
      'X-Customer-API-Token': customerApiToken,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("OTP API error:", errorText);
    throw new Error(`Failed to get OTP: ${response.statusText}`);
  }
  
  const data: ServicesOTPResponse = await response.json();
  console.log("OTP obtained successfully");
  return data.data.otp;
}

// Helper function to generate begin subscription URL
function generateBeginSubscriptionUrl(otp: string): string {
  const servicesUrl = "https://services.advisable.gr";
  const redirectUrl = encodeURIComponent("https://nutritionax.com/signup-success");
  const productCodeId = 1237;
  const quantity = 1;
  
  return `${servicesUrl}/customer/begin_subscription/${productCodeId}:${quantity}?otp=${otp}&redirectUrl=${redirectUrl}`;
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

    // STEP 1: Create Customer in Advisable Services
    console.log("STEP 1: Creating customer in Advisable Services...");
    const servicesCustomerData: ServicesCustomerData = {
      provider: "nutritionax",
      friendly_name: `${data.firstName} ${data.lastName}`,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      address: data.address,
      city: data.city,
      postal_code: data.postalCode,
      phone: data.contactPhone,
      company_afm: data.taxReferenceNumber,
      company_doy: data.taxOffice,
      company_name: data.companyName,
      company_profession: data.profession,
      company_address: data.companyAddress,
    };
    
    const servicesResponse = await createServicesCustomer(servicesCustomerData);
    const { customer_id, services_api_token } = servicesResponse.data;
    
    console.log("Services customer created with ID:", customer_id);
    
    // STEP 2: Get OTP for this customer
    console.log("STEP 2: Getting OTP for customer...");
    const otp = await getServicesOTP(services_api_token);
    console.log("OTP obtained successfully");

    // STEP 3: Create user in Supabase Auth
    console.log("STEP 3: Creating user in Supabase Auth...");
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        name: `${data.firstName} ${data.lastName}`,
        account_type: 'nutritionist',
        services_customer_id: customer_id,
        services_api_token: services_api_token,
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

    // STEP 4: Get and update the nutritionist record with Services data
    console.log("STEP 4: Updating nutritionist with Services data...");
    const { data: nutritionistData, error: nutritionistError } = await supabaseAdmin
      .from('nutritionists')
      .update({
        services_customer_id: customer_id,
        services_api_token: services_api_token,
      })
      .eq('user_id', userData.user.id)
      .select('id')
      .single();

    if (nutritionistError) {
      console.error("Error updating nutritionist:", nutritionistError);
      return new Response(
        JSON.stringify({ error: "Failed to update nutritionist profile with Services data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Nutritionist record updated with Services data:", nutritionistData.id);

    // STEP 5: Create order record in local database
    console.log("STEP 5: Creating order record...");
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

    // STEP 6: Send welcome email
    console.log("STEP 6: Sending welcome email...");
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
            
            <p>Ολοκληρώστε την πληρωμή σας για να ενεργοποιηθεί ο λογαριασμός σας.</p>
            <p>Μετά την ολοκλήρωση, μπορείτε να συνδεθείτε στην πλατφόρμα μας εδώ:</p>
            <a href="https://nutritionax.com/auth" 
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

    // STEP 7: Generate payment URL and return
    console.log("STEP 7: Generating payment URL...");
    const paymentUrl = generateBeginSubscriptionUrl(otp);
    console.log("Payment URL generated:", paymentUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Registration successful",
        userId: userData.user.id,
        paymentUrl: paymentUrl,
        servicesData: {
          customer_id: customer_id,
          services_api_token: services_api_token,
        }
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