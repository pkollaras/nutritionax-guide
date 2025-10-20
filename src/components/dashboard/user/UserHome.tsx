import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const UserHome = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [guidelines, setGuidelines] = useState('');
  const [todayMeals, setTodayMeals] = useState<string[]>([]);
  const [weight, setWeight] = useState('');
  const [wc, setWc] = useState('');
  const [notes, setNotes] = useState('');
  const [dayOfDiet, setDayOfDiet] = useState(1);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const todayName = DAYS[today.getDay()];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user) return;

    // Fetch user's guidelines
    const { data: guideData } = await supabase
      .from('guidelines')
      .select('content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (guideData) setGuidelines(guideData.content);

    // Fetch today's diet plan
    const { data: dietData } = await supabase
      .from('diet_plans')
      .select('meals')
      .eq('user_id', user?.id)
      .eq('day_of_week', todayName)
      .single();

    if (dietData && Array.isArray(dietData.meals)) {
      setTodayMeals(dietData.meals.filter((m): m is string => typeof m === 'string'));
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
      setWc(reportData.wc?.toString() || '');
      setNotes(reportData.notes || '');
      setDayOfDiet(reportData.day_of_diet || 1);
    } else {
      // Calculate day of diet based on previous reports
      const { data: allReports } = await supabase
        .from('progress_reports')
        .select('day_of_diet')
        .eq('user_id', user?.id)
        .order('date', { ascending: false })
        .limit(1);

      if (allReports && allReports.length > 0) {
        setDayOfDiet((allReports[0].day_of_diet || 0) + 1);
      }
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
          wc: wc ? parseFloat(wc) : null,
          notes,
          day_of_diet: dayOfDiet,
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
          {today.toLocaleDateString()} • Day {dayOfDiet} of Diet
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          {guidelines ? (
            <p className="whitespace-pre-wrap text-sm">{guidelines}</p>
          ) : (
            <div className="text-muted-foreground text-sm space-y-2">
              <p>You haven't set up your personal guidelines yet.</p>
              <p className="text-xs">These are the default guidelines provided by your administrator. You can customize them anytime in your profile settings.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today's Meals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {todayMeals.length > 0 ? (
            todayMeals.map((meal, index) => (
              meal && (
                <div key={index}>
                  <h3 className="font-semibold mb-2">Meal {index + 1}</h3>
                  <p className="text-sm whitespace-pre-wrap">{meal}</p>
                </div>
              )
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
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="wc">Waist Circumference (cm)</Label>
              <Input
                id="wc"
                type="number"
                step="0.1"
                value={wc}
                onChange={(e) => setWc(e.target.value)}
                placeholder="85.0"
              />
            </div>
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
