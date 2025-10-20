import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Home,
  TrendingUp,
  User,
  LogOut,
  Menu,
  UtensilsCrossed,
  FileText,
  ShoppingCart,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import UserHome from './user/UserHome';
import UserProgress from './user/UserProgress';
import UserProfile from './user/UserProfile';
import UserDiet from './user/UserDiet';
import UserGuidelines from './user/UserGuidelines';
import UserShoppingList from './user/UserShoppingList';

type UserView = 'home' | 'progress' | 'profile' | 'diet' | 'guidelines' | 'shopping';

const UserDashboard = () => {
  const [currentView, setCurrentView] = useState<UserView>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const handleViewChange = (view: UserView) => {
    setCurrentView(view);
    setMobileMenuOpen(false); // Close mobile menu when changing view
  };

  const menuItems = [
    { id: 'home' as UserView, label: t('userDashboard.nav.today'), icon: Home },
    { id: 'guidelines' as UserView, label: t('userDashboard.nav.guidelines'), icon: FileText },
    { id: 'diet' as UserView, label: t('userDashboard.nav.diet'), icon: UtensilsCrossed },
    { id: 'shopping' as UserView, label: t('userDashboard.nav.shoppingList'), icon: ShoppingCart },
    { id: 'progress' as UserView, label: t('userDashboard.nav.progress'), icon: TrendingUp },
    { id: 'profile' as UserView, label: t('userDashboard.nav.profile'), icon: User },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <UserHome />;
      case 'guidelines':
        return <UserGuidelines />;
      case 'diet':
        return <UserDiet />;
      case 'shopping':
        return <UserShoppingList />;
      case 'progress':
        return <UserProgress />;
      case 'profile':
        return <UserProfile />;
      default:
        return <UserHome />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-primary mb-2">{t('auth.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('userDashboard.title')}</p>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={currentView === item.id ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => handleViewChange(item.id)}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </nav>

      <div className="px-4 pb-4 border-t pt-4 space-y-2">
        <LanguageSwitcher />
        <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {t('userDashboard.nav.signOut')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background pb-16">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-card fixed left-0 top-0 bottom-16 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b flex items-center px-4 z-10">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <h1 className="ml-4 text-xl font-bold">Nutritionax</h1>
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-16 md:pt-0 md:ml-64">
        {renderView()}
      </main>
    </div>
  );
};

export default UserDashboard;
