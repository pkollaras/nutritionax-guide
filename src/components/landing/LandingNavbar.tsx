import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { Leaf } from 'lucide-react';

const LandingNavbar = () => {
  const { t } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-2 text-xl font-bold text-foreground">
          <Leaf className="h-6 w-6 text-primary" />
          <span>Nutritionax</span>
        </Link>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Button asChild variant="default">
            <Link to="/auth">{t('landing.nav.login')}</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
