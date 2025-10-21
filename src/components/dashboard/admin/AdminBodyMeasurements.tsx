import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, X, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { PDFUploadSection } from './PDFUploadSection';

interface BodyMeasurement {
  id: string;
  client_id: string;
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

interface CustomField {
  name: string;
  value: string;
}

const AdminBodyMeasurements = () => {
  const { t } = useLanguage();
  const { nutritionistId } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewReportOpen, setViewReportOpen] = useState(false);
  const [currentMeasurement, setCurrentMeasurement] = useState<BodyMeasurement | null>(null);
  const [viewMeasurement, setViewMeasurement] = useState<BodyMeasurement | null>(null);
  const [deleteMeasurementId, setDeleteMeasurementId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    triceps_1: '',
    triceps_2: '',
    waist_1: '',
    waist_2: '',
    back_1: '',
    back_2: '',
    armpit_1: '',
    armpit_2: '',
    chest_1: '',
    chest_2: '',
    abdomen_1: '',
    abdomen_2: '',
    thigh_1: '',
    thigh_2: '',
    body_fat_percentage: '',
    body_mass_percentage: '',
    fat_mass: '',
    lean_body_mass: '',
    notes: '',
    custom_fields: [] as CustomField[]
  });

  useEffect(() => {
    if (nutritionistId) {
      fetchClients();
    }
  }, [nutritionistId]);

  useEffect(() => {
    if (selectedClient && nutritionistId) {
      fetchMeasurements();
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

  const fetchMeasurements = async () => {
    if (!nutritionistId || !selectedClient) return;
    
    setLoading(true);
    const { data } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('client_id', selectedClient)
      .eq('nutritionist_id', nutritionistId)
      .order('measurement_date', { ascending: false });
    
    setMeasurements(data || []);
    setLoading(false);
  };

  const handleOpenDialog = (measurement?: BodyMeasurement) => {
    if (measurement) {
      setCurrentMeasurement(measurement);
      setFormData({
        date: measurement.measurement_date,
        triceps_1: measurement.triceps_1?.toString() || '',
        triceps_2: measurement.triceps_2?.toString() || '',
        waist_1: measurement.waist_1?.toString() || '',
        waist_2: measurement.waist_2?.toString() || '',
        back_1: measurement.back_1?.toString() || '',
        back_2: measurement.back_2?.toString() || '',
        armpit_1: measurement.armpit_1?.toString() || '',
        armpit_2: measurement.armpit_2?.toString() || '',
        chest_1: measurement.chest_1?.toString() || '',
        chest_2: measurement.chest_2?.toString() || '',
        abdomen_1: measurement.abdomen_1?.toString() || '',
        abdomen_2: measurement.abdomen_2?.toString() || '',
        thigh_1: measurement.thigh_1?.toString() || '',
        thigh_2: measurement.thigh_2?.toString() || '',
        body_fat_percentage: measurement.body_fat_percentage?.toString() || '',
        body_mass_percentage: measurement.body_mass_percentage?.toString() || '',
        fat_mass: measurement.fat_mass?.toString() || '',
        lean_body_mass: measurement.lean_body_mass?.toString() || '',
        notes: measurement.notes || '',
        custom_fields: Array.isArray(measurement.custom_fields) ? measurement.custom_fields : []
      });
    } else {
      setCurrentMeasurement(null);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        triceps_1: '',
        triceps_2: '',
        waist_1: '',
        waist_2: '',
        back_1: '',
        back_2: '',
        armpit_1: '',
        armpit_2: '',
        chest_1: '',
        chest_2: '',
        abdomen_1: '',
        abdomen_2: '',
        thigh_1: '',
        thigh_2: '',
        body_fat_percentage: '',
        body_mass_percentage: '',
        fat_mass: '',
        lean_body_mass: '',
        notes: '',
        custom_fields: []
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!nutritionistId || !selectedClient) return;
    
    setLoading(true);
    
    const measurementData = {
      client_id: selectedClient,
      nutritionist_id: nutritionistId,
      measurement_date: formData.date,
      triceps_1: formData.triceps_1 ? parseFloat(formData.triceps_1) : null,
      triceps_2: formData.triceps_2 ? parseFloat(formData.triceps_2) : null,
      waist_1: formData.waist_1 ? parseFloat(formData.waist_1) : null,
      waist_2: formData.waist_2 ? parseFloat(formData.waist_2) : null,
      back_1: formData.back_1 ? parseFloat(formData.back_1) : null,
      back_2: formData.back_2 ? parseFloat(formData.back_2) : null,
      armpit_1: formData.armpit_1 ? parseFloat(formData.armpit_1) : null,
      armpit_2: formData.armpit_2 ? parseFloat(formData.armpit_2) : null,
      chest_1: formData.chest_1 ? parseFloat(formData.chest_1) : null,
      chest_2: formData.chest_2 ? parseFloat(formData.chest_2) : null,
      abdomen_1: formData.abdomen_1 ? parseFloat(formData.abdomen_1) : null,
      abdomen_2: formData.abdomen_2 ? parseFloat(formData.abdomen_2) : null,
      thigh_1: formData.thigh_1 ? parseFloat(formData.thigh_1) : null,
      thigh_2: formData.thigh_2 ? parseFloat(formData.thigh_2) : null,
      body_fat_percentage: formData.body_fat_percentage ? parseFloat(formData.body_fat_percentage) : null,
      body_mass_percentage: formData.body_mass_percentage ? parseFloat(formData.body_mass_percentage) : null,
      fat_mass: formData.fat_mass ? parseFloat(formData.fat_mass) : null,
      lean_body_mass: formData.lean_body_mass ? parseFloat(formData.lean_body_mass) : null,
      custom_fields: formData.custom_fields as any,
      notes: formData.notes
    };

    if (currentMeasurement) {
      const { error } = await supabase
        .from('body_measurements')
        .update(measurementData)
        .eq('id', currentMeasurement.id);
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t('bodyMeasurements.measurementSaved'));
        setDialogOpen(false);
        fetchMeasurements();
      }
    } else {
      const { error } = await supabase
        .from('body_measurements')
        .insert([measurementData]);
      
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t('bodyMeasurements.measurementSaved'));
        setDialogOpen(false);
        fetchMeasurements();
      }
    }
    
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteMeasurementId) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('body_measurements')
      .delete()
      .eq('id', deleteMeasurementId);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('bodyMeasurements.measurementDeleted'));
      setDeleteDialogOpen(false);
      setDeleteMeasurementId(null);
      fetchMeasurements();
    }
    
    setLoading(false);
  };

  const addCustomField = () => {
    setFormData({
      ...formData,
      custom_fields: [...formData.custom_fields, { name: '', value: '' }]
    });
  };

  const removeCustomField = (index: number) => {
    setFormData({
      ...formData,
      custom_fields: formData.custom_fields.filter((_, i) => i !== index)
    });
  };

  const updateCustomField = (index: number, field: 'name' | 'value', value: string) => {
    const updated = [...formData.custom_fields];
    updated[index][field] = value;
    setFormData({ ...formData, custom_fields: updated });
  };

  const handleViewReport = (measurement: BodyMeasurement) => {
    setViewMeasurement(measurement);
    setViewReportOpen(true);
  };

  const handlePDFParsed = (parsedData: any) => {
    setFormData({
      date: parsedData.measurement_date || format(new Date(), 'yyyy-MM-dd'),
      triceps_1: parsedData.triceps_1?.toString() || '',
      triceps_2: parsedData.triceps_2?.toString() || '',
      waist_1: parsedData.waist_1?.toString() || '',
      waist_2: parsedData.waist_2?.toString() || '',
      back_1: parsedData.back_1?.toString() || '',
      back_2: parsedData.back_2?.toString() || '',
      armpit_1: parsedData.armpit_1?.toString() || '',
      armpit_2: parsedData.armpit_2?.toString() || '',
      chest_1: parsedData.chest_1?.toString() || '',
      chest_2: parsedData.chest_2?.toString() || '',
      abdomen_1: parsedData.abdomen_1?.toString() || '',
      abdomen_2: parsedData.abdomen_2?.toString() || '',
      thigh_1: parsedData.thigh_1?.toString() || '',
      thigh_2: parsedData.thigh_2?.toString() || '',
      body_fat_percentage: parsedData.body_fat_percentage?.toString() || '',
      body_mass_percentage: parsedData.body_mass_percentage?.toString() || '',
      fat_mass: parsedData.fat_mass?.toString() || '',
      lean_body_mass: parsedData.lean_body_mass?.toString() || '',
      notes: parsedData.notes || '',
      custom_fields: formData.custom_fields
    });
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

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold">{t('bodyMeasurements.title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('bodyMeasurements.selectClient')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger>
              <SelectValue placeholder={t('bodyMeasurements.selectClientPlaceholder')} />
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
              {t('bodyMeasurements.addMeasurement')}
            </Button>
          </div>

          <div className="space-y-4">
            {measurements.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  {t('bodyMeasurements.noMeasurements')}
                </CardContent>
              </Card>
            ) : (
              measurements.map((measurement) => (
                <Card key={measurement.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="font-medium text-lg">
                          {format(new Date(measurement.measurement_date), 'dd/MM/yyyy')}
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
                          {measurement.body_mass_percentage && (
                            <div>
                              <span className="text-muted-foreground">%BM:</span>{' '}
                              <span className="font-medium">{measurement.body_mass_percentage}%</span>
                            </div>
                          )}
                          {measurement.lean_body_mass && (
                            <div>
                              <span className="text-muted-foreground">LBM:</span>{' '}
                              <span className="font-medium">{measurement.lean_body_mass} kg</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReport(measurement)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(measurement)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeleteMeasurementId(measurement.id);
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
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentMeasurement ? t('bodyMeasurements.editMeasurement') : t('bodyMeasurements.addMeasurement')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {!currentMeasurement && selectedClient && (
              <PDFUploadSection
                onParsed={handlePDFParsed}
                clientId={selectedClient}
                disabled={loading}
              />
            )}
            
            <div className="space-y-2">
              <Label htmlFor="date">{t('bodyMeasurements.date')}</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t('bodyMeasurements.skinfolds')}</h3>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 gap-2 text-sm font-medium pb-2 border-b">
                  <div></div>
                  <div className="text-center">{t('bodyMeasurements.measurement1')}</div>
                  <div className="text-center">{t('bodyMeasurements.measurement2')}</div>
                </div>
                {skinfolds.map(({ key, label }) => (
                  <div key={key} className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-sm">{label}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData[`${key}_1` as keyof typeof formData] as string}
                      onChange={(e) => setFormData({ ...formData, [`${key}_1`]: e.target.value })}
                      placeholder="0.0"
                    />
                    <Input
                      type="number"
                      step="0.1"
                      value={formData[`${key}_2` as keyof typeof formData] as string}
                      onChange={(e) => setFormData({ ...formData, [`${key}_2`]: e.target.value })}
                      placeholder="0.0"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t('bodyMeasurements.results')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bf">{t('bodyMeasurements.bodyFatPercentage')}</Label>
                  <Input
                    id="bf"
                    type="number"
                    step="0.01"
                    value={formData.body_fat_percentage}
                    onChange={(e) => setFormData({ ...formData, body_fat_percentage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bm">{t('bodyMeasurements.bodyMassPercentage')}</Label>
                  <Input
                    id="bm"
                    type="number"
                    step="0.01"
                    value={formData.body_mass_percentage}
                    onChange={(e) => setFormData({ ...formData, body_mass_percentage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fm">{t('bodyMeasurements.fatMass')}</Label>
                  <Input
                    id="fm"
                    type="number"
                    step="0.01"
                    value={formData.fat_mass}
                    onChange={(e) => setFormData({ ...formData, fat_mass: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lbm">{t('bodyMeasurements.leanBodyMass')}</Label>
                  <Input
                    id="lbm"
                    type="number"
                    step="0.01"
                    value={formData.lean_body_mass}
                    onChange={(e) => setFormData({ ...formData, lean_body_mass: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">{t('bodyMeasurements.customFields')}</h3>
                <Button type="button" variant="outline" size="sm" onClick={addCustomField}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('bodyMeasurements.addCustomField')}
                </Button>
              </div>
              {formData.custom_fields.map((field, index) => (
                <div key={index} className="grid grid-cols-[1fr,1fr,auto] gap-2">
                  <Input
                    placeholder={t('bodyMeasurements.fieldName')}
                    value={field.name}
                    onChange={(e) => updateCustomField(index, 'name', e.target.value)}
                  />
                  <Input
                    placeholder={t('bodyMeasurements.fieldValue')}
                    value={field.value}
                    onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCustomField(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('bodyMeasurements.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('bodyMeasurements.notes')}
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {t('bodyMeasurements.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('bodyMeasurements.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('bodyMeasurements.deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {t('bodyMeasurements.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={viewReportOpen} onOpenChange={setViewReportOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {viewMeasurement && format(new Date(viewMeasurement.measurement_date), 'dd MMMM yyyy')}
            </DialogTitle>
          </DialogHeader>
          {viewMeasurement && (
            <div className="space-y-6 print:p-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {viewMeasurement.body_fat_percentage && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-primary">
                      {viewMeasurement.body_fat_percentage}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {t('bodyMeasurements.bodyFatPercentage')}
                    </div>
                  </div>
                )}
                {viewMeasurement.body_mass_percentage && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-primary">
                      {viewMeasurement.body_mass_percentage}%
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {t('bodyMeasurements.bodyMassPercentage')}
                    </div>
                  </div>
                )}
                {viewMeasurement.fat_mass && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-primary">
                      {viewMeasurement.fat_mass} kg
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {t('bodyMeasurements.fatMass')}
                    </div>
                  </div>
                )}
                {viewMeasurement.lean_body_mass && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-primary">
                      {viewMeasurement.lean_body_mass} kg
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
                    const val1 = viewMeasurement[`${key}_1` as keyof BodyMeasurement];
                    const val2 = viewMeasurement[`${key}_2` as keyof BodyMeasurement];
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

              {viewMeasurement.custom_fields && Array.isArray(viewMeasurement.custom_fields) && viewMeasurement.custom_fields.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">{t('bodyMeasurements.customFields')}</h3>
                  <div className="space-y-2">
                    {viewMeasurement.custom_fields.map((field: any, index: number) => (
                      <div key={index} className="flex justify-between py-2 border-b">
                        <span className="font-medium">{field.name}</span>
                        <span>{field.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewMeasurement.notes && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">{t('bodyMeasurements.notes')}</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap p-4 bg-muted rounded-lg">
                    {viewMeasurement.notes}
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

export default AdminBodyMeasurements;
