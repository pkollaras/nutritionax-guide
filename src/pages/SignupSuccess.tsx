import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const SignupSuccess = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

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

    // Normal flow: Clear session storage after successful signup
    const servicesData = sessionStorage.getItem('nutritionax_services_data');
    if (servicesData) {
      console.log("Payment completed for customer:", JSON.parse(servicesData));
      sessionStorage.removeItem('nutritionax_services_data');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
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
          <Button 
            onClick={() => navigate("/auth")} 
            className="w-full"
            size="lg"
          >
            {t("signup.success.loginButton")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupSuccess;
