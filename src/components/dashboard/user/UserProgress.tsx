import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarIcon, Plus, Save, Pencil, UtensilsCrossed } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

const UserProgress = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [reports, setReports] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [weight, setWeight] = useState('');
  const [toiletVisits, setToiletVisits] = useState('');
  const [morningBM, setMorningBM] = useState(false);
  const [notes, setNotes] = useState('');
  const [dayOfDiet, setDayOfDiet] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedNotes, setSelectedNotes] = useState('');
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [showDietDialog, setShowDietDialog] = useState(false);
  const [selectedDayDiet, setSelectedDayDiet] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    const { data } = await supabase
      .from('progress_reports')
      .select('*')
      .eq('user_id', user?.id)
      .order('date', { ascending: false });

    setReports(data || []);
  };

  const resetForm = () => {
    setEditingId(null);
    setWeight('');
    setToiletVisits('');
    setMorningBM(false);
    setNotes('');
    setDayOfDiet('');
    setSelectedDate(new Date());
  };

  const autoFillDietDay = async (targetDate?: Date) => {
    if (!user || editingId) return;

    const dateToCheck = targetDate || selectedDate;
    if (!dateToCheck) return;

    try {
      const { data, error } = await supabase
        .from('progress_reports')
        .select('day_of_diet, date')
        .eq('user_id', user.id)
        .not('day_of_diet', 'is', null)
        .order('date', { ascending: false })
        .limit(2)
        .maybeSingle();

      if (error) throw error;

      if (data && data.day_of_diet) {
        const lastDate = new Date(data.date);
        const currentDate = new Date(dateToCheck);
        const diffTime = currentDate.getTime() - lastDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const calculatedDay = diffDays > 0 
          ? data.day_of_diet + diffDays 
          : data.day_of_diet + 1;
        
        setDayOfDiet(calculatedDay.toString());
      }
    } catch (error) {
      console.error('Error auto-filling diet day:', error);
    }
  };

  useEffect(() => {
    if (showAddForm && !editingId && selectedDate) {
      autoFillDietDay(selectedDate);
    }
  }, [selectedDate, showAddForm, editingId]);

  const handleEdit = (report: any) => {
    setEditingId(report.id);
    setSelectedDate(new Date(report.date));
    setWeight(report.weight?.toString() || '');
    setToiletVisits(report.wc?.toString() || '');
    setMorningBM(report.morning_bm || false);
    setNotes(report.notes || '');
    setDayOfDiet(report.day_of_diet?.toString() || '');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchDietForDate = async (date: Date) => {
    if (!user) return;
    
    const dayIndex = date.getDay();
    const daysEN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayEN = daysEN[dayIndex];
    
    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('day_of_week', dayEN)
        .maybeSingle();
      
      if (error) throw error;
      
      setSelectedDayDiet(data);
      setShowDietDialog(true);
    } catch (error) {
      console.error('Error fetching diet:', error);
      toast({ 
        title: t('common.error'), 
        description: t('userDashboard.progress.dietFetchError'),
        variant: 'destructive' 
      });
    }
  };

  const handleSave = async () => {
    if (!user || !selectedDate) return;

    // Validation: At least one field must be filled
    if (!weight && !toiletVisits && !dayOfDiet && !notes && !morningBM) {
      toast({
        title: t('common.error'),
        description: "Παρακαλώ συμπληρώστε τουλάχιστον ένα πεδίο",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const dateString = format(selectedDate, 'yyyy-MM-dd');

    try {
      if (editingId) {
        // Edit mode: Update existing entry
        const { error } = await supabase
          .from('progress_reports')
          .update({
            date: dateString,
            weight: weight ? parseFloat(weight) : null,
            wc: toiletVisits ? parseFloat(toiletVisits) : null,
            morning_bm: morningBM,
            notes,
            day_of_diet: dayOfDiet ? parseInt(dayOfDiet) : null,
          })
          .eq('id', editingId);

        if (error) throw error;
        toast({ title: t('common.success'), description: t('userDashboard.progress.updateSuccess') });
      } else {
        // Add mode: Insert new entry
        const { error } = await supabase
          .from('progress_reports')
          .insert({
            user_id: user.id,
            date: dateString,
            weight: weight ? parseFloat(weight) : null,
            wc: toiletVisits ? parseFloat(toiletVisits) : null,
            morning_bm: morningBM,
            notes,
            day_of_diet: dayOfDiet ? parseInt(dayOfDiet) : null,
          });

        if (error) throw error;
        toast({ title: t('common.success'), description: t('userDashboard.progress.saveSuccess') });
      }

      setShowAddForm(false);
      resetForm();
      fetchReports();
    } catch (error: any) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (date: string) => {
    const dayIndex = new Date(date).getDay();
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return t(`days.${dayKeys[dayIndex]}`);
  };

  const shouldShowViewAllButton = (text: string) => {
    return text && text.length > 50;
  };

  const chartData = reports
    .filter(report => report.weight !== null)
    .map((report) => ({
      date: new Date(report.date).toLocaleDateString(),
      weight: report.weight,
      wc: report.wc,
    }));

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('userDashboard.progress.title')}</h1>
        <Button onClick={() => { resetForm(); if (!showAddForm) autoFillDietDay(); setShowAddForm(!showAddForm); }} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {showAddForm ? t('userDashboard.progress.closeForm') : t('userDashboard.progress.addEntry')}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? t('userDashboard.progress.editEntry') : t('userDashboard.progress.addNewEntry')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="space-y-2">
              <Label>{t('userDashboard.progress.selectDate')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !selectedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, 'PPP') : <span>{t('userDashboard.progress.pickDate')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              {selectedDate && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => fetchDietForDate(selectedDate)}
                >
                  <UtensilsCrossed className="mr-2 h-4 w-4" />
                  {t('userDashboard.progress.viewDietPlan')}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">{t('userDashboard.progress.weight')}</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="30"
                max="300"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="75.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dayOfDiet">{t('userDashboard.progress.dietDay')}</Label>
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
              <Label htmlFor="toiletVisits">{t('userDashboard.progress.toiletVisits')}</Label>
              <Input
                id="toiletVisits"
                type="number"
                min="0"
                max="20"
                value={toiletVisits}
                onChange={(e) => setToiletVisits(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="morningBM"
                checked={morningBM}
                onCheckedChange={(checked) => setMorningBM(checked === true)}
              />
              <Label htmlFor="morningBM" className="cursor-pointer">
                {t('userDashboard.progress.morningBM')}
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('userDashboard.progress.notes')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleSave} className="flex-1" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? t('common.saving') : t('userDashboard.progress.saveProgress')}
              </Button>
              <Button onClick={() => { setShowAddForm(false); resetForm(); }} variant="outline" className="sm:w-auto">
                {t('common.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {reports.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('userDashboard.progress.weightProgress')}</CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('userDashboard.progress.history')}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop Table - Hidden on mobile */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('userDashboard.progress.date')}</TableHead>
                      <TableHead>{t('userDashboard.progress.dayOfWeek')}</TableHead>
                      <TableHead>{t('userDashboard.progress.day')}</TableHead>
                      <TableHead>{t('userDashboard.progress.weight')}</TableHead>
                      <TableHead>{t('userDashboard.progress.toiletVisits')}</TableHead>
                      <TableHead>{t('userDashboard.progress.morningBM')}</TableHead>
                      <TableHead>{t('userDashboard.progress.notes')}</TableHead>
                      <TableHead>{t('userDashboard.progress.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                        <TableCell>{getDayName(report.date)}</TableCell>
                        <TableCell>{t('userDashboard.progress.dayNumber', { day: report.day_of_diet })}</TableCell>
                        <TableCell>{report.weight} kg</TableCell>
                        <TableCell>{report.wc || 0} {t('userDashboard.progress.times')}</TableCell>
                        <TableCell>{report.morning_bm ? t('userDashboard.progress.yes') : t('userDashboard.progress.no')}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{report.notes}</span>
                            {shouldShowViewAllButton(report.notes) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedNotes(report.notes);
                                  setNotesDialogOpen(true);
                                }}
                              >
                                {t('common.viewAll')}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(report)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards - Hidden on desktop */}
              <div className="md:hidden space-y-4">
                {reports.map((report) => (
                  <Card key={report.id} className="border-2">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">
                              {new Date(report.date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {getDayName(report.date)}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(report)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">{t('userDashboard.progress.day')}:</span>
                            <span className="ml-2 font-medium">{report.day_of_diet || '-'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('userDashboard.progress.weight')}:</span>
                            <span className="ml-2 font-medium">{report.weight} kg</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">WC:</span>
                            <span className="ml-2 font-medium">{report.wc || 0}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('userDashboard.progress.morningBM')}:</span>
                            <span className="ml-2 font-medium">
                              {report.morning_bm ? '✓' : '✗'}
                            </span>
                          </div>
                        </div>
                        
                        {report.notes && (
                          <div className="text-sm pt-2 border-t">
                            <p className="text-muted-foreground mb-1">{t('userDashboard.progress.notes')}:</p>
                            <p className="line-clamp-2">{report.notes}</p>
                            {shouldShowViewAllButton(report.notes) && (
                              <Button
                                variant="link"
                                size="sm"
                                className="px-0 h-auto mt-1"
                                onClick={() => {
                                  setSelectedNotes(report.notes);
                                  setNotesDialogOpen(true);
                                }}
                              >
                                {t('common.viewAll')}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {t('userDashboard.progress.noData')}
          </CardContent>
        </Card>
      )}

      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('userDashboard.progress.notesTitle')}</DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap">{selectedNotes}</div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDietDialog} onOpenChange={setShowDietDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && (
                <>
                  {t('userDashboard.progress.dietPlanFor')} {format(selectedDate, 'EEEE, d MMMM yyyy')}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedDayDiet ? (
            <div className="space-y-6">
              {selectedDayDiet.meals.map((mealGroup: any, mealIndex: number) => (
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
                    {mealGroup.items.map((item: string, itemIndex: number) => (
                      <p key={itemIndex} className="text-sm leading-relaxed">
                        • {item}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {t('userDashboard.progress.noDietForDay')}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProgress;
