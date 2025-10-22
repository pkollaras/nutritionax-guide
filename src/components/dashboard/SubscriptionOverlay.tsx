import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export const SubscriptionOverlay = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;

      // Exempt nutritionax@gmail.com from subscription check
      if (user.email === 'nutritionax@gmail.com') {
        setHasSubscription(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-subscription-status');
        
        if (error) {
          console.error('Error checking subscription:', error);
          setHasSubscription(true); // Default to true on error to avoid blocking
        } else {
          setHasSubscription(data?.hasSubscription || false);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setHasSubscription(true); // Default to true on error
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  if (loading || hasSubscription === null || hasSubscription) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <CardTitle>{t('adminDashboard.subscriptionOverlay.title')}</CardTitle>
          </div>
          <CardDescription>
            {t('adminDashboard.subscriptionOverlay.message')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => navigate('/signup')}
            className="w-full"
          >
            {t('adminDashboard.subscriptionOverlay.renew')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
