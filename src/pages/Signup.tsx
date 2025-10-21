import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";

const Signup = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    contactPhone: "",
    contactPhone2: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: "",
    postalCode: "",
    address: "",
    region: "",
    country: "Ελλάδα",
    county: "",
    taxReferenceNumber: "",
    taxOffice: "",
    profession: "Διατροφολόγος",
    companyName: "",
    companyAddress: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName || formData.firstName.length < 2) {
      newErrors.firstName = t("signup.errors.firstName");
    }
    if (!formData.lastName || formData.lastName.length < 2) {
      newErrors.lastName = t("signup.errors.lastName");
    }
    if (!formData.contactPhone || formData.contactPhone.length < 10) {
      newErrors.contactPhone = t("signup.errors.contactPhone");
    }
    if (!formData.email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = t("signup.errors.email");
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = t("signup.errors.password");
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("signup.errors.confirmPassword");
    }
    if (!formData.city || formData.city.length < 2) {
      newErrors.city = t("signup.errors.city");
    }
    if (!formData.postalCode || formData.postalCode.length < 5) {
      newErrors.postalCode = t("signup.errors.postalCode");
    }
    if (!formData.address || formData.address.length < 5) {
      newErrors.address = t("signup.errors.address");
    }
    if (!formData.region || formData.region.length < 2) {
      newErrors.region = t("signup.errors.region");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      toast({
        title: t("signup.error"),
        description: t("signup.errorMessage"),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("register-nutritionist", {
        body: formData,
      });

      if (error) throw error;

      // Store services data in sessionStorage
      if (data.servicesData) {
        sessionStorage.setItem('nutritionax_services_data', JSON.stringify(data.servicesData));
      }

      toast({
        title: t("signup.success"),
        description: t("signup.paymentRedirect"),
      });

      // Redirect to payment URL
      setTimeout(() => {
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
        } else {
          // Fallback if no payment URL
          navigate("/auth");
        }
      }, 2000);

    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: t("signup.error"),
        description: error.message || t("signup.errorMessage"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Form Section - Left/Top */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">{t("signup.title")}</CardTitle>
                <CardDescription>{t("signup.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Order Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">{t("signup.orderDetails")}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">{t("signup.firstName")} *</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={errors.firstName ? "border-destructive" : ""}
                        />
                        {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName}</p>}
                      </div>
                      <div>
                        <Label htmlFor="lastName">{t("signup.lastName")} *</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={errors.lastName ? "border-destructive" : ""}
                        />
                        {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName}</p>}
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contactPhone">{t("signup.contactPhone")} *</Label>
                        <Input
                          id="contactPhone"
                          name="contactPhone"
                          type="tel"
                          value={formData.contactPhone}
                          onChange={handleChange}
                          className={errors.contactPhone ? "border-destructive" : ""}
                        />
                        {errors.contactPhone && <p className="text-sm text-destructive mt-1">{errors.contactPhone}</p>}
                      </div>
                      <div>
                        <Label htmlFor="contactPhone2">{t("signup.contactPhone2")}</Label>
                        <Input
                          id="contactPhone2"
                          name="contactPhone2"
                          type="tel"
                          value={formData.contactPhone2}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">{t("signup.email")} *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="password">{t("signup.password")} *</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleChange}
                            className={errors.password ? "border-destructive pr-10" : "pr-10"}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.password && <p className="text-sm text-destructive mt-1">{errors.password}</p>}
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">{t("signup.confirmPassword")} *</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.confirmPassword && <p className="text-sm text-destructive mt-1">{errors.confirmPassword}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Address Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">{t("signup.addressDetails")}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">{t("signup.city")} *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className={errors.city ? "border-destructive" : ""}
                        />
                        {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
                      </div>
                      <div>
                        <Label htmlFor="postalCode">{t("signup.postalCode")} *</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleChange}
                          className={errors.postalCode ? "border-destructive" : ""}
                        />
                        {errors.postalCode && <p className="text-sm text-destructive mt-1">{errors.postalCode}</p>}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">{t("signup.address")} *</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className={errors.address ? "border-destructive" : ""}
                      />
                      {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="region">{t("signup.region")} *</Label>
                        <Input
                          id="region"
                          name="region"
                          value={formData.region}
                          onChange={handleChange}
                          className={errors.region ? "border-destructive" : ""}
                        />
                        {errors.region && <p className="text-sm text-destructive mt-1">{errors.region}</p>}
                      </div>
                      <div>
                        <Label htmlFor="country">{t("signup.country")} *</Label>
                        <Input
                          id="country"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="county">{t("signup.county")}</Label>
                      <Input
                        id="county"
                        name="county"
                        value={formData.county}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Invoicing Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">{t("signup.invoicingDetails")}</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="taxReferenceNumber">{t("signup.taxReferenceNumber")}</Label>
                        <Input
                          id="taxReferenceNumber"
                          name="taxReferenceNumber"
                          value={formData.taxReferenceNumber}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="taxOffice">{t("signup.taxOffice")}</Label>
                        <Input
                          id="taxOffice"
                          name="taxOffice"
                          value={formData.taxOffice}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="profession">{t("signup.profession")}</Label>
                      <Input
                        id="profession"
                        name="profession"
                        value={formData.profession}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="companyName">{t("signup.companyName")}</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <Label htmlFor="companyAddress">{t("signup.companyAddress")}</Label>
                      <Input
                        id="companyAddress"
                        name="companyAddress"
                        value={formData.companyAddress}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("signup.submitting")}
                      </>
                    ) : (
                      t("signup.submit")
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Card - Right/Top */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="lg:sticky lg:top-8">
              <Card className="border-primary/20 shadow-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{t("signup.pricingCard.title")}</CardTitle>
                  <div className="mt-4">
                    <div className="text-4xl font-bold text-primary">
                      {t("signup.pricingCard.price")}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {t("signup.pricingCard.vat")}
                    </div>
                  </div>
                  <div className="mt-4 bg-primary/10 text-primary font-semibold py-2 px-4 rounded-full inline-block">
                    <CheckCircle2 className="inline mr-2 h-5 w-5" />
                    {t("signup.pricingCard.freeFirstMonth")}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {["feature1", "feature2", "feature3", "feature4", "feature5"].map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{t(`landing.cta.pricing.features.${feature}`)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;