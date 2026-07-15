import { useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComponentGate } from '@/components/ComponentGate';
import { useAgentStatus } from '@/providers/AgentStatusProvider';
import { usePermissions } from '@/hooks/usePermissions';
import { startBackgroundTracking, stopBackgroundTracking } from '@/tasks/backgroundLocation';
import { PermissionGuidance } from '@/components/PermissionGuidance';
import { PermissionRequestDialog } from '@/components/PermissionRequestDialog';
import { Screen, Button, Card, AppText, Badge, LoadingSpinner } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { PermissionType } from '@/utils/permissionUtils';

const PERMISSION_ROWS: PermissionType[] = ['camera', 'location', 'storage'];

export default function SettingsScreen() {
  const { isCheckedIn } = useAgentStatus();
  const { permissions, requestPermission, loading, refreshPermissions } = usePermissions();
  const [bgDenied, setBgDenied] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

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
      <Screen scroll title="Settings">
        <Card style={{ marginBottom: spacing.lg }}>
          <AppText style={{ fontWeight: '500', marginBottom: spacing.sm }}>App permissions</AppText>
          <AppText variant="secondary" style={{ marginBottom: spacing.md, flexShrink: 1 }}>
            Camera and location are required for check-ins and field capture.
          </AppText>
          {loading && !permissions ? (
            <LoadingSpinner label="Loading permissions" />
          ) : (
            PERMISSION_ROWS.map((type) => {
              const status = permissions?.[type]?.status ?? 'unknown';
              return (
                <View
                  key={type}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: spacing.sm,
                    paddingVertical: spacing.sm,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText style={{ fontWeight: '500', textTransform: 'capitalize', flexShrink: 1 }}>
                      {type}
                    </AppText>
                    <AppText variant="secondary" style={{ flexShrink: 1 }}>
                      {status === 'granted' ? 'Allowed' : status === 'denied' ? 'Denied' : 'Not set'}
                    </AppText>
                  </View>
                  {status !== 'granted' ? (
                    <Button variant="outline" size="sm" onPress={() => requestPermission(type)}>
                      Allow
                    </Button>
                  ) : (
                    <Badge variant="success">Granted</Badge>
                  )}
                </View>
              );
            })
          )}
          <Button variant="secondary" onPress={() => setShowPermissionDialog(true)} style={{ marginTop: spacing.md }}>
            Manage permissions
          </Button>
          <Button variant="ghost" onPress={() => refreshPermissions()} style={{ marginTop: spacing.sm }}>
            Refresh status
          </Button>
        </Card>

        <Card style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <Ionicons name="navigate" size={18} color={colors.foreground} />
            <AppText style={{ fontWeight: '500', flexShrink: 1 }}>Background location</AppText>
          </View>
          <AppText variant="secondary" style={{ marginBottom: spacing.md, flexShrink: 1 }}>
            Tracks your position during active shifts for supervisor visibility.
          </AppText>
          {bgDenied ? <PermissionGuidance type="background-location" onRetry={toggleBackground} /> : null}
          <Button onPress={toggleBackground}>
            {isCheckedIn ? 'Enable background tracking' : 'Stop background tracking'}
          </Button>
        </Card>

        <AppText variant="secondary">Language: English (v1)</AppText>
      </Screen>

      <PermissionRequestDialog
        visible={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        onDismiss={() => setShowPermissionDialog(false)}
      />
    </ComponentGate>
  );
}
