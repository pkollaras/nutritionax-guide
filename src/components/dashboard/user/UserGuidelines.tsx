import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const UserGuidelines = () => {
  const { user } = useAuth();
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
        <p className="text-muted-foreground">Loading guidelines...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">General Guidelines</h1>
        <p className="text-muted-foreground">Your personalized dietary guidelines</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          {guidelines ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{guidelines}</p>
          ) : (
            <div className="text-muted-foreground text-sm space-y-2">
              <p>You haven't set up your personal guidelines yet.</p>
              <p className="text-xs">These are the default guidelines provided by your administrator. You can customize them anytime in your profile settings.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserGuidelines;
