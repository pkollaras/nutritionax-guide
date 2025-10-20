import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminReports = () => {
  const { t } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [reports, setReports] = useState<any[]>([]);

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
                    <TableHead>{t('adminDashboard.reports.dayHeader')}</TableHead>
                    <TableHead>{t('adminDashboard.reports.weightHeader')}</TableHead>
                    <TableHead>{t('adminDashboard.reports.toiletVisitsHeader')}</TableHead>
                    <TableHead>{t('adminDashboard.reports.morningBMHeader')}</TableHead>
                    <TableHead>{t('adminDashboard.reports.notesHeader')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                      <TableCell>{t('adminDashboard.reports.dayNumber', { day: report.day_of_diet })}</TableCell>
                      <TableCell>{report.weight}</TableCell>
                      <TableCell>{report.wc || 0} {t('adminDashboard.reports.times')}</TableCell>
                      <TableCell>{report.morning_bm ? t('adminDashboard.reports.yes') : t('adminDashboard.reports.no')}</TableCell>
                      <TableCell className="max-w-xs truncate">{report.notes}</TableCell>
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
    </div>
  );
};

export default AdminReports;
