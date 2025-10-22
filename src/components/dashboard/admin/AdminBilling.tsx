import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Loader2, RefreshCw, XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BillingInfo {
  hasSubscription: boolean;
  orderId?: string;
  subscription?: {
    id: string;
    name: string;
    price: string;
    recurringType: string;
    status: string;
    nextBillingDate: string;
    cardNumber: string;
    isCardVerification: boolean;
  };
  subscriptionActive?: boolean;
  lastChecked?: string;
}

const AdminBilling = () => {
  const { t } = useLanguage();
  const [billingData, setBillingData] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showChangeCardDialog, setShowChangeCardDialog] = useState(false);
  const [restartLoading, setRestartLoading] = useState(false);

  useEffect(() => {
    loadBillingInfo();
  }, []);

  const loadBillingInfo = async () => {
    try {
      setLoading(true);
      
      // Fetch billing info (which will trigger subscription status update)
      const { data, error } = await supabase.functions.invoke('get-billing-info');

      if (error) throw error;

      // Also fetch the subscription status from database
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: nutritionist } = await supabase
          .from('nutritionists')
          .select('subscription_active, subscription_last_checked_at')
          .eq('user_id', user.id)
          .single();

        setBillingData({
          ...data,
          subscriptionActive: nutritionist?.subscription_active,
          lastChecked: nutritionist?.subscription_last_checked_at,
        });
      } else {
        setBillingData(data);
      }
    } catch (error) {
      console.error('Error loading billing info:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to load billing information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangeCard = async () => {
    setShowChangeCardDialog(false);
    if (!billingData?.subscription) return;

    try {
      setActionLoading(true);
      
      // Get OTP for card update
      const { data, error } = await supabase.functions.invoke('get-billing-otp');

      if (error) throw error;

      const { otp } = data;
      const orderId = billingData.subscription.id;
      const redirectUrl = encodeURIComponent('https://nutritionax.com/dashboard');
      const updateUrl = `https://services.advisable.gr/customer/update_subscription/${orderId}?otp=${otp}&redirectUrl=${redirectUrl}`;

      toast({
        title: t('adminDashboard.billing.cardUpdateRedirect'),
      });

      // Redirect to Services update page
      setTimeout(() => {
        window.location.href = updateUrl;
      }, 1500);

    } catch (error) {
      console.error('Error getting OTP:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to initiate card update',
        variant: 'destructive',
      });
      setActionLoading(false);
    }
  };

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

  const handleCancelSubscription = async () => {
    try {
      setActionLoading(true);
      const orderId = billingData?.orderId;

      if (!orderId) {
        toast({
          title: t('adminDashboard.billing.noSubscription'),
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { orderId },
      });

      if (error) {
        console.error('Error cancelling subscription:', error);
        toast({
          title: t('adminDashboard.billing.cancelError'),
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: t('adminDashboard.billing.cancelSuccess'),
      });

      setShowCancelDialog(false);
      await loadBillingInfo();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: t('adminDashboard.billing.cancelError'),
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('adminDashboard.billing.title')}</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">{t('adminDashboard.billing.loadingBilling')}</span>
        </div>
      </div>
    );
  }

  if (!billingData?.hasSubscription || !billingData.subscription) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('adminDashboard.billing.title')}</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground mb-4">{t('adminDashboard.billing.noSubscription')}</p>
              <Button 
                onClick={handleRestartSubscription}
                disabled={restartLoading}
              >
                {restartLoading 
                  ? t('adminDashboard.billing.restartingSubscription')
                  : t('adminDashboard.billing.startSubscription')
                }
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { subscription } = billingData;
  const statusColor = subscription.status === 'PAID' ? 'text-green-600' : 'text-yellow-600';
  const statusText = subscription.status === 'PAID' ? t('adminDashboard.billing.active') : subscription.status;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">{t('adminDashboard.billing.title')}</h2>
        <Button variant="outline" size="sm" onClick={loadBillingInfo}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('common.loading')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('adminDashboard.billing.subscription')}</CardTitle>
          <CardDescription>
            <span className={statusColor}>● </span>
            {statusText}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Subscription Status Indicator */}
          {billingData.subscriptionActive !== undefined && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${billingData.subscriptionActive ? 'bg-green-500' : 'bg-destructive'}`} />
                <span className="font-medium">
                  {t('adminDashboard.billing.subscriptionStatus.label')}:{' '}
                  {billingData.subscriptionActive 
                    ? t('adminDashboard.billing.subscriptionStatus.active')
                    : t('adminDashboard.billing.subscriptionStatus.inactive')
                  }
                </span>
              </div>
              {billingData.lastChecked && (
                <span className="text-sm text-muted-foreground">
                  {t('adminDashboard.billing.subscriptionStatus.lastChecked')}: {new Date(billingData.lastChecked).toLocaleString('el-GR')}
                </span>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('adminDashboard.billing.productName')}</p>
              <p className="font-medium">{subscription.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('adminDashboard.billing.price')}</p>
              <p className="font-medium">{subscription.price}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('adminDashboard.billing.recurringType')}</p>
              <p className="font-medium">
                {subscription.recurringType === 'MONTHLY' 
                  ? t('adminDashboard.billing.monthly') 
                  : t('adminDashboard.billing.yearly')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('adminDashboard.billing.nextBillingDate')}</p>
              <p className="font-medium">{subscription.nextBillingDate}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <p className="text-sm text-muted-foreground mb-2">{t('adminDashboard.billing.paymentMethod')}</p>
            <div className="flex items-center gap-2 mb-6">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">
                {t('adminDashboard.billing.cardEnding')} {subscription.cardNumber}
              </span>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setShowChangeCardDialog(true)}
                disabled={actionLoading}
                className="flex-1"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                {t('adminDashboard.billing.changeCard')}
              </Button>
              <Button 
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
                disabled={actionLoading}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {t('adminDashboard.billing.cancelSubscription')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('adminDashboard.billing.cancelConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('adminDashboard.billing.cancelConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('adminDashboard.billing.cancelSubscription')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Card Confirmation Dialog */}
      <AlertDialog open={showChangeCardDialog} onOpenChange={setShowChangeCardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('adminDashboard.billing.changeCardConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('adminDashboard.billing.changeCardConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleChangeCard}>
              {t('adminDashboard.billing.changeCard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBilling;
