import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileText, Save, User } from 'lucide-react';

const AdminSettings = () => {
  const { user, nutritionistId } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Default Guidelines state
  const [defaultGuidelines, setDefaultGuidelines] = useState('');
  const [defaultGuidelinesId, setDefaultGuidelinesId] = useState<string | null>(null);

  // Profile state
  const [nutritionistName, setNutritionistName] = useState('');
  const [nutritionistEmail, setNutritionistEmail] = useState('');

  // Load data on mount
  useEffect(() => {
    if (nutritionistId) {
      loadDefaultGuidelines();
      loadNutritionistProfile();
    }
  }, [nutritionistId]);

  const loadDefaultGuidelines = async () => {
    if (!nutritionistId) return;

    try {
      const { data, error } = await supabase
        .from('default_guidelines')
        .select('*')
        .eq('nutritionist_id', nutritionistId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setDefaultGuidelines(data.content);
        setDefaultGuidelinesId(data.id);
      }
    } catch (error) {
      console.error('Error loading default guidelines:', error);
    }
  };

  const loadNutritionistProfile = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('nutritionists')
        .select('name, email')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setNutritionistName(data.name);
        setNutritionistEmail(data.email);
      }
    } catch (error) {
      console.error('Error loading nutritionist profile:', error);
    }
  };

  const handleSaveDefaultGuidelines = async () => {
    if (!nutritionistId) return;

    setLoading(true);
    try {
      if (defaultGuidelinesId) {
        // Update existing
        const { error } = await supabase
          .from('default_guidelines')
          .update({ content: defaultGuidelines })
          .eq('id', defaultGuidelinesId);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('default_guidelines')
          .insert({
            nutritionist_id: nutritionistId,
            content: defaultGuidelines,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setDefaultGuidelinesId(data.id);
      }

      toast({
        title: t('adminDashboard.settings.defaultGuidelines.saveSuccess'),
      });
    } catch (error) {
      console.error('Error saving default guidelines:', error);
      toast({
        title: 'Error',
        description: 'Failed to save default guidelines',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !nutritionistId) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(
        `https://kigmecfevnbzmobvmumm.supabase.co/functions/v1/parse-guidelines-pdf`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Failed to parse PDF');

      const result = await response.json();
      setDefaultGuidelines(result.content);

      toast({
        title: 'Success',
        description: 'PDF parsed successfully',
      });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to parse PDF',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleUpdateProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('nutritionists')
        .update({ name: nutritionistName })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: t('adminDashboard.settings.profile.updateSuccess'),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">{t('adminDashboard.settings.title')}</h1>
      </div>

      {/* Default Guidelines Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('adminDashboard.settings.defaultGuidelines.title')}
          </CardTitle>
          <CardDescription>
            {t('adminDashboard.settings.defaultGuidelines.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={defaultGuidelines}
            onChange={(e) => setDefaultGuidelines(e.target.value)}
            placeholder={t('adminDashboard.settings.defaultGuidelines.placeholder')}
            className="min-h-[300px]"
          />
          <div className="flex gap-2">
            <Button onClick={handleSaveDefaultGuidelines} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {t('adminDashboard.settings.defaultGuidelines.saveGuidelines')}
            </Button>
            <Button variant="outline" disabled={uploading} asChild>
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <FileText className="mr-2 h-4 w-4" />
                {uploading ? 'Uploading...' : t('adminDashboard.settings.defaultGuidelines.uploadPdf')}
                <input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('adminDashboard.settings.profile.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('adminDashboard.settings.profile.name')}</Label>
            <Input
              id="name"
              value={nutritionistName}
              onChange={(e) => setNutritionistName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('adminDashboard.settings.profile.email')}</Label>
            <Input
              id="email"
              value={nutritionistEmail}
              disabled
              className="bg-muted"
            />
          </div>
          <Button onClick={handleUpdateProfile} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {t('adminDashboard.settings.profile.updateProfile')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
