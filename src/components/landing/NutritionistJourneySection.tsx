import { useLanguage } from '@/contexts/LanguageContext';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Users, Calendar, Activity, CalendarCheck } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import screenshotUsers from '@/assets/screenshot-users.png';
import screenshotDiet from '@/assets/screenshot-diet.png';
import screenshotMeasurements from '@/assets/screenshot-measurements.png';
import screenshotAppointments from '@/assets/screenshot-appointments.png';

const NutritionistJourneySection = () => {
  const { t } = useLanguage();
  
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!api) return;

    api.on('select', () => {
      setCurrentIndex(api.selectedScrollSnap());
    });
  }, [api]);

  const steps = [
    {
      icon: Users,
      titleKey: 'landing.nutritionistJourney.step1Title',
      descKey: 'landing.nutritionistJourney.step1Desc',
      featuresKey: 'landing.nutritionistJourney.step1Features',
      badge: 'Admin Dashboard',
      gradient: 'from-blue-500/10 to-indigo-500/10',
      iconColor: 'text-blue-500',
      screenshot: screenshotUsers
    },
    {
      icon: Calendar,
      titleKey: 'landing.nutritionistJourney.step2Title',
      descKey: 'landing.nutritionistJourney.step2Desc',
      featuresKey: 'landing.nutritionistJourney.step2Features',
      badge: 'Admin Diets',
      gradient: 'from-green-500/10 to-emerald-500/10',
      iconColor: 'text-green-500',
      screenshot: screenshotDiet
    },
    {
      icon: Activity,
      titleKey: 'landing.nutritionistJourney.step3Title',
      descKey: 'landing.nutritionistJourney.step3Desc',
      featuresKey: 'landing.nutritionistJourney.step3Features',
      badge: 'Body Measurements',
      gradient: 'from-purple-500/10 to-pink-500/10',
      iconColor: 'text-purple-500',
      screenshot: screenshotMeasurements
    },
    {
      icon: CalendarCheck,
      titleKey: 'landing.nutritionistJourney.step5Title',
      descKey: 'landing.nutritionistJourney.step5Desc',
      featuresKey: 'landing.nutritionistJourney.step5Features',
      badge: 'Appointments',
      gradient: 'from-cyan-500/10 to-teal-500/10',
      iconColor: 'text-cyan-500',
      screenshot: screenshotAppointments
    }
  ];

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('landing.nutritionistJourney.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('landing.nutritionistJourney.subtitle')}
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[plugin.current]}
          className="w-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          setApi={setApi}
        >
          <CarouselContent>
            {steps.map((step, index) => {
              const Icon = step.icon;
              // Get features - they are stored as arrays in translations
              const featuresRaw = t(step.featuresKey);
              const features = Array.isArray(featuresRaw) ? featuresRaw : [featuresRaw];
              
              return (
                <CarouselItem key={index}>
                  <div className="grid md:grid-cols-2 gap-12 items-center px-4">
                    {/* Left: Screenshot */}
                    <div className="order-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Card className={`relative overflow-hidden ${step.screenshot ? 'cursor-pointer' : `bg-gradient-to-br ${step.gradient}`} border-2 aspect-video flex items-center justify-center shadow-2xl transform transition-transform duration-300 hover:scale-105`}>
                            <div className="absolute top-4 left-4 z-10">
                              <Badge variant="secondary" className="text-xs">
                                {step.badge}
                              </Badge>
                            </div>
                            {step.screenshot ? (
                              <img 
                                src={step.screenshot} 
                                alt={t(step.titleKey)}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Icon className={`h-32 w-32 ${step.iconColor} animate-pulse`} />
                            )}
                          </Card>
                        </DialogTrigger>
                        {step.screenshot && (
                          <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0">
                            <img 
                              src={step.screenshot} 
                              alt={t(step.titleKey)}
                              className="w-full h-full object-contain"
                            />
                          </DialogContent>
                        )}
                      </Dialog>
                    </div>

                    {/* Right: Text Content */}
                    <div className="order-2 space-y-6">
                      <Badge className="mb-2">
                        {t('common.step')} {index + 1}
                      </Badge>
                      <h3 className="text-3xl md:text-4xl font-bold">
                        {t(step.titleKey)}
                      </h3>
                      <p className="text-lg text-muted-foreground">
                        {t(step.descKey)}
                      </p>
                      <ul className="space-y-3 mt-6">
                        {features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-primary mt-1 text-xl">✓</span>
                            <span className="text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          <CarouselPrevious className="left-4 md:-left-12 bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg" />
          <CarouselNext className="right-4 md:-right-12 bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg" />

          {/* Progress Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {steps.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all duration-300 hover:bg-primary/50 ${
                  currentIndex === index 
                    ? 'w-8 bg-primary' 
                    : 'w-2 bg-muted-foreground/30'
                }`}
                onClick={() => api?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </Carousel>
      </div>
    </section>
  );
};

export default NutritionistJourneySection;
