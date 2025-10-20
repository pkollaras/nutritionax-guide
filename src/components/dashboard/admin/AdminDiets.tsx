import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AdminDiets = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [dietPlans, setDietPlans] = useState<any>({});
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Diet Plans</h1>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Saving...' : 'Save Plan'}
        </Button>
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
