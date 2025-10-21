import { useLanguage } from '@/contexts/LanguageContext';
import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import ProblemsSection from '@/components/landing/ProblemsSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import ClientJourneySection from '@/components/landing/ClientJourneySection';
import NutritionistJourneySection from '@/components/landing/NutritionistJourneySection';
import CTASection from '@/components/landing/CTASection';
const Home = () => {
  const {
    t
  } = useLanguage();
  return <div className="min-h-screen bg-background">
      <LandingNavbar />
      
      <main>
        <HeroSection />
        <div id="problems">
          <ProblemsSection />
        </div>
        <div id="features">
          <FeaturesSection />
        </div>
        <div id="nutritionists">
          <NutritionistJourneySection />
        </div>
        <div id="clients">
          <ClientJourneySection />
        </div>
        <div id="pricing">
          <CTASection />
        </div>
      </main>

      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              {t('landing.footer.copyright')} • {t('landing.footer.madeWith')}{' '}
              <a href="https://advisable.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                Advisable.com
              </a>
            </p>
            
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-foreground transition-colors">
                {t('landing.footer.privacy')}
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                {t('landing.footer.terms')}
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                {t('landing.footer.contact')}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Home;