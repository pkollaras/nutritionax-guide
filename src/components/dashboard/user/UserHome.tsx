import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface MealGroup {
  meal_number: number;
  items: string[];
}

const UserHome = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [todayMeals, setTodayMeals] = useState<MealGroup[]>([]);
  const [weight, setWeight] = useState('');
  const [toiletVisits, setToiletVisits] = useState('');
  const [morningBM, setMorningBM] = useState(false);
  const [notes, setNotes] = useState('');
  const [dayOfDiet, setDayOfDiet] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealGroup | null>(null);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [replacementText, setReplacementText] = useState('');

  const today = new Date();
  
  // English day names for database queries
  const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayNameEN = DAYS_EN[today.getDay()];
  
  // Translated day names for display
  const DAYS = [
    t('days.sunday'), t('days.monday'), t('days.tuesday'), t('days.wednesday'),
    t('days.thursday'), t('days.friday'), t('days.saturday')
  ];
  const todayName = DAYS[today.getDay()];

  useEffect(() => {
    const checkAndFetchData = () => {
      const currentDate = new Date().toISOString().split('T')[0];
      const storedDate = localStorage.getItem('userHomeDateCheck');
      
      // If date changed, clear all fields first
      if (storedDate && storedDate !== currentDate) {
        setWeight('');
        setToiletVisits('');
        setMorningBM(false);
        setNotes('');
        // Auto-increment day of diet
        setDayOfDiet((prev) => {
          if (prev && !isNaN(parseInt(prev))) {
            return (parseInt(prev) + 1).toString();
          }
          return prev;
        });
      }
      
      // Update stored date
      localStorage.setItem('userHomeDateCheck', currentDate);
      
      // Fetch data for today (will be empty if no data exists)
      fetchData();
    };
    
    // Check immediately on mount
    checkAndFetchData();
    
    // Check every minute
    const interval = setInterval(checkAndFetchData, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch today's diet plan (use English day name for query)
    const { data: dietData } = await supabase
      .from('diet_plans')
      .select('meals')
      .eq('user_id', user?.id)
      .eq('day_of_week', todayNameEN)
      .maybeSingle();

    if (dietData && Array.isArray(dietData.meals)) {
      setTodayMeals(dietData.meals as unknown as MealGroup[]);
    }

    // Fetch today's progress report if exists
    const todayDate = today.toISOString().split('T')[0];
    const { data: reportData } = await supabase
      .from('progress_reports')
      .select('*')
      .eq('user_id', user?.id)
      .eq('date', todayDate)
      .maybeSingle();

    if (reportData) {
      // Load existing data for today
      setWeight(reportData.weight?.toString() || '');
      setToiletVisits(reportData.wc?.toString() || '');
      setMorningBM(reportData.morning_bm || false);
      setNotes(reportData.notes || '');
      setDayOfDiet(reportData.day_of_diet?.toString() || '');
    }
    // If no data exists, fields remain empty (from the date change clear)
  };

  const handleSkipMeal = (meal: MealGroup) => {
    setSelectedMeal(meal);
    setShowSkipDialog(true);
  };

  const confirmSkipMeal = () => {
    if (!selectedMeal) return;
    
    const mealItems = selectedMeal.items.join(', ');
    const noteText = `Παράκαμψη γεύματος ${selectedMeal.meal_number} (${mealItems})`;
    
    setNotes(prev => prev ? `${prev}\n${noteText}` : noteText);
    
    setShowSkipDialog(false);
    setSelectedMeal(null);
    
    toast({ 
      title: t('common.success'), 
      description: t('userDashboard.home.mealActionRecorded')
    });
  };

  const handleReplaceMeal = (meal: MealGroup) => {
    setSelectedMeal(meal);
    setShowReplaceDialog(true);
  };

  const confirmReplaceMeal = () => {
    if (!selectedMeal || !replacementText.trim()) return;
    
    const mealItems = selectedMeal.items.join(', ');
    const noteText = `Αντικατάσταση γεύματος ${selectedMeal.meal_number} (${mealItems}) → με (${replacementText})`;
    
    setNotes(prev => prev ? `${prev}\n${noteText}` : noteText);
    
    setShowReplaceDialog(false);
    setSelectedMeal(null);
    setReplacementText('');
    
    toast({ 
      title: t('common.success'), 
      description: t('userDashboard.home.mealActionRecorded')
    });
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    const todayDate = today.toISOString().split('T')[0];

    try {
      const { error } = await supabase
        .from('progress_reports')
        .upsert({
          user_id: user.id,
          date: todayDate,
          weight: weight ? parseFloat(weight) : null,
          wc: toiletVisits ? parseFloat(toiletVisits) : null,
          morning_bm: morningBM,
          notes,
          day_of_diet: dayOfDiet ? parseInt(dayOfDiet) : null,
        }, {
          onConflict: 'user_id,date'
        });

      if (error) throw error;

      toast({ title: t('common.success'), description: t('userDashboard.home.saveSuccess') });
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{todayName}</h1>
        <p className="text-muted-foreground">
          {today.toLocaleDateString()} • {dayOfDiet ? t('userDashboard.home.dayOfDiet', { day: dayOfDiet }) : t('userDashboard.home.dietTracking')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('userDashboard.home.mealsToday')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {todayMeals.length > 0 ? (
            todayMeals.map((mealGroup) => (
              <div key={mealGroup.meal_number} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{t('userDashboard.home.meal')} {mealGroup.meal_number}</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSkipMeal(mealGroup)}
                    >
                      {t('userDashboard.home.mealSkipped')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReplaceMeal(mealGroup)}
                    >
                      {t('userDashboard.home.mealReplaced')}
                    </Button>
                  </div>
                </div>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {mealGroup.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t('userDashboard.home.noMealsToday')}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('userDashboard.home.progressToday')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">{t('userDashboard.home.weight')}</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="75.5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dayOfDiet">{t('userDashboard.home.dayOfDietLabel')}</Label>
            <Input
              id="dayOfDiet"
              type="number"
              min="1"
              value={dayOfDiet}
              onChange={(e) => setDayOfDiet(e.target.value)}
              placeholder="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="toiletVisits">{t('userDashboard.home.toiletVisits')}</Label>
            <Input
              id="toiletVisits"
              type="number"
              min="0"
              max="20"
              value={toiletVisits}
              onChange={(e) => setToiletVisits(e.target.value)}
              placeholder={t('userDashboard.home.numberOfTimes')}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="morningBM"
              checked={morningBM}
              onCheckedChange={(checked) => setMorningBM(checked === true)}
            />
            <Label htmlFor="morningBM" className="cursor-pointer">
              {t('userDashboard.home.morningBowelMovement')}
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('userDashboard.home.notes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('userDashboard.home.notesPlaceholder')}
              rows={5}
            />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? t('common.saving') : t('userDashboard.home.saveProgress')}
          </Button>
        </CardContent>
      </Card>

      {/* Skip Meal Dialog */}
      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedMeal && `Παρακάμψατε το Γεύμα ${selectedMeal.meal_number};`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMeal && `Το γεύμα περιείχε: ${selectedMeal.items.join(', ')}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSkipMeal}>
              {t('userDashboard.home.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Replace Meal Dialog */}
      <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedMeal && `Αντικαταστήσατε το Γεύμα ${selectedMeal.meal_number};`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedMeal && `Το γεύμα περιείχε: ${selectedMeal.items.join(', ')}`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="replacement">{t('userDashboard.home.replaceWithLabel')}</Label>
            <Input
              id="replacement"
              value={replacementText}
              onChange={(e) => setReplacementText(e.target.value)}
              placeholder={t('userDashboard.home.replaceWithPlaceholder')}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReplacementText('')}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmReplaceMeal}
              disabled={!replacementText.trim()}
            >
              {t('userDashboard.home.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserHome;
