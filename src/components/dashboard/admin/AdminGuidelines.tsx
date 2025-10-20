import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const AdminGuidelines = () => {
  const { toast } = useToast();
  
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userGuidelines, setUserGuidelines] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [userGuidelineId, setUserGuidelineId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserGuidelines(selectedUserId);
    }
  }, [selectedUserId]);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email')
      .order('name');

    if (data) {
      setUsers(data);
    }
  };

  const fetchUserGuidelines = async (userId: string) => {
    setUserLoading(true);
    const { data } = await supabase
      .from('guidelines')
      .select('*')
      .eq('user_id', userId)
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

  const handleSaveUserGuidelines = async () => {
    if (!selectedUserId) {
      toast({ title: 'Error', description: 'Please select a user first', variant: 'destructive' });
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
            user_id: selectedUserId
          });

        if (error) throw error;
      }

      toast({ title: 'Success', description: 'User guidelines saved successfully' });
      fetchUserGuidelines(selectedUserId);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUserLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">User Guidelines</h1>

      <Card>
        <CardHeader>
          <CardTitle>Manage User Guidelines</CardTitle>
          <CardDescription>
            Select a user and manage their personal dietary guidelines.
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
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedUserId && (
            <>
              <Textarea
                value={userGuidelines}
                onChange={(e) => setUserGuidelines(e.target.value)}
                placeholder="Enter dietary guidelines for this user..."
                rows={20}
                className="font-mono"
              />
              <Button onClick={handleSaveUserGuidelines} disabled={userLoading}>
                <Save className="mr-2 h-4 w-4" />
                {userLoading ? 'Saving...' : 'Save User Guidelines'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGuidelines;
