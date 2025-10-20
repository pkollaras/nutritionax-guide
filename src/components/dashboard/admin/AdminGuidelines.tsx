import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Save, Users, User } from 'lucide-react';

const AdminGuidelines = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Personal guidelines
  const [personalGuidelines, setPersonalGuidelines] = useState('');
  const [personalLoading, setPersonalLoading] = useState(false);
  const [personalGuidelineId, setPersonalGuidelineId] = useState<string | null>(null);
  
  // Default guidelines
  const [defaultGuidelines, setDefaultGuidelines] = useState('');
  const [defaultLoading, setDefaultLoading] = useState(false);
  const [defaultGuidelineId, setDefaultGuidelineId] = useState<string | null>(null);

  // User guidelines management
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userGuidelines, setUserGuidelines] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [userGuidelineId, setUserGuidelineId] = useState<string | null>(null);

  useEffect(() => {
    fetchPersonalGuidelines();
    fetchDefaultGuidelines();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserGuidelines(selectedUserId);
    }
  }, [selectedUserId]);

  const fetchPersonalGuidelines = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('guidelines')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setPersonalGuidelines(data.content);
      setPersonalGuidelineId(data.id);
    }
  };

  const fetchDefaultGuidelines = async () => {
    const { data } = await supabase
      .from('default_guidelines')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setDefaultGuidelines(data.content);
      setDefaultGuidelineId(data.id);
    }
  };

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

  const handleSavePersonal = async () => {
    if (!user) return;
    
    setPersonalLoading(true);

    try {
      if (personalGuidelineId) {
        const { error } = await supabase
          .from('guidelines')
          .update({ content: personalGuidelines })
          .eq('id', personalGuidelineId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('guidelines')
          .insert({ 
            content: personalGuidelines,
            user_id: user.id
          });

        if (error) throw error;
      }

      toast({ title: 'Success', description: 'Personal guidelines saved successfully' });
      fetchPersonalGuidelines();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setPersonalLoading(false);
    }
  };

  const handleSaveDefault = async () => {
    setDefaultLoading(true);

    try {
      if (defaultGuidelineId) {
        const { error } = await supabase
          .from('default_guidelines')
          .update({ content: defaultGuidelines })
          .eq('id', defaultGuidelineId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('default_guidelines')
          .insert({ content: defaultGuidelines });

        if (error) throw error;
      }

      toast({ 
        title: 'Success', 
        description: 'Default guidelines saved successfully. New users will receive these guidelines.' 
      });
      fetchDefaultGuidelines();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDefaultLoading(false);
    }
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
      <h1 className="text-3xl font-bold">Guidelines Management</h1>

      <Tabs defaultValue="default" className="space-y-6">
        <TabsList>
          <TabsTrigger value="default" className="gap-2">
            <Users className="h-4 w-4" />
            Default Guidelines
          </TabsTrigger>
          <TabsTrigger value="user" className="gap-2">
            <User className="h-4 w-4" />
            User Guidelines
          </TabsTrigger>
          <TabsTrigger value="personal" className="gap-2">
            <Save className="h-4 w-4" />
            My Personal Guidelines
          </TabsTrigger>
        </TabsList>

        <TabsContent value="default">
          <Card>
            <CardHeader>
              <CardTitle>Default Guidelines for New Users</CardTitle>
              <CardDescription>
                These guidelines will be automatically copied to all new users when they sign up.
                Existing users won't be affected by changes here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={defaultGuidelines}
                onChange={(e) => setDefaultGuidelines(e.target.value)}
                placeholder="Enter the default dietary guidelines that new users will receive..."
                rows={20}
                className="font-mono"
              />
              <Button onClick={handleSaveDefault} disabled={defaultLoading}>
                <Save className="mr-2 h-4 w-4" />
                {defaultLoading ? 'Saving...' : 'Save Default Guidelines'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user">
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
        </TabsContent>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>My Personal Guidelines</CardTitle>
              <CardDescription>
                These are your personal dietary guidelines, separate from the default guidelines for new users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={personalGuidelines}
                onChange={(e) => setPersonalGuidelines(e.target.value)}
                placeholder="Enter your personal dietary guidelines..."
                rows={20}
                className="font-mono"
              />
              <Button onClick={handleSavePersonal} disabled={personalLoading}>
                <Save className="mr-2 h-4 w-4" />
                {personalLoading ? 'Saving...' : 'Save Personal Guidelines'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminGuidelines;
