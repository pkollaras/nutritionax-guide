import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Save, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const UserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user?.id)
      .single();

    if (data) {
      setName(data.name);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', user?.id);

      if (error) throw error;

      toast({ title: t('common.success'), description: t('userDashboard.profile.saveSuccess') });
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{t('userDashboard.profile.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('userDashboard.profile.personalInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('userDashboard.profile.fullName')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('userDashboard.profile.email')}</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
            />
          </div>

          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? t('common.saving') : t('userDashboard.profile.saveChanges')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('userDashboard.profile.contactNutritionax')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a href="mailto:nutritionax@gmail.com">
              <Mail className="mr-2 h-4 w-4" />
              nutritionax@gmail.com
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
