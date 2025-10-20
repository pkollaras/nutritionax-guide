import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface ShoppingItem {
  name: string;
  quantity: string;
  notes?: string;
}

interface CategoryData {
  name: string;
  items: ShoppingItem[];
}

interface ShoppingListData {
  categories: CategoryData[];
  summary: string;
  weekStartDate?: string;
  createdAt?: string;
}

const UserShoppingList = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [fetchingExisting, setFetchingExisting] = useState(true);
  const [shoppingList, setShoppingList] = useState<ShoppingListData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExistingShoppingList();
  }, []);

  const loadExistingShoppingList = async () => {
    setFetchingExisting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate current week start date
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + diff);
      const weekStartDate = weekStart.toISOString().split('T')[0];

      // Fetch shopping list for current week
      const { data, error } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start_date', weekStartDate)
        .single();

      if (data && !error) {
        setShoppingList({
          categories: (data.items as unknown) as CategoryData[],
          summary: (data.generated_content as unknown) as string,
          weekStartDate: data.week_start_date,
          createdAt: data.created_at
        });
      }
    } catch (err) {
      console.error('Error loading shopping list:', err);
    } finally {
      setFetchingExisting(false);
    }
  };

  const generateShoppingList = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Refresh session to ensure we have a valid token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast({
          title: t('common.error'),
          description: 'Session expired. Please log in again',
          variant: 'destructive',
        });
        window.location.href = '/auth';
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: functionError } = await supabase.functions.invoke('generate-shopping-list', {
        body: { userId: user.id }
      });

      if (functionError) throw functionError;

      if (data.error) {
        setError(data.message || data.error);
        toast({
          title: t('common.error'),
          description: data.message || data.error,
          variant: 'destructive',
        });
        return;
      }

      setShoppingList(data);
      toast({
        title: t('common.success'),
        description: t('userDashboard.shoppingList.generateSuccess'),
      });
    } catch (err: any) {
      console.error('Error generating shopping list:', err);
      setError(err.message || 'Failed to generate shopping list');
      toast({
        title: t('common.error'),
        description: err.message || t('userDashboard.shoppingList.generateFailed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (categoryName: string) => {
    if (categoryName.includes('Λαχανικά')) return '🥬';
    if (categoryName.includes('Πρωτεΐνες')) return '🥩';
    if (categoryName.includes('Γαλακτοκομικά')) return '🥛';
    if (categoryName.includes('Φρούτα')) return '🍎';
    if (categoryName.includes('Δημητριακά') || categoryName.includes('Ζυμαρικά')) return '🌾';
    return '📦';
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('userDashboard.shoppingList.title')}</h1>
        </div>
        <p className="text-muted-foreground">
          {t('userDashboard.shoppingList.subtitle')}
        </p>
      </div>

      {/* Loading State */}
      {fetchingExisting && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t('userDashboard.shoppingList.loading')}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      {!shoppingList && !error && !fetchingExisting && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('userDashboard.shoppingList.generateTitle')}</CardTitle>
            <CardDescription>
              {t('userDashboard.shoppingList.generateDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={generateShoppingList}
              disabled={loading}
              size="lg"
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('userDashboard.shoppingList.generating')}
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {t('userDashboard.shoppingList.generateButton')}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">{t('common.error')}</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={generateShoppingList}
              variant="outline"
            >
              {t('userDashboard.shoppingList.tryAgain')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Shopping List Display */}
      {shoppingList && !loading && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('userDashboard.shoppingList.weeklyList')}</CardTitle>
                <Button 
                  onClick={generateShoppingList}
                  variant="outline"
                  size="sm"
                >
                  {t('userDashboard.shoppingList.refresh')}
                </Button>
              </div>
              {shoppingList.summary && (
                <CardDescription className="mt-2">
                  {shoppingList.summary}
                </CardDescription>
              )}
              {shoppingList.createdAt && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t('userDashboard.shoppingList.generatedOn')}: {' '}
                  {new Date(shoppingList.createdAt).toLocaleDateString('el-GR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </CardHeader>
          </Card>

          {/* Categories */}
          <div className="space-y-4">
            {shoppingList.categories && shoppingList.categories.map((category, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span className="text-2xl">{getCategoryIcon(category.name)}</span>
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                        <input 
                          type="checkbox" 
                          className="mt-1 h-4 w-4 rounded border-gray-300"
                          id={`item-${idx}-${itemIdx}`}
                        />
                        <label 
                          htmlFor={`item-${idx}-${itemIdx}`}
                          className="flex-1 cursor-pointer"
                        >
                          <span className="font-medium">{item.name}</span>
                          {' - '}
                          <span className="text-muted-foreground">{item.quantity}</span>
                          {item.notes && (
                            <span className="text-sm text-muted-foreground ml-2">
                              ({item.notes})
                            </span>
                          )}
                        </label>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UserShoppingList;
