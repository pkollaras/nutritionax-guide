import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [loading, setLoading] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingListData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateShoppingList = async () => {
    setLoading(true);
    setError(null);
    
    try {
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
          title: 'Σφάλμα',
          description: data.message || data.error,
          variant: 'destructive',
        });
        return;
      }

      setShoppingList(data);
      toast({
        title: 'Επιτυχία!',
        description: 'Η λίστα αγορών δημιουργήθηκε επιτυχώς',
      });
    } catch (err: any) {
      console.error('Error generating shopping list:', err);
      setError(err.message || 'Failed to generate shopping list');
      toast({
        title: 'Σφάλμα',
        description: err.message || 'Αποτυχία δημιουργίας λίστας αγορών',
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
          <h1 className="text-3xl font-bold">Λίστα Αγορών</h1>
        </div>
        <p className="text-muted-foreground">
          Δημιουργήστε τη λίστα αγορών της εβδομάδας από το πρόγραμμα διατροφής σας
        </p>
      </div>

      {/* Generate Button */}
      {!shoppingList && !error && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Δημιουργία Λίστας</CardTitle>
            <CardDescription>
              Το σύστημα θα αναλύσει τη διατροφή σας και θα δημιουργήσει μια πλήρη λίστα αγορών για την εβδομάδα
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
                  Δημιουργία Λίστας...
                </>
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Δημιουργία Λίστας Αγορών
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
              <CardTitle className="text-destructive">Σφάλμα</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={generateShoppingList}
              variant="outline"
            >
              Προσπάθεια Ξανά
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
                <CardTitle>Λίστα Αγορών Εβδομάδας</CardTitle>
                <Button 
                  onClick={generateShoppingList}
                  variant="outline"
                  size="sm"
                >
                  Ανανέωση
                </Button>
              </div>
              {shoppingList.summary && (
                <CardDescription className="mt-2">
                  {shoppingList.summary}
                </CardDescription>
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
