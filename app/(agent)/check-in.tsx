// [CRM-0010] Check-in / Check-out — store visit with GPS + selfie
import { useRouter } from 'expo-router';
import { ComponentGate } from '@/components/ComponentGate';
import { CheckInOutModal } from '@/components/check-in/CheckInOutModal';

export default function CheckInScreen() {
  const router = useRouter();

  return (
    <ComponentGate code="CRM-0010" redirectTo="/(agent)">
      <CheckInOutModal
        visible
        onClose={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(agent)/more');
        }}
        onComplete={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(agent)/more');
        }}
      />
    </ComponentGate>
  );
}
