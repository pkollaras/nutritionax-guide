import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

const CTASection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-accent" />
          
          <div className="relative z-10 p-8 md:p-16 text-center space-y-8">
            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              {t('landing.cta.title')}
            </h2>

            {/* Pricing Card */}
            <Card className="max-w-md mx-auto bg-background/95 backdrop-blur-sm border-2 border-primary/20 shadow-2xl p-8">
              {/* Trial Badge */}
              <Badge className="mb-4 bg-accent text-accent-foreground px-4 py-1.5 text-sm font-semibold">
                <Sparkles className="h-4 w-4 mr-1.5" />
                {t('landing.cta.pricing.trial')}
              </Badge>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl md:text-6xl font-bold text-foreground">
                    {t('landing.cta.pricing.price')}
                  </span>
                  <span className="text-xl text-muted-foreground">
                    {t('landing.cta.pricing.period')}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-3 mb-6 text-left">
                {(t('landing.cta.pricing.features') as unknown as string[]).map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* CTA Button */}
            <div className="flex flex-col items-center gap-4">
              <Button asChild size="lg" variant="secondary" className="text-lg px-12 py-6 shadow-xl">
                <Link to="/auth">
                  {t('landing.cta.button')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              {/* Login Link */}
              <p className="text-primary-foreground/90 text-sm">
                {t('landing.cta.loginText')}{' '}
                <Link to="/auth" className="underline font-medium hover:text-primary-foreground">
                  {t('landing.nav.login')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
