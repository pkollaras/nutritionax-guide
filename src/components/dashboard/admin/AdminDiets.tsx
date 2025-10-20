import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Upload } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AdminDiets = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [dietPlans, setDietPlans] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchDietPlan(selectedUser);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    setUsers(data || []);
  };

  const fetchDietPlan = async (userId: string) => {
    const { data } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('user_id', userId);

    const plansObj: any = {};
    data?.forEach((plan) => {
      plansObj[plan.day_of_week] = plan.meals;
    });
    setDietPlans(plansObj);
  };

  const handleSave = async () => {
    if (!selectedUser) {
      toast({ title: 'Error', description: 'Please select a user', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      for (const day of DAYS) {
        const meals = dietPlans[day] || [];

        await supabase
          .from('diet_plans')
          .upsert({
            user_id: selectedUser,
            day_of_week: day,
            meals,
          }, {
            onConflict: 'user_id,day_of_week'
          });
      }

      toast({ title: 'Success', description: 'Diet plan saved successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateMeal = (day: string, mealIndex: number, content: string) => {
    const currentMeals = dietPlans[day] || ['', '', '', '', ''];
    const newMeals = [...currentMeals];
    newMeals[mealIndex] = content;
    setDietPlans({ ...dietPlans, [day]: newMeals });
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedUser) {
      toast({ 
        title: 'Error', 
        description: 'Please select a user first', 
        variant: 'destructive' 
      });
      return;
    }

    if (file.type !== 'application/pdf') {
      toast({ 
        title: 'Error', 
        description: 'Please upload a PDF file', 
        variant: 'destructive' 
      });
      return;
    }

    setUploading(true);

    try {
      // Convert PDF to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix to get just the base64 string
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      
      reader.readAsDataURL(file);
      const pdfBase64 = await base64Promise;
      
      // Call edge function to parse PDF with Gemini Vision
      const { data, error } = await supabase.functions.invoke('parse-diet-pdf', {
        body: { 
          pdfBase64,
          userId: selectedUser 
        }
      });

      if (error) throw error;

      toast({ 
        title: 'Success', 
        description: 'Diet plan uploaded and parsed successfully' 
      });
      
      // Refresh the diet plans
      fetchDietPlan(selectedUser);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('PDF upload error:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to parse PDF', 
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Diet Plans</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={!selectedUser || uploading}
            variant="outline"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handlePdfUpload}
            className="hidden"
          />
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Plan'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select User</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedUser && (
        <div className="space-y-4">
          {DAYS.map((day) => (
            <Card key={day}>
              <CardHeader>
                <CardTitle>{day}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[0, 1, 2, 3, 4].map((mealIndex) => (
                  <div key={mealIndex} className="space-y-2">
                    <Label>Meal {mealIndex + 1}</Label>
                    <Textarea
                      placeholder={`Describe meal ${mealIndex + 1}...`}
                      value={(dietPlans[day] || [])[mealIndex] || ''}
                      onChange={(e) => updateMeal(day, mealIndex, e.target.value)}
                      rows={3}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDiets;
