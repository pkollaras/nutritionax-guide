import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UtensilsCrossed, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useLanguage } from '@/contexts/LanguageContext';

interface MealGroup {
  meal_number: number;
  items: string[];
}

interface DietPlan {
  day_of_week: string;
  meals: MealGroup[];
}

const UserDiet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const [nutritionists, setNutritionists] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedNutritionist, setSelectedNutritionist] = useState<string>('');

  // English day names for database (must match database values)
  const daysEN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Translated day names for display
  const days = [
    t('days.monday'), t('days.tuesday'), t('days.wednesday'), t('days.thursday'),
    t('days.friday'), t('days.saturday'), t('days.sunday')
  ];

  useEffect(() => {
    if (user) {
      fetchNutritionists();
    }
  }, [user]);

  useEffect(() => {
    if (selectedNutritionist) {
      fetchDietPlan();
    }
  }, [selectedNutritionist]);

  const fetchNutritionists = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('client_nutritionists')
        .select(`
          nutritionist_id,
          nutritionists(id, name)
        `)
        .eq('client_id', user.id);

      if (error) throw error;

      const nutritionistsList = data?.map((cn: any) => cn.nutritionists).filter(Boolean) || [];
      setNutritionists(nutritionistsList);
      
      // Auto-select first nutritionist if available
      if (nutritionistsList.length > 0 && !selectedNutritionist) {
        setSelectedNutritionist(nutritionistsList[0].id);
      }
    } catch (error) {
      console.error('Error fetching nutritionists:', error);
    }
  };

  const fetchDietPlan = async () => {
    if (!user || !selectedNutritionist) return;

    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('nutritionist_id', selectedNutritionist)
        .order('day_of_week');

      if (error) throw error;

      // Cast meals from Json to MealGroup[]
      const typedData = (data || []).map((plan) => ({
        day_of_week: plan.day_of_week,
        meals: plan.meals as unknown as MealGroup[],
      }));

      setDietPlans(typedData);
    } catch (error) {
      console.error('Error fetching diet plan:', error);
      toast({
        title: t('common.error'),
        description: t('userDashboard.diet.fetchFailed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  const toggleDay = (dayIndex: number) => {
    const dayKey = `day-${dayIndex}`;
    setOpenDays((prev) => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };

  const getDayPlan = (dayEN: string) => {
    return dietPlans.find((plan) => plan.day_of_week === dayEN);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UtensilsCrossed className="h-8 w-8 text-primary" />
          {t('userDashboard.diet.title')}
        </h1>
      </div>

      {/* Nutritionist Selector (if multiple nutritionists) */}
      {nutritionists.length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t('userDashboard.diet.selectNutritionist')}</CardTitle>
            <CardDescription>{t('userDashboard.diet.selectNutritionistDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedNutritionist}
              onChange={(e) => setSelectedNutritionist(e.target.value)}
            >
              {nutritionists.map((nutritionist) => (
                <option key={nutritionist.id} value={nutritionist.id}>
                  {nutritionist.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      )}

      {dietPlans.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>{t('userDashboard.diet.noDietPlan')}</CardTitle>
            <CardDescription className="text-base">
              {t('userDashboard.diet.noDietPlanDesc')}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          {days.map((day, index) => {
            const dayEN = daysEN[index];
            const dayPlan = getDayPlan(dayEN);
            const dayKey = `day-${index}`;
            const isOpen = openDays[dayKey];

            // Check if today
            const todayIndex = new Date().getDay();
            const adjustedTodayIndex = todayIndex === 0 ? 6 : todayIndex - 1; // Sunday is 0, we want it at index 6
            const isToday = index === adjustedTodayIndex;

            return (
              <Card key={dayKey} className={isToday ? 'border-primary' : ''}>
                <Collapsible open={isOpen} onOpenChange={() => toggleDay(index)}>
                  <CardHeader>
                    <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">
                          {day}
                          {isToday && (
                            <span className="ml-2 text-sm font-normal text-primary">
                              ({t('userDashboard.diet.today')})
                            </span>
                          )}
                        </CardTitle>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </CollapsibleTrigger>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent>
                      {dayPlan ? (
                        <div className="space-y-6">
                          {dayPlan.meals.map((mealGroup, mealIndex) => (
                            <div key={mealIndex} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                                  {mealGroup.meal_number || mealIndex + 1}
                                </div>
                                <h4 className="font-semibold text-base">
                                  {t('userDashboard.diet.meal')} {mealGroup.meal_number || mealIndex + 1}
                                </h4>
                              </div>
                              <div className="ml-10 space-y-1">
                                {mealGroup.items.map((item, itemIndex) => (
                                  <p key={itemIndex} className="text-sm leading-relaxed">
                                    • {item}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">{t('userDashboard.diet.noMeals')}</p>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserDiet;
