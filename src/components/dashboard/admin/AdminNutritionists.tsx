import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Trash2, Key } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { z } from 'zod';

const nutritionistSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

interface Nutritionist {
  id: string;
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}

const AdminNutritionists = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [nutritionists, setNutritionists] = useState<Nutritionist[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedNutritionist, setSelectedNutritionist] = useState<Nutritionist | null>(null);
  
  const [newNutritionist, setNewNutritionist] = useState({
    email: '',
    password: '',
    name: '',
  });
  
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchNutritionists();
  }, []);

  const fetchNutritionists = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('nutritionists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setNutritionists(data || []);
    }
    setLoading(false);
  };

  const handleAddNutritionist = async () => {
    try {
      // Validate input
      nutritionistSchema.parse(newNutritionist);
      
      setLoading(true);

      // Call edge function to create nutritionist
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'create',
          email: newNutritionist.email,
          password: newNutritionist.password,
          name: newNutritionist.name,
          accountType: 'nutritionist',
          sendEmail: false,
        },
      });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('adminDashboard.nutritionists.addSuccess'),
      });

      setAddDialogOpen(false);
      setNewNutritionist({ email: '', password: '', name: '' });
      fetchNutritionists();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: t('common.error'),
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNutritionist = async () => {
    if (!selectedNutritionist) return;

    try {
      setLoading(true);

      const { error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'delete',
          userId: selectedNutritionist.user_id,
        },
      });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('adminDashboard.nutritionists.deleteSuccess'),
      });

      setDeleteDialogOpen(false);
      setSelectedNutritionist(null);
      fetchNutritionists();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedNutritionist || !newPassword) return;

    try {
      setLoading(true);

      const { error } = await supabase.functions.invoke('manage-users', {
        body: {
          action: 'update-password',
          userId: selectedNutritionist.user_id,
          newPassword,
        },
      });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('adminDashboard.nutritionists.passwordChangeSuccess'),
      });

      setPasswordDialogOpen(false);
      setSelectedNutritionist(null);
      setNewPassword('');
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('adminDashboard.nutritionists.title')}</h1>
        <Button onClick={() => setAddDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t('adminDashboard.nutritionists.addNew')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('adminDashboard.nutritionists.listTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && nutritionists.length === 0 ? (
            <div className="text-center py-8">{t('common.loading')}</div>
          ) : (
            <div className="space-y-4">
              {nutritionists.map((nutritionist) => (
                <Card key={nutritionist.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{nutritionist.name}</h3>
                      <p className="text-sm text-muted-foreground">{nutritionist.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('adminDashboard.nutritionists.createdAt')}: {new Date(nutritionist.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedNutritionist(nutritionist);
                          setPasswordDialogOpen(true);
                        }}
                      >
                        <Key className="h-4 w-4 mr-1" />
                        {t('adminDashboard.nutritionists.changePassword')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedNutritionist(nutritionist);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {nutritionists.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  {t('adminDashboard.nutritionists.noNutritionists')}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Nutritionist Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminDashboard.nutritionists.addNew')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t('adminDashboard.nutritionists.name')}</Label>
              <Input
                id="name"
                value={newNutritionist.name}
                onChange={(e) => setNewNutritionist({ ...newNutritionist, name: e.target.value })}
                placeholder={t('adminDashboard.nutritionists.namePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="email">{t('adminDashboard.nutritionists.email')}</Label>
              <Input
                id="email"
                type="email"
                value={newNutritionist.email}
                onChange={(e) => setNewNutritionist({ ...newNutritionist, email: e.target.value })}
                placeholder={t('adminDashboard.nutritionists.emailPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="password">{t('adminDashboard.nutritionists.password')}</Label>
              <Input
                id="password"
                type="password"
                value={newNutritionist.password}
                onChange={(e) => setNewNutritionist({ ...newNutritionist, password: e.target.value })}
                placeholder={t('adminDashboard.nutritionists.passwordPlaceholder')}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleAddNutritionist} disabled={loading}>
                {loading ? t('common.creating') : t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('adminDashboard.nutritionists.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('adminDashboard.nutritionists.deleteConfirmDesc', { name: selectedNutritionist?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNutritionist} disabled={loading}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('adminDashboard.nutritionists.changePassword')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">{t('adminDashboard.nutritionists.newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('adminDashboard.nutritionists.newPasswordPlaceholder')}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleChangePassword} disabled={loading || !newPassword}>
                {loading ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminNutritionists;