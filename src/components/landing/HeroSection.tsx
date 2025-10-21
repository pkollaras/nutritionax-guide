import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Sparkles } from 'lucide-react';

const HeroSection = () => {
  const { t } = useLanguage();

  const scrollToFeatures = () => {
    document.getElementById('problems')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI-Powered Nutrition Platform</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            {t('landing.hero.title')}
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('landing.hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/auth">
                {t('landing.hero.cta1')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8"
              onClick={scrollToFeatures}
            >
              {t('landing.hero.cta2')}
            </Button>
          </div>

          <div className="mt-16 rounded-lg border border-border bg-card shadow-2xl overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Sparkles className="h-16 w-16 text-primary mx-auto" />
                <p className="text-muted-foreground text-lg font-medium">
                  Dashboard Preview
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
