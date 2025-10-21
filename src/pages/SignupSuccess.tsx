import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2 } from "lucide-react";

const SignupSuccess = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [countdown, setCountdown] = useState(5);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleAutoLogin = async (email: string, password: string) => {
    setIsLoggingIn(true);
    try {
      const { error } = await signIn(email, password);
      if (!error) {
        // Clear credentials from storage
        sessionStorage.removeItem('nutritionax_signup_credentials');
        sessionStorage.removeItem('nutritionax_services_data');
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        console.error("Auto-login failed:", error);
        setIsLoggingIn(false);
      }
    } catch (err) {
      console.error("Auto-login error:", err);
      setIsLoggingIn(false);
    }
  };

  const handleLoginNow = () => {
    const credentialsStr = sessionStorage.getItem('nutritionax_signup_credentials');
    if (credentialsStr) {
      const credentials = JSON.parse(credentialsStr);
      handleAutoLogin(credentials.email, credentials.password);
    }
  };

  useEffect(() => {
    // Check if we're in a popup window (opened from Signup page)
    if (window.opener && !window.opener.closed) {
      console.log("Running in popup context, sending success message to parent");
      
      // Send success message to parent window
      window.opener.postMessage(
        { type: 'PAYMENT_SUCCESS' },
        window.location.origin
      );
      
      // Don't render anything in popup - parent will close it
      return;
    }

    // Normal flow: Check for credentials and start countdown
    const servicesDataStr = sessionStorage.getItem('nutritionax_services_data');
    const credentialsStr = sessionStorage.getItem('nutritionax_signup_credentials');
    
    if (servicesDataStr) {
      console.log("Payment completed for customer:", JSON.parse(servicesDataStr));
    }

    if (credentialsStr) {
      const credentials = JSON.parse(credentialsStr);
      
      // Start countdown for auto-login
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            // Trigger auto login
            handleAutoLogin(credentials.email, credentials.password);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      // No credentials, just clean up session storage
      if (servicesDataStr) {
        sessionStorage.removeItem('nutritionax_services_data');
      }
    }
  }, []);

  // If we're in a popup, don't render anything
  if (window.opener && !window.opener.closed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center pt-6">
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state during login
  if (isLoggingIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-lg font-semibold">{t("signup.success.loggingIn")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if we have credentials for auto-login
  const hasCredentials = sessionStorage.getItem('nutritionax_signup_credentials');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">{t("signup.success.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {t("signup.success.message")}
          </p>
          <p className="text-sm">
            {t("signup.success.emailSent")}
          </p>
          
          {hasCredentials && countdown > 0 && (
            <div className="space-y-3 py-4">
              <div className="text-lg font-semibold text-primary">
                {t("signup.success.autoLogin").replace("{seconds}", countdown.toString())}
              </div>
              <Progress value={(5 - countdown) * 20} className="w-full" />
              <Button 
                onClick={handleLoginNow} 
                className="w-full"
                size="lg"
              >
                {t("signup.success.loginButton")}
              </Button>
            </div>
          )}
          
          {!hasCredentials && (
            <Button 
              onClick={() => navigate("/auth")} 
              className="w-full"
              size="lg"
            >
              {t("signup.success.loginButton")}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupSuccess;
