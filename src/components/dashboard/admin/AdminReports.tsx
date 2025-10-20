import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import { UtensilsCrossed } from 'lucide-react';

const AdminReports = () => {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [reports, setReports] = useState<any[]>([]);
  const [selectedDiet, setSelectedDiet] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState('');
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchReports(selectedUser);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
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
    const dayOfWeek = getDayOfWeekInEnglish(reportDate);
    
    const { data } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('user_id', selectedUser)
      .eq('day_of_week', dayOfWeek)
      .single();

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
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">{t('adminDashboard.reports.title')}</h1>

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

      {selectedUser && reports.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('adminDashboard.reports.weightProgressTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDiet(report.date)}
                        >
                          <UtensilsCrossed className="h-4 w-4" />
                          {t('adminDashboard.reports.viewDiet')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
