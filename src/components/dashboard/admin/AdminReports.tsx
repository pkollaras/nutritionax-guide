import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { UtensilsCrossed, Plus, CalendarIcon, Pencil, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const AdminReports = () => {
  const { t, language } = useLanguage();
  const { nutritionistId } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [selectedDiet, setSelectedDiet] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState('');
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [weight, setWeight] = useState('');
  const [toiletVisits, setToiletVisits] = useState('');
  const [morningBM, setMorningBM] = useState(false);
  const [notes, setNotes] = useState('');
  const [dayOfDiet, setDayOfDiet] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (nutritionistId) {
      fetchUsers();
    }
  }, [nutritionistId]);

  useEffect(() => {
    if (selectedUser) {
      fetchReports(selectedUser);
      resetForm();
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    if (!nutritionistId) return;
    
    const { data } = await supabase
      .from('profiles')
      .select(`
        *,
        client_nutritionists!inner(nutritionist_id)
      `)
      .eq('client_nutritionists.nutritionist_id', nutritionistId);
    
    setUsers(data || []);
  };

  const fetchReports = async (userId: string) => {
    const { data } = await supabase
      .from('progress_reports')
      .select('*')
      .eq('user_id', userId)
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
    setShowAddForm(false);
  };

  const autoFillDietDay = async (targetDate?: Date) => {
    if (!selectedUser || editingId) return;

    const dateToCheck = targetDate || selectedDate;
    if (!dateToCheck) return;

    try {
      const { data } = await supabase
        .from('progress_reports')
        .select('day_of_diet, date')
        .eq('user_id', selectedUser)
        .not('day_of_diet', 'is', null)
        .order('date', { ascending: false })
        .limit(2)
        .maybeSingle();

      if (data?.day_of_diet) {
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
    if (showAddForm && !editingId && selectedDate && selectedUser) {
      autoFillDietDay(selectedDate);
    }
  }, [selectedDate, showAddForm, editingId, selectedUser]);

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

  const handleSave = async () => {
    if (!selectedUser || !selectedDate) return;

    // Validation
    if (!weight && !toiletVisits && !dayOfDiet && !notes && !morningBM) {
      toast({
        title: t('common.error'),
        description: t('adminDashboard.reports.atLeastOneField'),
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const dateString = format(selectedDate, 'yyyy-MM-dd');

    try {
      if (editingId) {
        // Update existing
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

        toast({
          title: t('common.success'),
          description: t('adminDashboard.reports.updateSuccess'),
        });
      } else {
        // Insert new
        const { error } = await supabase
          .from('progress_reports')
          .insert({
            user_id: selectedUser,
            date: dateString,
            weight: weight ? parseFloat(weight) : null,
            wc: toiletVisits ? parseFloat(toiletVisits) : null,
            morning_bm: morningBM,
            notes,
            day_of_diet: dayOfDiet ? parseInt(dayOfDiet) : null,
          });

        if (error) throw error;

        toast({
          title: t('common.success'),
          description: t('adminDashboard.reports.saveSuccess'),
        });
      }

      fetchReports(selectedUser);
      resetForm();
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: t('common.error'),
        description: 'Σφάλμα κατά την αποθήκευση',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (date: string) => {
    const dayIndex = new Date(date).getDay();
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return t(`days.${dayKeys[dayIndex]}`);
  };

  const getDayOfWeekInEnglish = (date: string) => {
    const dayIndex = new Date(date).getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  const handleViewDiet = async (reportDate: string) => {
    if (!nutritionistId) return;
    
    const dayOfWeek = getDayOfWeekInEnglish(reportDate);
    
    const { data } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('user_id', selectedUser)
      .eq('day_of_week', dayOfWeek)
      .eq('nutritionist_id', nutritionistId)
      .maybeSingle();

    setSelectedDiet(data);
    setDialogOpen(true);
  };

  const shouldShowViewAllButton = (text: string) => {
    return text && text.length > 50;
  };

  const chartData = reports.map((report) => ({
    date: new Date(report.date).toLocaleDateString(),
    weight: report.weight,
  }));

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">{t('adminDashboard.reports.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('adminDashboard.reports.selectUser')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder={t('adminDashboard.reports.selectUserPlaceholder')} />
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {editingId ? t('adminDashboard.reports.editEntry') : t('adminDashboard.reports.addNewEntry')}
            </CardTitle>
            {showAddForm && (
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          {showAddForm ? (
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('adminDashboard.reports.selectDate')}</Label>
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
                        {selectedDate ? format(selectedDate, 'PPP') : t('adminDashboard.reports.pickDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('adminDashboard.reports.dietDay')}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => autoFillDietDay()}
                      className="h-auto p-1 text-xs"
                    >
                      {t('adminDashboard.reports.autoFillDietDay')}
                    </Button>
                  </div>
                  <Input
                    type="number"
                    value={dayOfDiet}
                    onChange={(e) => setDayOfDiet(e.target.value)}
                    placeholder="1, 2, 3..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('adminDashboard.reports.weight')}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="kg"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('adminDashboard.reports.toiletVisits')}</Label>
                  <Input
                    type="number"
                    value={toiletVisits}
                    onChange={(e) => setToiletVisits(e.target.value)}
                    placeholder="0, 1, 2..."
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="morningBM"
                  checked={morningBM}
                  onCheckedChange={(checked) => setMorningBM(checked as boolean)}
                />
                <label
                  htmlFor="morningBM"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t('adminDashboard.reports.morningBM')}
                </label>
              </div>

              <div className="space-y-2">
                <Label>{t('adminDashboard.reports.notes')}</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('adminDashboard.reports.notes')}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm} disabled={loading}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? t('common.saving') : t('adminDashboard.reports.saveProgress')}
                </Button>
              </div>
            </CardContent>
          ) : (
            <CardContent>
              <Button onClick={() => setShowAddForm(true)} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                {t('adminDashboard.reports.addNewEntry')}
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      {selectedUser && reports.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('adminDashboard.reports.weightProgressTitle')}</CardTitle>
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
              <CardTitle>{t('adminDashboard.reports.progressHistoryTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop Table - Hidden on mobile */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('adminDashboard.reports.dateHeader')}</TableHead>
                      <TableHead>{t('adminDashboard.reports.dayOfWeek')}</TableHead>
                      <TableHead>{t('adminDashboard.reports.dayHeader')}</TableHead>
                      <TableHead>{t('adminDashboard.reports.weightHeader')}</TableHead>
                      <TableHead>{t('adminDashboard.reports.toiletVisitsHeader')}</TableHead>
                      <TableHead>{t('adminDashboard.reports.morningBMHeader')}</TableHead>
                      <TableHead>{t('adminDashboard.reports.notesHeader')}</TableHead>
                      <TableHead>{t('adminDashboard.reports.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                        <TableCell>{getDayName(report.date)}</TableCell>
                        <TableCell>{t('adminDashboard.reports.dayNumber', { day: report.day_of_diet })}</TableCell>
                        <TableCell>{report.weight} kg</TableCell>
                        <TableCell>{report.wc || 0} {t('adminDashboard.reports.times')}</TableCell>
                        <TableCell>{report.morning_bm ? t('adminDashboard.reports.yes') : t('adminDashboard.reports.no')}</TableCell>
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
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(report)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDiet(report.date)}
                            >
                              <UtensilsCrossed className="h-4 w-4" />
                            </Button>
                          </div>
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
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(report)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDiet(report.date)}
                            >
                              <UtensilsCrossed className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">{t('adminDashboard.reports.dayHeader')}:</span>
                            <span className="ml-2 font-medium">{report.day_of_diet || '-'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('adminDashboard.reports.weightHeader')}:</span>
                            <span className="ml-2 font-medium">{report.weight} kg</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">WC:</span>
                            <span className="ml-2 font-medium">{report.wc || 0}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t('adminDashboard.reports.morningBMHeader')}:</span>
                            <span className="ml-2 font-medium">
                              {report.morning_bm ? '✓' : '✗'}
                            </span>
                          </div>
                        </div>
                        
                        {report.notes && (
                          <div className="text-sm pt-2 border-t">
                            <p className="text-muted-foreground mb-1">{t('adminDashboard.reports.notesHeader')}:</p>
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
      )}

      {selectedUser && reports.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {t('adminDashboard.reports.noReportsMessage')}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDiet && t('adminDashboard.reports.dietForDay', { day: getDayName(selectedDiet.day_of_week === 'Monday' ? '2024-01-01' : selectedDiet.day_of_week === 'Tuesday' ? '2024-01-02' : selectedDiet.day_of_week === 'Wednesday' ? '2024-01-03' : selectedDiet.day_of_week === 'Thursday' ? '2024-01-04' : selectedDiet.day_of_week === 'Friday' ? '2024-01-05' : selectedDiet.day_of_week === 'Saturday' ? '2024-01-06' : '2024-01-07') })}
            </DialogTitle>
          </DialogHeader>
          {selectedDiet ? (
            <div className="space-y-4">
              {selectedDiet.meals && Array.isArray(selectedDiet.meals) && selectedDiet.meals.length > 0 ? (
                selectedDiet.meals.map((meal: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{t('userDashboard.diet.meal')} {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-1">
                        {meal.items?.map((item: string, itemIndex: number) => (
                          <li key={itemIndex}>{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground">{t('adminDashboard.reports.noMeals')}</p>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">{t('adminDashboard.reports.noMeals')}</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('adminDashboard.reports.notesTitle')}</DialogTitle>
          </DialogHeader>
          <div className="whitespace-pre-wrap">{selectedNotes}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReports;
