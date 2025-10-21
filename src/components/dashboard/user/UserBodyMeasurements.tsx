import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';

interface BodyMeasurement {
  id: string;
  measurement_date: string;
  triceps_1: number | null;
  triceps_2: number | null;
  waist_1: number | null;
  waist_2: number | null;
  back_1: number | null;
  back_2: number | null;
  armpit_1: number | null;
  armpit_2: number | null;
  chest_1: number | null;
  chest_2: number | null;
  abdomen_1: number | null;
  abdomen_2: number | null;
  thigh_1: number | null;
  thigh_2: number | null;
  body_fat_percentage: number | null;
  body_mass_percentage: number | null;
  fat_mass: number | null;
  lean_body_mass: number | null;
  custom_fields: any;
  notes: string | null;
}

const UserBodyMeasurements = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [latestMeasurement, setLatestMeasurement] = useState<BodyMeasurement | null>(null);
  const [pastMeasurements, setPastMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState<BodyMeasurement | null>(null);

  useEffect(() => {
    if (user) {
      fetchMeasurements();
    }
  }, [user]);

  const fetchMeasurements = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('client_id', user.id)
      .order('measurement_date', { ascending: false });
    
    if (data && data.length > 0) {
      setLatestMeasurement(data[0]);
      setPastMeasurements(data.slice(1));
    }
    
    setLoading(false);
  };

  const handleViewReport = (measurement: BodyMeasurement) => {
    setSelectedMeasurement(measurement);
    setDialogOpen(true);
  };

  const skinfolds = [
    { key: 'triceps', label: t('bodyMeasurements.triceps') },
    { key: 'waist', label: t('bodyMeasurements.waist') },
    { key: 'back', label: t('bodyMeasurements.back') },
    { key: 'armpit', label: t('bodyMeasurements.armpit') },
    { key: 'chest', label: t('bodyMeasurements.chest') },
    { key: 'abdomen', label: t('bodyMeasurements.abdomen') },
    { key: 'thigh', label: t('bodyMeasurements.thigh') }
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('bodyMeasurements.title')}</h1>
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
      <h1 className="text-2xl sm:text-3xl font-bold">{t('bodyMeasurements.title')}</h1>

      {latestMeasurement && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle>{t('bodyMeasurements.latestMeasurement')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-lg font-medium">
                {format(new Date(latestMeasurement.measurement_date), 'dd MMMM yyyy')}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                {latestMeasurement.body_fat_percentage && (
                  <div className="p-4 bg-background rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {latestMeasurement.body_fat_percentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">%BF</div>
                  </div>
                )}
                {latestMeasurement.body_mass_percentage && (
                  <div className="p-4 bg-background rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {latestMeasurement.body_mass_percentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">%BM</div>
                  </div>
                )}
                {latestMeasurement.fat_mass && (
                  <div className="p-4 bg-background rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {latestMeasurement.fat_mass} kg
                    </div>
                    <div className="text-sm text-muted-foreground">FM</div>
                  </div>
                )}
                {latestMeasurement.lean_body_mass && (
                  <div className="p-4 bg-background rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {latestMeasurement.lean_body_mass} kg
                    </div>
                    <div className="text-sm text-muted-foreground">LBM</div>
                  </div>
                )}
              </div>

              <Button 
                className="w-full" 
                onClick={() => handleViewReport(latestMeasurement)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {t('bodyMeasurements.viewReport')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('bodyMeasurements.history')}</CardTitle>
        </CardHeader>
        <CardContent>
          {pastMeasurements.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              {t('bodyMeasurements.noMeasurements')}
            </p>
          ) : (
            <div className="space-y-4">
              {pastMeasurements.map((measurement) => (
                <div key={measurement.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">
                      {format(new Date(measurement.measurement_date), 'dd/MM/yyyy')}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(measurement)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {measurement.body_fat_percentage && (
                      <div>
                        <span className="text-muted-foreground">%BF:</span>{' '}
                        <span className="font-medium">{measurement.body_fat_percentage}%</span>
                      </div>
                    )}
                    {measurement.fat_mass && (
                      <div>
                        <span className="text-muted-foreground">FM:</span>{' '}
                        <span className="font-medium">{measurement.fat_mass} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMeasurement && format(new Date(selectedMeasurement.measurement_date), 'dd MMMM yyyy')}
            </DialogTitle>
          </DialogHeader>
          {selectedMeasurement && (
            <div className="space-y-6 print:p-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {selectedMeasurement.body_fat_percentage && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-primary">
                      {selectedMeasurement.body_fat_percentage}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {t('bodyMeasurements.bodyFatPercentage')}
                    </div>
                  </div>
                )}
                {selectedMeasurement.body_mass_percentage && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-primary">
                      {selectedMeasurement.body_mass_percentage}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {t('bodyMeasurements.bodyMassPercentage')}
                    </div>
                  </div>
                )}
                {selectedMeasurement.fat_mass && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-primary">
                      {selectedMeasurement.fat_mass} kg
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {t('bodyMeasurements.fatMass')}
                    </div>
                  </div>
                )}
                {selectedMeasurement.lean_body_mass && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-primary">
                      {selectedMeasurement.lean_body_mass} kg
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {t('bodyMeasurements.leanBodyMass')}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">{t('bodyMeasurements.skinfolds')}</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-sm font-medium pb-2 border-b">
                    <div></div>
                    <div className="text-center">{t('bodyMeasurements.measurement1')}</div>
                    <div className="text-center">{t('bodyMeasurements.measurement2')}</div>
                  </div>
                  {skinfolds.map(({ key, label }) => {
                    const val1 = selectedMeasurement[`${key}_1` as keyof BodyMeasurement];
                    const val2 = selectedMeasurement[`${key}_2` as keyof BodyMeasurement];
                    if (val1 || val2) {
                      return (
                        <div key={key} className="grid grid-cols-3 gap-2 items-center py-2 border-b">
                          <div className="text-sm font-medium">{label}</div>
                          <div className="text-center">{val1 || '-'}</div>
                          <div className="text-center">{val2 || '-'}</div>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>

              {selectedMeasurement.custom_fields && Array.isArray(selectedMeasurement.custom_fields) && selectedMeasurement.custom_fields.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">{t('bodyMeasurements.customFields')}</h3>
                  <div className="space-y-2">
                    {selectedMeasurement.custom_fields.map((field: any, index: number) => (
                      <div key={index} className="flex justify-between py-2 border-b">
                        <span className="font-medium">{field.name}</span>
                        <span>{field.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMeasurement.notes && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t('bodyMeasurements.notes')}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap p-4 bg-muted rounded-lg">
                    {selectedMeasurement.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserBodyMeasurements;
