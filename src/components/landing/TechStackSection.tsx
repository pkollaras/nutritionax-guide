import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Database, Sparkles, Smartphone, Shield } from 'lucide-react';

const TechStackSection = () => {
  const { t } = useLanguage();

  const technologies = [
    'React',
    'TypeScript',
    'Tailwind CSS',
    'Supabase',
    'Gemini AI',
    'React Query',
    'Recharts',
  ];

  const benefits = [
    { icon: Database, text: t('landing.tech.benefit1') },
    { icon: Sparkles, text: t('landing.tech.benefit2') },
    { icon: Smartphone, text: t('landing.tech.benefit3') },
    { icon: Shield, text: t('landing.tech.benefit4') },
  ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-8">
          {t('landing.tech.title')}
        </h2>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {technologies.map((tech, index) => (
            <Badge key={index} variant="secondary" className="px-4 py-2 text-base">
              {tech}
            </Badge>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <benefit.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">{benefit.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechStackSection;
