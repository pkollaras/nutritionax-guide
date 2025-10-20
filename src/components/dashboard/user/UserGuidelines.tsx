import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const UserGuidelines = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [guidelines, setGuidelines] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const fetchGuidelines = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: guideData } = await supabase
        .from('guidelines')
        .select('content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (guideData) setGuidelines(guideData.content);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('userDashboard.guidelines.title')}</h1>
        <p className="text-muted-foreground">{t('userDashboard.guidelines.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('userDashboard.guidelines.cardTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {guidelines ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{guidelines}</p>
          ) : (
            <div className="text-muted-foreground text-sm space-y-2">
              <p>{t('userDashboard.guidelines.noGuidelines')}</p>
              <p className="text-xs">{t('userDashboard.guidelines.defaultGuidelines')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserGuidelines;
