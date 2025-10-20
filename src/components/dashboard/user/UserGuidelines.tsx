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
        <p className="text-muted-foreground">Φόρτωση οδηγιών...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Γενικές Οδηγίες</h1>
        <p className="text-muted-foreground">Οι εξατομικευμένες διατροφικές σας οδηγίες</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Οδηγίες</CardTitle>
        </CardHeader>
        <CardContent>
          {guidelines ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{guidelines}</p>
          ) : (
            <div className="text-muted-foreground text-sm space-y-2">
              <p>Δεν έχετε ορίσει τις προσωπικές σας οδηγίες ακόμα.</p>
              <p className="text-xs">Αυτές είναι οι προεπιλεγμένες οδηγίες από τον διαχειριστή σας. Μπορείτε να τις προσαρμόσετε ανά πάσα στιγμή στις ρυθμίσεις του προφίλ σας.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserGuidelines;
