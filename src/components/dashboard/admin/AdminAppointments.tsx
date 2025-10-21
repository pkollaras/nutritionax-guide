import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Calendar, Clock, MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  client_id: string;
  appointment_date: string;
  appointment_time: string;
  location: string | null;
  notes: string | null;
  status: string;
}

const AdminAppointments = () => {
  const { t } = useLanguage();
  const { nutritionistId } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment | null>(null);
  const [deleteAppointmentId, setDeleteAppointmentId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    location: '',
    notes: '',
    status: 'scheduled'
  });

  useEffect(() => {
    if (nutritionistId) {
      fetchClients();
    }
  }, [nutritionistId]);

  useEffect(() => {
    if (selectedClient && nutritionistId) {
      fetchAppointments();
    }
  }, [selectedClient, nutritionistId]);

  const fetchClients = async () => {
    if (!nutritionistId) return;
    
    const { data } = await supabase
      .from('profiles')
      .select(`
        *,
        client_nutritionists!inner(nutritionist_id)
      `)
      .eq('client_nutritionists.nutritionist_id', nutritionistId);
    
    setClients(data || []);
  };

  const fetchAppointments = async () => {
    if (!nutritionistId || !selectedClient) return;
    
    setLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', selectedClient)
      .eq('nutritionist_id', nutritionistId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });
    
    setAppointments(data || []);
    setLoading(false);
  };

  const handleOpenDialog = (appointment?: Appointment) => {
    if (appointment) {
      setCurrentAppointment(appointment);
      setFormData({
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        location: appointment.location || '',
        notes: appointment.notes || '',
        status: appointment.status
      });
    } else {
      setCurrentAppointment(null);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '10:00',
        location: '',
        notes: '',
        status: 'scheduled'
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nutritionistId || !selectedClient) return;
    
    setLoading(true);
    
    const appointmentData = {
      client_id: selectedClient,
      nutritionist_id: nutritionistId,
      appointment_date: formData.date,
      appointment_time: formData.time,
      location: formData.location,
      notes: formData.notes,
      status: formData.status
    };

    if (currentAppointment) {
      const { error } = await supabase
        .from('appointments')
        .update(appointmentData)
        .eq('id', currentAppointment.id);
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t('appointments.appointmentSaved'));
        setDialogOpen(false);
        fetchAppointments();
      }
    } else {
      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData]);
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t('appointments.appointmentSaved'));
        setDialogOpen(false);
        fetchAppointments();
      }
    }
    
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteAppointmentId) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', deleteAppointmentId);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('appointments.appointmentDeleted'));
      setDeleteDialogOpen(false);
      setDeleteAppointmentId(null);
      fetchAppointments();
    }
    
    setLoading(false);
  };

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.appointment_date) >= new Date(new Date().setHours(0, 0, 0, 0))
  );

  const pastAppointments = appointments.filter(apt => 
    new Date(apt.appointment_date) < new Date(new Date().setHours(0, 0, 0, 0))
  );

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">{t('appointments.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('appointments.selectClient')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger>
              <SelectValue placeholder={t('appointments.selectClientPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name} ({client.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedClient && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              {t('appointments.addAppointment')}
            </Button>
          </div>

          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">{t('appointments.upcomingAppointments')}</TabsTrigger>
              <TabsTrigger value="past">{t('appointments.pastAppointments')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="space-y-4">
              {upcomingAppointments.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    {t('appointments.noAppointments')}
                  </CardContent>
                </Card>
              ) : (
                upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(new Date(appointment.appointment_date), 'dd/MM/yyyy')}
                            </span>
                            <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                            <span>{appointment.appointment_time}</span>
                          </div>
                          {appointment.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{appointment.location}</span>
                            </div>
                          )}
                          {appointment.notes && (
                            <p className="text-sm text-muted-foreground mt-2">{appointment.notes}</p>
                          )}
                        </div>
                        <div className="flex sm:flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(appointment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setDeleteAppointmentId(appointment.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastAppointments.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    {t('appointments.noAppointments')}
                  </CardContent>
                </Card>
              ) : (
                pastAppointments.reverse().map((appointment) => (
                  <Card key={appointment.id} className="opacity-75">
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(new Date(appointment.appointment_date), 'dd/MM/yyyy')}
                            </span>
                            <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                            <span>{appointment.appointment_time}</span>
                          </div>
                          {appointment.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{appointment.location}</span>
                            </div>
                          )}
                          {appointment.notes && (
                            <p className="text-sm text-muted-foreground mt-2">{appointment.notes}</p>
                          )}
                        </div>
                        <div className="flex sm:flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(appointment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setDeleteAppointmentId(appointment.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentAppointment ? t('appointments.editAppointment') : t('appointments.addAppointment')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">{t('appointments.date')}</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">{t('appointments.time')}</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t('appointments.location')}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={t('appointments.location')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t('appointments.status')}</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">{t('appointments.scheduled')}</SelectItem>
                  <SelectItem value="completed">{t('appointments.completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('appointments.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t('appointments.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('appointments.notes')}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {t('appointments.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('appointments.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('appointments.deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {t('appointments.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAppointments;
