import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, TrendingDown, Activity } from 'lucide-react';

const AdminHome = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    averageWeight: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: users } = await supabase
      .from('profiles')
      .select('id');

    const today = new Date().toISOString().split('T')[0];
    const { data: todayReports } = await supabase
      .from('progress_reports')
      .select('user_id')
      .eq('date', today);

    const { data: latestWeights } = await supabase
      .from('progress_reports')
      .select('weight')
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to Nutritionax</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Active users in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeToday}</div>
            <p className="text-xs text-muted-foreground">Logged progress today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Weight</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageWeight.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">Recent measurements</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Add new clients from the Users section
          </p>
          <p className="text-sm text-muted-foreground">
            • Create diet plans in the Diets section
          </p>
          <p className="text-sm text-muted-foreground">
            • Update global guidelines in the Guidelines section
          </p>
          <p className="text-sm text-muted-foreground">
            • View client progress in the Reports section
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHome;
