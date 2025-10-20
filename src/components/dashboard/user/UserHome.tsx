import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface MealGroup {
  meal_number: number;
  items: string[];
}

const UserHome = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todayMeals, setTodayMeals] = useState<MealGroup[]>([]);
  const [weight, setWeight] = useState('');
  const [toiletVisits, setToiletVisits] = useState('');
  const [morningBM, setMorningBM] = useState(false);
  const [notes, setNotes] = useState('');
  const [dayOfDiet, setDayOfDiet] = useState('');
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const todayName = DAYS[today.getDay()];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user) return;

    // Fetch today's diet plan
    const { data: dietData } = await supabase
      .from('diet_plans')
      .select('meals')
      .eq('user_id', user?.id)
      .eq('day_of_week', todayName)
      .single();

    if (dietData && Array.isArray(dietData.meals)) {
      setTodayMeals(dietData.meals as unknown as MealGroup[]);
    }

    // Fetch today's progress report
    const todayDate = today.toISOString().split('T')[0];
    const { data: reportData } = await supabase
      .from('progress_reports')
      .select('*')
      .eq('user_id', user?.id)
      .eq('date', todayDate)
      .single();

    if (reportData) {
      setWeight(reportData.weight?.toString() || '');
      setToiletVisits(reportData.wc?.toString() || '');
      setMorningBM(reportData.morning_bm || false);
      setNotes(reportData.notes || '');
      setDayOfDiet(reportData.day_of_diet?.toString() || '');
    }
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

      toast({ title: 'Success', description: 'Progress saved successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{todayName}</h1>
        <p className="text-muted-foreground">
          {today.toLocaleDateString()} • {dayOfDiet ? `Day ${dayOfDiet} of Diet` : 'Diet Tracking'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Meals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {todayMeals.length > 0 ? (
            todayMeals.map((mealGroup) => (
              <div key={mealGroup.meal_number}>
                <h3 className="font-semibold mb-2">Meal {mealGroup.meal_number}</h3>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  {mealGroup.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No meals planned for today</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today's Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
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
            <Label htmlFor="dayOfDiet">Day of Diet</Label>
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
            <Label htmlFor="toiletVisits">Toilet Visits (per day)</Label>
            <Input
              id="toiletVisits"
              type="number"
              min="0"
              max="20"
              value={toiletVisits}
              onChange={(e) => setToiletVisits(e.target.value)}
              placeholder="Number of times"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="morningBM"
              checked={morningBM}
              onCheckedChange={(checked) => setMorningBM(checked === true)}
            />
            <Label htmlFor="morningBM" className="cursor-pointer">
              Had bowel movement in the morning
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Deviations / Comments</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any observations, deviations from the plan, or comments..."
              rows={5}
            />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Saving...' : 'Save Progress'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserHome;
