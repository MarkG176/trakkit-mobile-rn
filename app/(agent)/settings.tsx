import { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComponentGate } from '@/components/ComponentGate';
import { useAgentStatus } from '@/providers/AgentStatusProvider';
import { startBackgroundTracking, stopBackgroundTracking } from '@/tasks/backgroundLocation';
import { PermissionGuidance } from '@/components/PermissionGuidance';
import { Screen, Button, Card, AppText, IconChip } from '@/components/ui';
import { colors, spacing } from '@/theme';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const { isCheckedIn } = useAgentStatus();
  const [bgDenied, setBgDenied] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';

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
      <Screen scroll showBack>
        <AppText
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: colors.primary,
            letterSpacing: 0.5,
            marginBottom: spacing.sm,
          }}
        >
          GENERAL
        </AppText>
        <Card style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
            <IconChip
              name="navigate-outline"
              backgroundColor={colors.primaryLight}
              color={colors.primary}
            />
            <View style={{ flex: 1, flexShrink: 1 }}>
              <AppText style={{ fontWeight: '600', fontSize: 16 }}>Background location</AppText>
              <AppText variant="secondary" style={{ marginTop: 4, marginBottom: spacing.md }}>
                Tracks your position during active shifts for supervisor visibility.
              </AppText>
              {bgDenied ? (
                <PermissionGuidance type="background-location" onRetry={toggleBackground} />
              ) : null}
              <Button onPress={toggleBackground}>
                {isCheckedIn ? 'Enable background tracking' : 'Stop background tracking'}
              </Button>
            </View>
          </View>
        </Card>

        <AppText
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: colors.primary,
            letterSpacing: 0.5,
            marginBottom: spacing.sm,
          }}
        >
          ABOUT
        </AppText>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <IconChip
              name="information-circle-outline"
              backgroundColor={colors.muted}
              color={colors.foreground}
            />
            <View style={{ flex: 1 }}>
              <AppText style={{ fontWeight: '600' }}>App Version</AppText>
              <AppText variant="secondary" style={{ marginTop: 2 }}>
                TraKKiT v{version}
              </AppText>
            </View>
            <View
              style={{
                backgroundColor: colors.muted,
                paddingHorizontal: spacing.sm,
                paddingVertical: 4,
                borderRadius: 999,
              }}
            >
              <AppText style={{ fontSize: 12, fontWeight: '600' }}>Stable</AppText>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              marginTop: spacing.md,
              paddingTop: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Ionicons name="globe-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <AppText style={{ fontWeight: '600' }}>Language</AppText>
              <AppText variant="secondary" style={{ marginTop: 2 }}>
                English (v1)
              </AppText>
            </View>
          </View>
        </Card>
      </Screen>
    </ComponentGate>
  );
}
