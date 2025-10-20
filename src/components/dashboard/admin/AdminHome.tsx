import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, TrendingDown, Activity } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminHome = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    averageWeight: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Get all admin user IDs
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    const adminUserIds = adminRoles?.map(r => r.user_id) || [];

    // Get total users excluding admins
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .not('id', 'in', `(${adminUserIds.length > 0 ? adminUserIds.join(',') : 'null'})`);

    const today = new Date().toISOString().split('T')[0];
    
    // Get today's reports excluding admins
    const { data: todayReports } = await supabase
      .from('progress_reports')
      .select('user_id')
      .eq('date', today)
      .not('user_id', 'in', `(${adminUserIds.length > 0 ? adminUserIds.join(',') : 'null'})`);

    // Get latest weights excluding admins
    const { data: latestWeights } = await supabase
      .from('progress_reports')
      .select('weight')
      .not('user_id', 'in', `(${adminUserIds.length > 0 ? adminUserIds.join(',') : 'null'})`)
      .order('date', { ascending: false })
      .limit(10);

    const avgWeight = latestWeights && latestWeights.length > 0
      ? latestWeights.reduce((sum, r) => sum + (Number(r.weight) || 0), 0) / latestWeights.length
      : 0;

    setStats({
      totalUsers: users?.length || 0,
      activeToday: todayReports?.length || 0,
      averageWeight: avgWeight,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('adminDashboard.home.title')}</h1>
        <p className="text-muted-foreground">{t('adminDashboard.home.welcome')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminDashboard.home.totalClients')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{t('adminDashboard.home.activeUsers')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminDashboard.home.activeToday')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeToday}</div>
            <p className="text-xs text-muted-foreground">{t('adminDashboard.home.loggedProgressToday')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('adminDashboard.home.avgWeight')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageWeight.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">{t('adminDashboard.home.recentMeasurements')}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('adminDashboard.home.quickActions')}</CardTitle>
          <CardDescription>{t('adminDashboard.home.commonTasks')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • {t('adminDashboard.home.action1')}
          </p>
          <p className="text-sm text-muted-foreground">
            • {t('adminDashboard.home.action2')}
          </p>
          <p className="text-sm text-muted-foreground">
            • {t('adminDashboard.home.action3')}
          </p>
          <p className="text-sm text-muted-foreground">
            • {t('adminDashboard.home.action4')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHome;
