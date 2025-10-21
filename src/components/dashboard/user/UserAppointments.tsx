import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  location: string | null;
  notes: string | null;
  status: string;
}

const UserAppointments = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    if (!user) return;
    
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch upcoming appointments
    const { data: upcoming } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', user.id)
      .gte('appointment_date', today)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })
      .limit(1);
    
    if (upcoming && upcoming.length > 0) {
      setNextAppointment(upcoming[0]);
    }
    
    // Fetch past appointments
    const { data: past } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', user.id)
      .lt('appointment_date', today)
      .order('appointment_date', { ascending: false });
    
    setPastAppointments(past || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('appointments.title')}</h1>
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            {t('common.loading')}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">{t('appointments.title')}</h1>

      {nextAppointment && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('appointments.nextAppointment')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-medium">
                  {format(new Date(nextAppointment.appointment_date), 'dd MMMM yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg">{nextAppointment.appointment_time}</span>
              </div>
              {nextAppointment.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span>{nextAppointment.location}</span>
                </div>
              )}
              {nextAppointment.notes && (
                <div className="mt-4 p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {nextAppointment.notes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('appointments.history')}</CardTitle>
        </CardHeader>
        <CardContent>
          {pastAppointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {t('appointments.noAppointments')}
            </p>
          ) : (
            <div className="space-y-4">
              {pastAppointments.map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-4 space-y-2 opacity-75">
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
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                      {appointment.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserAppointments;
