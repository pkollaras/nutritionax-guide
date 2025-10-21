import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { Leaf } from 'lucide-react';

const LandingNavbar = () => {
  const { t } = useLanguage();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // navbar height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-2 text-xl font-bold text-foreground">
          <Leaf className="h-6 w-6 text-primary" />
          <span>Nutritionax</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button 
            onClick={() => scrollToSection('problems')}
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            {t('landing.nav.problems')}
          </button>
          <button 
            onClick={() => scrollToSection('features')}
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            {t('landing.nav.features')}
          </button>
          <button 
            onClick={() => scrollToSection('nutritionists')}
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            {t('landing.nav.forNutritionists')}
          </button>
          <button 
            onClick={() => scrollToSection('clients')}
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            {t('landing.nav.forClients')}
          </button>
        </div>

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
