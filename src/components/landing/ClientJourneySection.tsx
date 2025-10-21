import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Scale, ShoppingCart, FileText } from 'lucide-react';

const ClientJourneySection = () => {
  const { t } = useLanguage();

  const steps = [
    {
      icon: Calendar,
      titleKey: 'landing.clientJourney.step1Title',
      descKey: 'landing.clientJourney.step1Desc',
      featuresKey: 'landing.clientJourney.step1Features',
      gradient: 'from-blue-500/10 to-cyan-500/10',
      iconColor: 'text-blue-500',
      badge: 'User Diet',
    },
    {
      icon: TrendingUp,
      titleKey: 'landing.clientJourney.step2Title',
      descKey: 'landing.clientJourney.step2Desc',
      featuresKey: 'landing.clientJourney.step2Features',
      gradient: 'from-green-500/10 to-emerald-500/10',
      iconColor: 'text-green-500',
      badge: 'User Progress',
    },
    {
      icon: Scale,
      titleKey: 'landing.clientJourney.step3Title',
      descKey: 'landing.clientJourney.step3Desc',
      featuresKey: 'landing.clientJourney.step3Features',
      gradient: 'from-purple-500/10 to-pink-500/10',
      iconColor: 'text-purple-500',
      badge: 'User Charts',
    },
    {
      icon: ShoppingCart,
      titleKey: 'landing.clientJourney.step4Title',
      descKey: 'landing.clientJourney.step4Desc',
      featuresKey: 'landing.clientJourney.step4Features',
      gradient: 'from-orange-500/10 to-red-500/10',
      iconColor: 'text-orange-500',
      badge: 'Shopping List',
    },
    {
      icon: FileText,
      titleKey: 'landing.clientJourney.step5Title',
      descKey: 'landing.clientJourney.step5Desc',
      featuresKey: 'landing.clientJourney.step5Features',
      gradient: 'from-indigo-500/10 to-violet-500/10',
      iconColor: 'text-indigo-500',
      badge: 'Body Measurements',
    },
  ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {t('landing.clientJourney.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('landing.clientJourney.subtitle')}
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-24">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const features = t(step.featuresKey) as unknown as string[];
            
            return (
              <div
                key={index}
                className="grid md:grid-cols-2 gap-12 items-center"
              >
                {/* Mock Screenshot Card */}
                <div
                  className={`${
                    index % 2 === 0 ? 'md:order-1' : 'md:order-2'
                  } order-1`}
                >
                  <Card className={`relative overflow-hidden bg-gradient-to-br ${step.gradient} border-2 aspect-video flex items-center justify-center`}>
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="text-xs">
                        Preview: {step.badge}
                      </Badge>
                    </div>
                    <Icon className={`h-24 w-24 ${step.iconColor}`} />
                  </Card>
                </div>

                {/* Content */}
                <div
                  className={`${
                    index % 2 === 0 ? 'md:order-2' : 'md:order-1'
                  } order-2 space-y-4`}
                >
                  <Badge className="mb-2">
                    {t('common.step')} {index + 1}
                  </Badge>
                  <h3 className="text-3xl font-bold">
                    {t(step.titleKey)}
                  </h3>
                  <p className="text-lg text-muted-foreground">
                    {t(step.descKey)}
                  </p>
                  <ul className="space-y-3 mt-6">
                    {Array.isArray(features) && features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="text-primary mt-1">✓</span>
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ClientJourneySection;
