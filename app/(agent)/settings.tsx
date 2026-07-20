import { useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useAgentStatus } from '@/providers/AgentStatusProvider';
import { startBackgroundTracking, stopBackgroundTracking } from '@/tasks/backgroundLocation';
import { PermissionGuidance } from '@/components/PermissionGuidance';
import { Screen, Button, Card, AppText } from '@/components/ui';
import { spacing } from '@/theme';

export default function SettingsScreen() {
  const { isCheckedIn } = useAgentStatus();
  const [bgDenied, setBgDenied] = useState(false);

  const toggleBackground = async () => {
    if (isCheckedIn) {
      const ok = await startBackgroundTracking();
      if (!ok) setBgDenied(true);
    } else {
      await stopBackgroundTracking();
    }
  };

  return (
    <ComponentGate code="CRM-0101">
      <Screen scroll>
        <Card style={{ marginBottom: spacing.lg }}>
          <AppText style={{ fontWeight: '500', marginBottom: spacing.sm }}>Background location</AppText>
          <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
            Tracks your position during active shifts for supervisor visibility.
          </AppText>
          {bgDenied ? <PermissionGuidance type="background-location" onRetry={toggleBackground} /> : null}
          <Button onPress={toggleBackground}>
            {isCheckedIn ? 'Enable background tracking' : 'Stop background tracking'}
          </Button>
        </Card>
        <AppText variant="secondary">Language: English (v1)</AppText>
      </Screen>
    </ComponentGate>
  );
}
