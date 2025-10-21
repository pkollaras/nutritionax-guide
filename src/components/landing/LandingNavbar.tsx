import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';
import { Leaf, Menu } from 'lucide-react';

const LandingNavbar = () => {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false); // Close mobile menu after navigation
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-2 text-foreground">
          <Leaf className="h-6 w-6 text-primary" />
          <div className="flex flex-col">
            <span className="text-xl font-bold">Nutritionax</span>
            <span className="text-[10px] text-muted-foreground -mt-1">by Advisable</span>
          </div>
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
          <button 
            onClick={() => scrollToSection('pricing')}
            className="text-foreground/80 hover:text-foreground transition-colors"
          >
            {t('landing.nav.pricing')}
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Desktop Language Switcher */}
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/signup">
              <Button variant="outline" size="sm">{t('landing.nav.signup')}</Button>
            </Link>
            <Button asChild variant="default" size="sm">
              <Link to="/auth">{t('landing.nav.login')}</Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left">{t('landing.nav.menu')}</SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col gap-6 mt-8">
                {/* Navigation Links */}
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => scrollToSection('problems')}
                    className="text-left text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    {t('landing.nav.problems')}
                  </button>
                  <button 
                    onClick={() => scrollToSection('features')}
                    className="text-left text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    {t('landing.nav.features')}
                  </button>
                  <button 
                    onClick={() => scrollToSection('nutritionists')}
                    className="text-left text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    {t('landing.nav.forNutritionists')}
                  </button>
                  <button 
                    onClick={() => scrollToSection('clients')}
                    className="text-left text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    {t('landing.nav.forClients')}
                  </button>
                  <button 
                    onClick={() => scrollToSection('pricing')}
                    className="text-left text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                  >
                    {t('landing.nav.pricing')}
                  </button>
                </div>

                {/* Language Switcher in Mobile Menu */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3 text-muted-foreground">{t('common.language')}</p>
                  <LanguageSwitcher />
                </div>

                {/* Auth Buttons */}
                <div className="flex flex-col gap-3 pt-4 border-t">
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full" size="lg">
                      {t('landing.nav.signup')}
                    </Button>
                  </Link>
                  <Button asChild variant="default" className="w-full" size="lg">
                    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                      {t('landing.nav.login')}
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
