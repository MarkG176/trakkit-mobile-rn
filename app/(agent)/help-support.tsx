import { ComponentGate } from '@/components/ComponentGate';
import { Screen, AppText } from '@/components/ui';
import { spacing } from '@/theme';

export default function HelpSupportScreen() {
  return (
    <ComponentGate code="CRM-0109">
      <Screen scroll title="Help & Support">
        <AppText style={{ marginBottom: spacing.md }}>
          Contact your supervisor or submit a support ticket from the Chat tab.
        </AppText>
        <AppText variant="secondary">
          For urgent issues during field work, call your team lead directly.
        </AppText>
      </Screen>
    </ComponentGate>
  );
}
