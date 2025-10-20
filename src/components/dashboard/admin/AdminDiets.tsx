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
import { useLanguage } from '@/contexts/LanguageContext';

// English day names for database (must match database values)
const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const AdminDiets = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [dietPlans, setDietPlans] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Translated day names for display
  const DAYS = [
    t('days.monday'), t('days.tuesday'), t('days.wednesday'), t('days.thursday'),
    t('days.friday'), t('days.saturday'), t('days.sunday')
  ];

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
      const meals = plan.meals as any;
      
      // Handle both old format (string array) and new format (MealGroup array)
      if (Array.isArray(meals) && meals.length > 0) {
        if (typeof meals[0] === 'string') {
          // Old format: convert strings to MealGroup objects
          plansObj[plan.day_of_week] = meals.map((mealText: string, index: number) => ({
            meal_number: index + 1,
            items: [mealText]
          }));
        } else {
          // New format: already MealGroup objects
          plansObj[plan.day_of_week] = meals;
        }
      } else {
        plansObj[plan.day_of_week] = [];
      }
    });
    setDietPlans(plansObj);
  };

  const handleSave = async () => {
    if (!selectedUser) {
      toast({ 
        title: t('common.error'), 
        description: t('adminDashboard.diets.selectUser'), 
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);

    try {
      // Use English day names for database operations
      for (const dayEN of DAYS_EN) {
        const meals = dietPlans[dayEN] || [];

        await supabase
          .from('diet_plans')
          .upsert({
            user_id: selectedUser,
            day_of_week: dayEN,
            meals,
          }, {
            onConflict: 'user_id,day_of_week'
          });
      }

      toast({ 
        title: t('common.success'), 
        description: t('adminDashboard.diets.saveSuccess') 
      });
    } catch (error: any) {
      toast({ 
        title: t('common.error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMeal = (dayEN: string, mealIndex: number, content: string) => {
    const currentMeals = dietPlans[dayEN] || [
      { meal_number: 1, items: [] },
      { meal_number: 2, items: [] },
      { meal_number: 3, items: [] },
      { meal_number: 4, items: [] },
      { meal_number: 5, items: [] }
    ];
    const newMeals = [...currentMeals];
    
    // Split content by lines to create items array
    const items = content.split('\n').filter(line => line.trim() !== '');
    newMeals[mealIndex] = {
      meal_number: mealIndex + 1,
      items: items
    };
    
    setDietPlans({ ...dietPlans, [dayEN]: newMeals });
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedUser) {
      toast({ 
        title: t('common.error'), 
        description: t('adminDashboard.diets.selectUserFirst'), 
        variant: 'destructive' 
      });
      return;
    }

    if (file.type !== 'application/pdf') {
      toast({ 
        title: t('common.error'), 
        description: t('adminDashboard.diets.onlyPdf'), 
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
        title: t('common.success'), 
        description: t('adminDashboard.diets.uploadSuccess') 
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
        title: t('common.error'), 
        description: error.message || t('adminDashboard.diets.parseFailed'), 
        variant: 'destructive' 
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('adminDashboard.diets.title')}</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={!selectedUser || uploading}
            variant="outline"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? t('common.uploading') : t('adminDashboard.diets.uploadPdf')}
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
            {loading ? t('common.saving') : t('adminDashboard.diets.saveProgram')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('adminDashboard.diets.selectUserTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder={t('adminDashboard.diets.selectUserPlaceholder')} />
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
          {DAYS.map((day, index) => {
            const dayEN = DAYS_EN[index];
            return (
              <Card key={dayEN}>
                <CardHeader>
                  <CardTitle>{day}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[0, 1, 2, 3, 4].map((mealIndex) => {
                    const mealGroup = (dietPlans[dayEN] || [])[mealIndex] || { meal_number: mealIndex + 1, items: [] };
                    // Ensure items is an array before calling join
                    const mealText = Array.isArray(mealGroup.items) ? mealGroup.items.join('\n') : '';
                    
                    return (
                      <div key={mealIndex} className="space-y-2">
                        <Label>{t('adminDashboard.diets.meal')} {mealIndex + 1}</Label>
                        <Textarea
                          placeholder={t('adminDashboard.diets.mealPlaceholder', { number: mealIndex + 1 })}
                          value={mealText}
                          onChange={(e) => updateMeal(dayEN, mealIndex, e.target.value)}
                          rows={5}
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminDiets;
