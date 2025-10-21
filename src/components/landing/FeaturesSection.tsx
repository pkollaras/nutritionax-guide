import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { CalendarDays, TrendingUp, Scale, ShoppingCart, LayoutDashboard } from 'lucide-react';

const FeaturesSection = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: CalendarDays,
      title: t('landing.features.feature1Title'),
      desc: t('landing.features.feature1Desc'),
      gradient: 'from-blue-500/10 to-cyan-500/10',
      iconColor: 'text-blue-500',
    },
    {
      icon: TrendingUp,
      title: t('landing.features.feature2Title'),
      desc: t('landing.features.feature2Desc'),
      gradient: 'from-green-500/10 to-emerald-500/10',
      iconColor: 'text-green-500',
    },
    {
      icon: Scale,
      title: t('landing.features.feature3Title'),
      desc: t('landing.features.feature3Desc'),
      gradient: 'from-purple-500/10 to-pink-500/10',
      iconColor: 'text-purple-500',
    },
    {
      icon: ShoppingCart,
      title: t('landing.features.feature4Title'),
      desc: t('landing.features.feature4Desc'),
      gradient: 'from-orange-500/10 to-yellow-500/10',
      iconColor: 'text-orange-500',
    },
    {
      icon: LayoutDashboard,
      title: t('landing.features.feature5Title'),
      desc: t('landing.features.feature5Desc'),
      gradient: 'from-primary/10 to-accent/10',
      iconColor: 'text-primary',
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-16">
          Βασικά Χαρακτηριστικά
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
