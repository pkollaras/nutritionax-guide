import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Upload } from 'lucide-react';
const AdminGuidelines = () => {
  const {
    toast
  } = useToast();
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
    fetchUsers();
  }, []);
  useEffect(() => {
    if (selectedUserId) {
      fetchUserGuidelines(selectedUserId);
    }
  }, [selectedUserId]);
  const fetchUsers = async () => {
    const {
      data
    } = await supabase.from('profiles').select('id, name, email').order('name');
    if (data) {
      setUsers(data);
    }
  };
  const fetchUserGuidelines = async (userId: string) => {
    setUserLoading(true);
    const {
      data
    } = await supabase.from('guidelines').select('*').eq('user_id', userId).order('created_at', {
      ascending: false
    }).limit(1).maybeSingle();
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
        title: 'Error',
        description: 'Please select a user first',
        variant: 'destructive'
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 10MB',
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
            title: 'Success',
            description: 'PDF parsed successfully. You can now edit and save the guidelines.'
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('PDF upload error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to parse PDF',
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
        title: 'Error',
        description: 'Please select a user first',
        variant: 'destructive'
      });
      return;
    }
    setUserLoading(true);
    try {
      if (userGuidelineId) {
        const {
          error
        } = await supabase.from('guidelines').update({
          content: userGuidelines
        }).eq('id', userGuidelineId);
        if (error) throw error;
      } else {
        const {
          error
        } = await supabase.from('guidelines').insert({
          content: userGuidelines,
          user_id: selectedUserId
        });
        if (error) throw error;
      }
      toast({
        title: 'Success',
        description: 'User guidelines saved successfully'
      });
      fetchUserGuidelines(selectedUserId);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setUserLoading(false);
    }
  };
  return <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">User Guidelines</h1>

      <Card>
        <CardHeader>
          <CardTitle>Manage User Guidelines</CardTitle>
          <CardDescription>
            Select a user and manage their personal dietary guidelines. You can type directly or upload a PDF to extract the content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select User</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user..." />
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
                
              </div>
              
              <Textarea value={userGuidelines} onChange={e => setUserGuidelines(e.target.value)} placeholder="Enter dietary guidelines for this user or upload a PDF..." rows={20} className="font-mono" />
              <Button onClick={handleSaveUserGuidelines} disabled={userLoading}>
                <Save className="mr-2 h-4 w-4" />
                {userLoading ? 'Saving...' : 'Save User Guidelines'}
              </Button>
            </>}
        </CardContent>
      </Card>
    </div>;
};
export default AdminGuidelines;