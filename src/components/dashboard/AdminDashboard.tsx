import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import AdminHome from './admin/AdminHome';
import AdminUsers from './admin/AdminUsers';
import AdminDiets from './admin/AdminDiets';
import AdminGuidelines from './admin/AdminGuidelines';
import AdminReports from './admin/AdminReports';

type AdminView = 'home' | 'users' | 'diets' | 'guidelines' | 'reports' | 'settings';

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState<AdminView>('home');
  const { signOut } = useAuth();
  const { t } = useLanguage();

  const menuItems = [
    { id: 'home' as AdminView, label: t('adminDashboard.nav.dashboard'), icon: LayoutDashboard },
    { id: 'users' as AdminView, label: t('adminDashboard.nav.users'), icon: Users },
    { id: 'diets' as AdminView, label: t('adminDashboard.nav.diets'), icon: FileText },
    { id: 'guidelines' as AdminView, label: t('adminDashboard.nav.guidelines'), icon: BookOpen },
    { id: 'reports' as AdminView, label: t('adminDashboard.nav.reports'), icon: FileText },
    { id: 'settings' as AdminView, label: 'Settings', icon: Settings },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <AdminHome />;
      case 'users':
        return <AdminUsers />;
      case 'diets':
        return <AdminDiets />;
      case 'guidelines':
        return <AdminGuidelines />;
      case 'reports':
        return <AdminReports />;
      case 'settings':
        return <div className="p-6"><h2 className="text-2xl font-bold">Ρυθμίσεις</h2></div>;
      default:
        return <AdminHome />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-primary mb-2">{t('auth.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('adminDashboard.title')}</p>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={currentView === item.id ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setCurrentView(item.id)}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </nav>

      <div className="px-4 pb-4 border-t pt-4 space-y-2">
        <div className="flex justify-center">
          <LanguageSwitcher />
        </div>
        <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {t('adminDashboard.nav.signOut')}
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
        <Sheet>
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

export default AdminDashboard;
