import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, UtensilsCrossed, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
interface MealGroup {
  meal_number: number;
  items: string[];
}
interface DietPlan {
  day_of_week: string;
  meals: MealGroup[];
}
const UserDiet = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const days = ['Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο', 'Κυριακή'];
  useEffect(() => {
    if (user) {
      fetchDietPlan();
    }
  }, [user]);
  const fetchDietPlan = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('diet_plans').select('*').eq('user_id', user.id).order('day_of_week');
      if (error) throw error;

      // Cast meals from Json to MealGroup[]
      const typedData = (data || []).map(plan => ({
        day_of_week: plan.day_of_week,
        meals: plan.meals as unknown as MealGroup[]
      }));
      setDietPlans(typedData);
    } catch (error) {
      console.error('Error fetching diet plan:', error);
      toast({
        title: 'Σφάλμα',
        description: 'Αποτυχία φόρτωσης του διατροφικού σας προγράμματος',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: 'Το αρχείο είναι πολύ μεγάλο',
        description: 'Παρακαλώ επιλέξτε αρχείο PDF μικρότερο από 20MB',
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
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const pdfBase64 = await base64Promise;

      // Call edge function to parse PDF with Gemini Vision
      const {
        data,
        error
      } = await supabase.functions.invoke('parse-diet-pdf', {
        body: {
          pdfBase64,
          userId: user.id
        }
      });
      if (error) throw error;
      toast({
        title: 'Επιτυχία!',
        description: 'Το διατροφικό σας πρόγραμμα ανέβηκε και επεξεργάστηκε'
      });

      // Refresh the diet plan
      await fetchDietPlan();
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast({
        title: 'Το ανέβασμα απέτυχε',
        description: error instanceof Error ? error.message : 'Αποτυχία επεξεργασίας του διατροφικού σας προγράμματος',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };
  const toggleDay = (day: string) => {
    setOpenDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };
  const getDayPlan = (day: string) => {
    return dietPlans.find(plan => plan.day_of_week === day);
  };
  if (loading) {
    return <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
            Το Διατροφικό μου Πρόγραμμα
          </h1>
          <p className="text-muted-foreground mt-1">
            Ανεβάστε το διατροφικό σας πρόγραμμα σε PDF για να δείτε τα εβδομαδιαία γεύματα
          </p>
        </div>
        
        <div>
          <input type="file" accept=".pdf" onChange={handlePdfUpload} disabled={uploading} className="hidden" id="pdf-upload" />
          
        </div>
      </div>

      {dietPlans.length === 0 ? <Card className="text-center py-12">
          <CardHeader>
            <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Δεν Υπάρχει Διατροφικό Πρόγραμμα Ακόμα</CardTitle>
            <CardDescription className="text-base">
              Ανεβάστε το διατροφικό σας πρόγραμμα σε PDF για να ξεκινήσετε. Το σύστημα θα το αναλύσει αυτόματα και θα εμφανίσει τα καθημερινά σας γεύματα.
            </CardDescription>
          </CardHeader>
        </Card> : <div className="space-y-3">
          {days.map(day => {
        const dayPlan = getDayPlan(day);
        const isOpen = openDays[day];
        const today = new Date().toLocaleDateString('en-US', {
          weekday: 'long'
        });
        const isToday = day === today;
        return <Card key={day} className={isToday ? 'border-primary' : ''}>
                <Collapsible open={isOpen} onOpenChange={() => toggleDay(day)}>
                  <CardHeader>
                    <CollapsibleTrigger className="flex items-center justify-between w-full cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">
                          {day}
                          {isToday && <span className="ml-2 text-sm font-normal text-primary">(Σήμερα)</span>}
                        </CardTitle>
                      </div>
                      {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </CollapsibleTrigger>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent>
                      {dayPlan ? <div className="space-y-6">
                          {dayPlan.meals.map((mealGroup, index) => <div key={index} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                                  {mealGroup.meal_number || index + 1}
                                </div>
                                <h4 className="font-semibold text-base">Γεύμα {mealGroup.meal_number || index + 1}</h4>
                              </div>
                              <div className="ml-10 space-y-1">
                                {mealGroup.items.map((item, itemIndex) => <p key={itemIndex} className="text-sm leading-relaxed">
                                    • {item}
                                  </p>)}
                              </div>
                            </div>)}
                        </div> : <p className="text-muted-foreground text-sm">Δεν υπάρχουν γεύματα για αυτή την ημέρα</p>}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>;
      })}
        </div>}
    </div>;
};
export default UserDiet;