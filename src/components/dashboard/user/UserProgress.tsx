import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { CalendarIcon, Plus, Save, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const UserProgress = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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
      .order('date', { ascending: true });

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
    if (!user || !selectedDate) return;

    setLoading(true);
    const dateString = format(selectedDate, 'yyyy-MM-dd');

    try {
      const { error } = await supabase
        .from('progress_reports')
        .upsert({
          user_id: user.id,
          date: dateString,
          weight: weight ? parseFloat(weight) : null,
          wc: toiletVisits ? parseFloat(toiletVisits) : null,
          morning_bm: morningBM,
          notes,
          day_of_diet: dayOfDiet ? parseInt(dayOfDiet) : null,
        }, {
          onConflict: 'user_id,date'
        });

      if (error) throw error;

      toast({ title: 'Επιτυχία', description: 'Η πρόοδος αποθηκεύτηκε επιτυχώς' });
      setShowAddForm(false);
      resetForm();
      fetchReports();
    } catch (error: any) {
      toast({ title: 'Σφάλμα', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const chartData = reports.map((report) => ({
    date: new Date(report.date).toLocaleDateString(),
    weight: report.weight,
    wc: report.wc,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Πρόοδος</h1>
        <Button onClick={() => { resetForm(); setShowAddForm(!showAddForm); }}>
          <Plus className="mr-2 h-4 w-4" />
          {showAddForm ? 'Κλείσιμο Φόρμας' : 'Προσθήκη Καταχώρισης'}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Επεξεργασία Καταχώρισης' : 'Προσθήκη Καταχώρισης'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Επιλογή Ημερομηνίας</Label>
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
                    {selectedDate ? format(selectedDate, 'PPP') : <span>Επιλέξτε ημερομηνία</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Βάρος (kg)</Label>
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
              <Label htmlFor="dayOfDiet">Ημέρα Διατροφής</Label>
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
              <Label htmlFor="toiletVisits">Επισκέψεις στην Τουαλέτα</Label>
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
                Είχα κένωση το πρωί
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Σημειώσεις / Αποκλίσεις / Σχόλια</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Αποθήκευση...' : 'Αποθήκευση Προόδου'}
              </Button>
              <Button onClick={() => { setShowAddForm(false); resetForm(); }} variant="outline">
                Ακύρωση
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {reports.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Weight Progress</CardTitle>
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
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Toilet Visits</TableHead>
                    <TableHead>Morning BM</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                      <TableCell>Day {report.day_of_diet}</TableCell>
                      <TableCell>{report.weight} kg</TableCell>
                      <TableCell>{report.wc || 0} times</TableCell>
                      <TableCell>{report.morning_bm ? '✓ Yes' : '✗ No'}</TableCell>
                      <TableCell className="max-w-xs truncate">{report.notes}</TableCell>
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
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No progress data yet. Start tracking your daily progress!
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserProgress;
