import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { Resend } from 'npm:resend@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create a Supabase client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get the authorization token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the caller's token and get their user ID
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the caller has admin role using the has_role function
    const { data: isAdmin, error: roleError } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.error('Role verification error:', roleError, 'isAdmin:', isAdmin);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the request body
    const { action, email, password, name, userId, sendEmail, newPassword } = await req.json();

    if (action === 'create') {
      // Create a new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

      if (createError) {
        console.error('Error creating user:', createError);
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User created successfully:', newUser.user.id);

      // Send welcome email if requested
      if (sendEmail) {
        try {
          const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
          await resend.emails.send({
            from: 'Nutritionax <onboarding@resend.dev>',
            to: [email],
            subject: 'Καλώς ήρθατε στο Nutritionax',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Καλώς ήρθατε στο Nutritionax!</h1>
                <p style="font-size: 16px; line-height: 1.6;">
                  Ο λογαριασμός σας έχει ανοίξει. Σε λίγο θα είναι διαθέσιμη και η δίαιτά σας.
                </p>
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="font-size: 16px; margin: 10px 0;">
                    <strong>Μπορείτε να συνδεθείτε στο:</strong><br>
                    <a href="https://nutritionax.mini-site.gr/" style="color: #0066cc;">https://nutritionax.mini-site.gr/</a>
                  </p>
                  <p style="font-size: 16px; margin: 10px 0;">
                    <strong>Email:</strong> ${email}
                  </p>
                  <p style="font-size: 16px; margin: 10px 0;">
                    <strong>Κωδικός:</strong> ${password}
                  </p>
                </div>
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  Με εκτίμηση,<br>
                  Το Nutritionax Team
                </p>
              </div>
            `,
          });
          console.log('Welcome email sent successfully to:', email);
        } catch (emailError: any) {
          console.error('Error sending welcome email:', emailError);
          // Don't fail user creation if email fails
        }
      }

      return new Response(
        JSON.stringify({ success: true, user: newUser.user }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'delete') {
      // Delete a user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User deleted successfully:', userId);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'update-password') {
      // Validate input
      if (!userId || !newPassword) {
        return new Response(
          JSON.stringify({ error: 'Missing userId or newPassword' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 6 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update user password using admin API
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        console.error('Error updating password:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Password updated successfully for user:', userId);
      
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error: any) {
    console.error('Error in manage-users function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
