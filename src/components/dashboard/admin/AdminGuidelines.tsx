import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Upload } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
const AdminGuidelines = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { nutritionistId } = useAuth();
  const [users, setUsers] = useState<Array<{
    id: string;
    name: string;
    email: string;
  }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userGuidelines, setUserGuidelines] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [userGuidelineId, setUserGuidelineId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (nutritionistId) {
      fetchUsers();
    }
  }, [nutritionistId]);
  useEffect(() => {
    if (selectedUserId) {
      fetchUserGuidelines(selectedUserId);
    }
  }, [selectedUserId]);
  const fetchUsers = async () => {
    if (!nutritionistId) return;
    
    const { data } = await supabase
      .from('profiles')
      .select(`
        id, 
        name, 
        email,
        client_nutritionists!inner(nutritionist_id)
      `)
      .eq('client_nutritionists.nutritionist_id', nutritionistId)
      .order('name');
    
    if (data) {
      setUsers(data);
    }
  };
  const fetchUserGuidelines = async (userId: string) => {
    if (!nutritionistId) return;
    
    setUserLoading(true);
    const { data } = await supabase
      .from('guidelines')
      .select('*')
      .eq('user_id', userId)
      .eq('nutritionist_id', nutritionistId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setUserGuidelines(data.content);
      setUserGuidelineId(data.id);
    } else {
      setUserGuidelines('');
      setUserGuidelineId(null);
    }
    setUserLoading(false);
  };
  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!selectedUserId) {
      toast({
        title: t('common.error'),
        description: t('adminDashboard.guidelines.selectUserFirst'),
        variant: 'destructive'
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t('common.error'),
        description: t('adminDashboard.guidelines.fileTooLarge'),
        variant: 'destructive'
      });
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async e => {
        const base64 = e.target?.result?.toString().split(',')[1];
        const {
          data,
          error
        } = await supabase.functions.invoke('parse-guidelines-pdf', {
          body: {
            pdfBase64: base64,
            userId: selectedUserId
          }
        });
        if (error) throw error;
        if (data?.content) {
          setUserGuidelines(data.content);
          toast({
            title: t('common.success'),
            description: t('adminDashboard.guidelines.pdfParsedSuccess')
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('PDF upload error:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('adminDashboard.guidelines.pdfParseFailed'),
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };
  const handleSaveUserGuidelines = async () => {
    if (!selectedUserId) {
      toast({
        title: t('common.error'),
        description: t('adminDashboard.guidelines.selectUserFirst'),
        variant: 'destructive'
      });
      return;
    }
    
    if (!nutritionistId) {
      toast({
        title: t('common.error'),
        description: 'Nutritionist ID not found',
        variant: 'destructive'
      });
      return;
    }
    
    setUserLoading(true);
    try {
      if (userGuidelineId) {
        const { error } = await supabase
          .from('guidelines')
          .update({ content: userGuidelines })
          .eq('id', userGuidelineId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('guidelines')
          .insert({
            content: userGuidelines,
            user_id: selectedUserId,
            nutritionist_id: nutritionistId
          });
        if (error) throw error;
      }
      toast({
        title: t('common.success'),
        description: t('adminDashboard.guidelines.saveSuccess')
      });
      fetchUserGuidelines(selectedUserId);
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUserLoading(false);
    }
  };
  return <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{t('adminDashboard.guidelines.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('adminDashboard.guidelines.manageTitle')}</CardTitle>
          <CardDescription>
            {t('adminDashboard.guidelines.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">{t('adminDashboard.guidelines.selectUser')}</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder={t('adminDashboard.guidelines.selectUserPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          {selectedUserId && <>
              <div className="flex gap-2">
                <Input type="file" accept=".pdf" onChange={handlePdfUpload} disabled={uploading} className="hidden" id="guidelines-pdf-upload" />
                <label htmlFor="guidelines-pdf-upload">
                  <Button variant="outline" disabled={uploading} asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? t('common.uploading') : t('adminDashboard.guidelines.uploadPdf')}
                    </span>
                  </Button>
                </label>
              </div>
              
              <Textarea value={userGuidelines} onChange={e => setUserGuidelines(e.target.value)} placeholder={t('adminDashboard.guidelines.guidelinesPlaceholder')} rows={20} className="font-mono" />
              <Button onClick={handleSaveUserGuidelines} disabled={userLoading}>
                <Save className="mr-2 h-4 w-4" />
                {userLoading ? t('common.saving') : t('adminDashboard.guidelines.saveGuidelines')}
              </Button>
            </>}
        </CardContent>
      </Card>
    </div>;
};
export default AdminGuidelines;