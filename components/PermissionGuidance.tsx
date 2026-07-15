import { View, Linking, Platform } from 'react-native';
import { AppText, Button, Card } from '@/components/ui';
import { badge, colors, spacing } from '@/theme';

interface PermissionGuidanceProps {
  type: 'location' | 'camera' | 'background-location';
  onRetry?: () => void;
}

const MESSAGES = {
  location: {
    title: 'Location access needed',
    body: 'TraKKiT needs your location to verify check-ins and record field activity.',
  },
  camera: {
    title: 'Camera access needed',
    body: 'TraKKiT needs camera access to capture attendance selfies and photos.',
  },
  'background-location': {
    title: 'Background location needed',
    body: 'Allow background location so supervisors can see your position during active shifts.',
  },
};

export function PermissionGuidance({ type, onRetry }: PermissionGuidanceProps) {
  const msg = MESSAGES[type];

  const openSettings = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    } else {
      Linking.openURL('app-settings:');
    }
  };

  return (
    <Card style={{ ...badge.warning, borderColor: colors.warning, marginBottom: spacing.lg }}>
      <AppText style={{ ...badge.warningText, fontWeight: '600', marginBottom: spacing.xs }}>{msg.title}</AppText>
      <AppText style={{ ...badge.warningText, marginBottom: spacing.md }}>{msg.body}</AppText>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {onRetry ? (
          <Button variant="primary" onPress={onRetry} style={{ flex: 1 }}>
            Try again
          </Button>
        ) : null}
        <Button variant="secondary" onPress={openSettings} style={{ flex: 1 }}>
          Open settings
        </Button>
      </View>
    </Card>
  );
}
