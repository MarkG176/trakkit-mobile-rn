import { BackgroundLocationDisclosureModal } from '@/components/location/BackgroundLocationDisclosureModal';
import { useBackgroundLocationDisclosure } from '@/hooks/useBackgroundLocationDisclosure';

export function BackgroundLocationDisclosureHost() {
  const disclosure = useBackgroundLocationDisclosure();

  return (
    <BackgroundLocationDisclosureModal
      visible={disclosure.visible}
      continuing={disclosure.continuing}
      onContinue={disclosure.continueAndRequest}
      onNotNow={disclosure.dismissForNow}
    />
  );
}
