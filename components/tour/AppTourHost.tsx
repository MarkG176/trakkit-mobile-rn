import { AppTourModal } from '@/components/tour/AppTourModal';
import { useAppTour } from '@/hooks/useAppTour';

export function AppTourHost() {
  const tour = useAppTour();

  return (
    <AppTourModal
      visible={tour.visible}
      stepIndex={tour.stepIndex}
      stepCount={tour.stepCount}
      navItems={tour.navItems}
      toolItems={tour.toolItems}
      onNext={tour.goNext}
      onBack={tour.goBack}
      onSkipOrFinish={tour.skipOrFinish}
    />
  );
}
