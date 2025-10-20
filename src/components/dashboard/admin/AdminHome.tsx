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
        <h1 className="text-3xl font-bold">Αρχική</h1>
        <p className="text-muted-foreground">Καλώς ήρθατε ξανά στο Nutritionax</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Σύνολο Πελατών</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Ενεργοί χρήστες στο σύστημα</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ενεργοί Σήμερα</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeToday}</div>
            <p className="text-xs text-muted-foreground">Καταχώρισαν πρόοδο σήμερα</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Μέσος Όρος Βάρους</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageWeight.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">Πρόσφατες μετρήσεις</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Γρήγορες Ενέργειες</CardTitle>
          <CardDescription>Συνήθεις εργασίες και συντομεύσεις</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            • Προσθέστε νέους πελάτες από την ενότητα Χρήστες
          </p>
          <p className="text-sm text-muted-foreground">
            • Δημιουργήστε διατροφικά προγράμματα στην ενότητα Διατροφές
          </p>
          <p className="text-sm text-muted-foreground">
            • Ενημερώστε τις γενικές οδηγίες στην ενότητα Οδηγίες
          </p>
          <p className="text-sm text-muted-foreground">
            • Δείτε την πρόοδο των πελατών στην ενότητα Αναφορές
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHome;
