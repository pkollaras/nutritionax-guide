import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const AdminGuidelines = () => {
  const { user } = useAuth();
  const [guidelines, setGuidelines] = useState('');
  const [loading, setLoading] = useState(false);
  const [guidelineId, setGuidelineId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const fetchGuidelines = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('guidelines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setGuidelines(data.content);
      setGuidelineId(data.id);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);

    try {
      if (guidelineId) {
        const { error } = await supabase
          .from('guidelines')
          .update({ content: guidelines })
          .eq('id', guidelineId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('guidelines')
          .insert({ 
            content: guidelines,
            user_id: user.id 
          });

        if (error) throw error;
      }

      toast({ title: 'Success', description: 'Guidelines saved successfully' });
      fetchGuidelines();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">General Guidelines</h1>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Saving...' : 'Save Guidelines'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Your Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
            placeholder="Enter your general dietary guidelines..."
            rows={20}
            className="font-mono"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGuidelines;
