import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
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
import AdminHome from './admin/AdminHome';
import AdminUsers from './admin/AdminUsers';
import AdminDiets from './admin/AdminDiets';
import AdminGuidelines from './admin/AdminGuidelines';
import AdminReports from './admin/AdminReports';

type AdminView = 'home' | 'users' | 'diets' | 'guidelines' | 'reports' | 'settings';

const AdminDashboard = () => {
  const [currentView, setCurrentView] = useState<AdminView>('home');
  const { signOut } = useAuth();

  const menuItems = [
    { id: 'home' as AdminView, label: 'Αρχική', icon: LayoutDashboard },
    { id: 'users' as AdminView, label: 'Χρήστες', icon: Users },
    { id: 'diets' as AdminView, label: 'Διατροφές', icon: FileText },
    { id: 'guidelines' as AdminView, label: 'Οδηγίες', icon: BookOpen },
    { id: 'reports' as AdminView, label: 'Αναφορές', icon: FileText },
    { id: 'settings' as AdminView, label: 'Ρυθμίσεις', icon: Settings },
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
        <h1 className="text-2xl font-bold text-primary">Nutritionax</h1>
        <p className="text-sm text-muted-foreground">Πίνακας Διαχείρισης</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
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

      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Αποσύνδεση
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-card">
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
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        {renderView()}
      </main>
    </div>
  );
};

export default AdminDashboard;
