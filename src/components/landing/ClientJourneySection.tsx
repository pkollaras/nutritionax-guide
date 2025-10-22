import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, TrendingUp, Scale, ShoppingCart, FileText } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useRef, useState, useEffect } from 'react';
import screenshotUserDiet from '@/assets/screenshot-user-diet.png';
import screenshotUserDaily from '@/assets/screenshot-user-daily.png';
import screenshotUserProgress from '@/assets/screenshot-user-progress.png';
import screenshotUserShopping from '@/assets/screenshot-user-shopping.png';
import screenshotUserMeasurements from '@/assets/screenshot-user-measurements.png';

const ClientJourneySection = () => {
  const { t } = useLanguage();
  
  // Autoplay plugin instance
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  // State for progress dots
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!api) return;

    // Update current index on slide change
    api.on('select', () => {
      setCurrentIndex(api.selectedScrollSnap());
    });
  }, [api]);

  const steps = [
    {
      icon: Calendar,
      titleKey: 'landing.clientJourney.step1Title',
      descKey: 'landing.clientJourney.step1Desc',
      featuresKey: 'landing.clientJourney.step1Features',
      gradient: 'from-blue-500/10 to-cyan-500/10',
      iconColor: 'text-blue-500',
      badge: 'User Diet',
      screenshot: screenshotUserDiet
    },
    {
      icon: TrendingUp,
      titleKey: 'landing.clientJourney.step2Title',
      descKey: 'landing.clientJourney.step2Desc',
      featuresKey: 'landing.clientJourney.step2Features',
      gradient: 'from-green-500/10 to-emerald-500/10',
      iconColor: 'text-green-500',
      badge: 'User Progress',
      screenshot: screenshotUserDaily
    },
    {
      icon: Scale,
      titleKey: 'landing.clientJourney.step3Title',
      descKey: 'landing.clientJourney.step3Desc',
      featuresKey: 'landing.clientJourney.step3Features',
      gradient: 'from-purple-500/10 to-pink-500/10',
      iconColor: 'text-purple-500',
      badge: 'User Charts',
      screenshot: screenshotUserProgress
    },
    {
      icon: ShoppingCart,
      titleKey: 'landing.clientJourney.step4Title',
      descKey: 'landing.clientJourney.step4Desc',
      featuresKey: 'landing.clientJourney.step4Features',
      gradient: 'from-orange-500/10 to-red-500/10',
      iconColor: 'text-orange-500',
      badge: 'Shopping List',
      screenshot: screenshotUserShopping
    },
    {
      icon: FileText,
      titleKey: 'landing.clientJourney.step5Title',
      descKey: 'landing.clientJourney.step5Desc',
      featuresKey: 'landing.clientJourney.step5Features',
      gradient: 'from-indigo-500/10 to-violet-500/10',
      iconColor: 'text-indigo-500',
      badge: 'Body Measurements',
      screenshot: screenshotUserMeasurements
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

        {/* Carousel Slider */}
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[plugin.current]}
          className="w-full"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent>
            {steps.map((step, index) => {
              const Icon = step.icon;
              const features = t(step.featuresKey) as unknown as string[];
              
              return (
                <CarouselItem key={index}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center px-4 py-8">
                    {/* Left: Text Content */}
                    <div className="order-2 md:order-1 space-y-4 md:space-y-6">
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
                        {Array.isArray(features) && features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="text-primary mt-1 text-xl">✓</span>
                            <span className="text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Right: Screenshot */}
                    <div className="order-1 md:order-2">
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
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {/* Navigation Arrows */}
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

export default ClientJourneySection;
