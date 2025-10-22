import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const SubscriptionOverlay = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [restartLoading, setRestartLoading] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;

      // Exempt specific users from subscription check
      if (user.email === 'nutritionax@gmail.com' || user.email === 'advisable@nutritionax.com') {
        setHasSubscription(true);
        setLoading(false);
        return;
      }

      try {
        // Check subscription status from database
        const { data: nutritionist, error } = await supabase
          .from('nutritionists')
          .select('subscription_active')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking subscription:', error);
          setHasSubscription(true); // Default to true on error to avoid blocking
        } else {
          setHasSubscription(nutritionist?.subscription_active || false);
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

  const handleRestartSubscription = async () => {
    try {
      setRestartLoading(true);
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: t('adminDashboard.billing.restartError'),
          description: 'Please login first',
          variant: 'destructive',
        });
        window.location.href = '/auth';
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('restart-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        console.error('Error restarting subscription:', error);
        toast({
          title: t('adminDashboard.billing.restartError'),
          variant: 'destructive',
        });
        return;
      }

      if (data?.requiresSignup) {
        // No existing credentials, redirect to signup
        window.location.href = '/signup';
        return;
      }

      if (data?.paymentUrl) {
        // Redirect to payment URL
        window.location.href = data.paymentUrl;
      }
    } catch (error) {
      console.error('Error restarting subscription:', error);
      toast({
        title: t('adminDashboard.billing.restartError'),
        variant: 'destructive',
      });
    } finally {
      setRestartLoading(false);
    }
  };

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
        <CardContent className="space-y-2">
          <Button 
            onClick={handleRestartSubscription}
            className="w-full"
            disabled={restartLoading}
          >
            {restartLoading 
              ? t('adminDashboard.billing.restartingSubscription')
              : t('adminDashboard.subscriptionOverlay.renew')
            }
          </Button>
          <Button 
            onClick={signOut}
            variant="ghost"
            className="w-full"
            disabled={restartLoading}
          >
            {t('auth.signOut')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
