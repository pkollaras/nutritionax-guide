import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Save, Star } from 'lucide-react';

const AdminGuidelines = () => {
  const { user } = useAuth();
  const [guidelines, setGuidelines] = useState('');
  const [loading, setLoading] = useState(false);
  const [guidelineId, setGuidelineId] = useState<string | null>(null);
  const [isDefault, setIsDefault] = useState(false);
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
      .maybeSingle();

    if (data) {
      setGuidelines(data.content);
      setGuidelineId(data.id);
      setIsDefault(data.is_default || false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);

    try {
      if (guidelineId) {
        const { error } = await supabase
          .from('guidelines')
          .update({ 
            content: guidelines,
            is_default: isDefault 
          })
          .eq('id', guidelineId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('guidelines')
          .insert({ 
            content: guidelines,
            user_id: user.id,
            is_default: isDefault
          });

        if (error) throw error;
      }

      toast({ 
        title: 'Success', 
        description: isDefault 
          ? 'Guidelines saved as default for new users' 
          : 'Guidelines saved successfully' 
      });
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
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            General Guidelines
            {isDefault && (
              <Badge variant="default" className="gap-1">
                <Star className="h-3 w-3" />
                Default for New Users
              </Badge>
            )}
          </h1>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Saving...' : 'Save Guidelines'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Your Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
            placeholder="Enter your general dietary guidelines..."
            rows={20}
            className="font-mono"
          />
          
          <div className="flex items-center space-x-2 pt-4 border-t">
            <Switch
              id="default-toggle"
              checked={isDefault}
              onCheckedChange={setIsDefault}
            />
            <Label htmlFor="default-toggle" className="cursor-pointer">
              Set as default guidelines for new users
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGuidelines;
