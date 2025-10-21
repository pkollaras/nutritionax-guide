import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
          
          <div className="relative z-10 p-12 md:p-16 text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              {t('landing.cta.title')}
            </h2>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" variant="secondary" className="text-lg px-8">
                <Link to="/auth">
                  {t('landing.cta.button')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            <p className="text-primary-foreground/90">
              {t('landing.cta.loginText')}{' '}
              <Link to="/auth" className="underline font-medium hover:text-primary-foreground">
                {t('landing.nav.login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
