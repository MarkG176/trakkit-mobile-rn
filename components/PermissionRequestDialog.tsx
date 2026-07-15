import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePermissions } from '@/hooks/usePermissions';
import { AppText, Badge, Button, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { PermissionStatus, PermissionType } from '@/utils/permissionUtils';
import type { IoniconName } from '@/components/navigation/TabIcon';

const PERMISSION_TYPES: PermissionType[] = ['camera', 'location', 'storage'];

const permissionIcons: Record<PermissionType, IoniconName> = {
  camera: 'camera',
  location: 'location',
  storage: 'save',
  microphone: 'mic',
  notification: 'notifications',
};

const permissionTitles: Record<PermissionType, string> = {
  camera: 'Camera',
  location: 'Location',
  storage: 'Storage',
  microphone: 'Microphone',
  notification: 'Notifications',
};

const permissionDescriptions: Record<PermissionType, string> = {
  camera: 'For check-in selfies and photo captures',
  location: 'For work location tracking and distance validation',
  storage: 'For offline data and app caching',
  microphone: 'For audio recording and voice features',
  notification: 'For important alerts and reminders',
};

function statusBadgeVariant(status: PermissionStatus): 'success' | 'destructive' | 'warning' | 'outline' {
  if (status === 'granted') return 'success';
  if (status === 'denied') return 'destructive';
  if (status === 'prompt') return 'warning';
  return 'outline';
}

function statusLabel(status: PermissionStatus): string {
  if (status === 'granted') return 'Granted';
  if (status === 'denied') return 'Denied';
  if (status === 'prompt') return 'Needed';
  return 'Unknown';
}

interface PermissionRequestDialogProps {
  visible: boolean;
  onClose: () => void;
  onDismiss: () => void;
}

export function PermissionRequestDialog({ visible, onClose, onDismiss }: PermissionRequestDialogProps) {
  const { permissions, requestPermission, requestAllPermissions, dismissPermissionPrompt } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [requestingType, setRequestingType] = useState<PermissionType | null>(null);

  const allGranted =
    permissions &&
    PERMISSION_TYPES.every((type) => permissions[type]?.status === 'granted');

  const handleRequestAll = async () => {
    setLoading(true);
    try {
      await requestAllPermissions();
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSingle = async (type: PermissionType) => {
    setRequestingType(type);
    try {
      await requestPermission(type);
    } finally {
      setRequestingType(null);
    }
  };

  const handleDismiss = async () => {
    await Promise.all(PERMISSION_TYPES.map((type) => dismissPermissionPrompt(type, 24)));
    onDismiss();
  };

  if (allGranted) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <View
          style={{
            maxHeight: '85%',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            backgroundColor: colors.card,
            padding: spacing.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <Ionicons name="alert-circle-outline" size={22} color={colors.primary} />
            <AppText variant="h3" style={{ flex: 1, flexShrink: 1 }}>
              Permissions Required
            </AppText>
          </View>
          <AppText variant="secondary" style={{ marginBottom: spacing.md, flexShrink: 1 }}>
            TraKKiT needs these permissions to work properly in the field.
          </AppText>

          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            {PERMISSION_TYPES.map((type) => {
              const status = permissions?.[type]?.status ?? 'unknown';
              const isGranted = status === 'granted';

              return (
                <Card key={type} style={{ marginBottom: spacing.sm, opacity: isGranted ? 0.7 : 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                    <Ionicons name={permissionIcons[type]} size={20} color={colors.secondaryForeground} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
                        <AppText style={{ fontWeight: '600', flexShrink: 1 }}>{permissionTitles[type]}</AppText>
                        <Badge variant={statusBadgeVariant(status)}>{statusLabel(status)}</Badge>
                      </View>
                      <AppText variant="secondary" style={{ marginTop: 4, flexShrink: 1 }}>
                        {permissionDescriptions[type]}
                      </AppText>
                      {!isGranted ? (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={requestingType === type}
                          onPress={() => handleRequestSingle(type)}
                          style={{ marginTop: spacing.sm }}
                        >
                          Request
                        </Button>
                      ) : null}
                    </View>
                  </View>
                </Card>
              );
            })}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <Button variant="outline" onPress={handleDismiss} disabled={loading} style={{ flex: 1 }}>
              Ask Later
            </Button>
            <Button variant="primary" onPress={handleRequestAll} loading={loading} style={{ flex: 1 }}>
              Request All
            </Button>
          </View>

          <Pressable onPress={onClose} style={{ alignItems: 'center', paddingTop: spacing.sm, minHeight: 44 }}>
            <AppText variant="secondary">Close</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
