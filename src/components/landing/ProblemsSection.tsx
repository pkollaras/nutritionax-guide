import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { X, Check } from 'lucide-react';

const ProblemsSection = () => {
  const { t } = useLanguage();

  const problems = [
    t('landing.problems.problem1'),
    t('landing.problems.problem2'),
    t('landing.problems.problem3'),
    t('landing.problems.problem4'),
    t('landing.problems.problem5'),
  ];

  const solutions = [
    t('landing.problems.solution1'),
    t('landing.problems.solution2'),
    t('landing.problems.solution3'),
    t('landing.problems.solution4'),
    t('landing.problems.solution5'),
  ];

  return (
    <section id="problems" className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
          {t('landing.problems.title')}
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-8 border-destructive/20 bg-destructive/5">
            <h3 className="text-xl font-bold text-destructive mb-6 flex items-center gap-2">
              <X className="h-6 w-6" />
              Προβλήματα
            </h3>
            <ul className="space-y-4">
              {problems.map((problem, index) => (
                <li key={index} className="flex items-start gap-3">
                  <X className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{problem}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-8 border-primary/20 bg-primary/5">
            <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <Check className="h-6 w-6" />
              Λύσεις
            </h3>
            <ul className="space-y-4">
              {solutions.map((solution, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{solution}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
