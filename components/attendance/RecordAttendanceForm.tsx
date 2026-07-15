import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useAgentStatus } from '@/providers/AgentStatusProvider';
import { PermissionGuidance } from '@/components/PermissionGuidance';
import { getCurrentLocation } from '@/utils/location';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { startBackgroundTracking, stopBackgroundTracking } from '@/tasks/backgroundLocation';
import { getLastCheckInPhotoUrl, uploadCheckInPhoto } from '@/utils/agentPhotos';
import { AppText, Button, Card } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

function InfoRow({ icon, label }: { icon: IoniconName; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
      <Ionicons name={icon} size={16} color={colors.secondaryForeground} />
      <AppText variant="secondary" style={{ flex: 1, flexShrink: 1 }}>
        {label}
      </AppText>
    </View>
  );
}

function StatusBadge({ isCheckedIn }: { isCheckedIn: boolean }) {
  const label = isCheckedIn ? 'CHECKED IN' : 'CHECKED OUT';
  const backgroundColor = isCheckedIn ? '#E8F5E9' : '#FDE8E8';
  const textColor = isCheckedIn ? '#2E7D32' : '#C62828';

  return (
    <View
      style={{
        backgroundColor,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.sm,
      }}
    >
      <AppText style={{ fontSize: 10, fontWeight: '700', color: textColor, letterSpacing: 0.5 }}>
        {label}
      </AppText>
    </View>
  );
}

export function RecordAttendanceForm() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { isCheckedIn, refresh } = useAgentStatus();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [cameraDenied, setCameraDenied] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);

  const AVATAR_SIZE = 106;

  const loadPhoto = useCallback(async () => {
    if (!user) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    try {
      const url = await getLastCheckInPhotoUrl(user.id);
      setPhotoUrl(url);
    } catch (error) {
      console.error('Error loading check-in photo:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPhoto();
  }, [loadPhoto, isCheckedIn]);

  const beginCapture = async () => {
    if (loading) return;
    const status = isCheckedIn ? 'checked_out' : 'checked_in';

    const { status: permStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (permStatus !== 'granted') {
      setCameraDenied(true);
      return;
    }
    setCameraDenied(false);

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets[0]) {
      await handleCapture(result.assets[0].uri, status);
    }
  };

  const handleCapture = async (uri: string, status: 'checked_in' | 'checked_out') => {
    if (!user || !currentWorkspaceId) return;
    setLoading(true);

    try {
      const location = await getCurrentLocation();
      const uploaded = await uploadCheckInPhoto(uri, user.id);

      const payload = {
        agent_id: user.id,
        workspace_id: currentWorkspaceId,
        status,
        location_lat: location.latitude,
        location_lng: location.longitude,
        selfie_url: uploaded,
        timestamp: new Date().toISOString(),
      };

      const { synced } = await writeWithOfflineQueue('agent_status_log', payload);
      if (!synced) {
        Alert.alert('Saved offline', 'Check-in will sync when you reconnect.');
      } else {
        Alert.alert('Success', status === 'checked_in' ? 'Checked in!' : 'Checked out!');
      }

      if (status === 'checked_in') {
        await startBackgroundTracking();
      } else {
        await stopBackgroundTracking();
      }

      await refresh();
      await loadPhoto();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const actionLabel = isCheckedIn ? 'Check Out Now' : 'Check In Now';
  const actionIcon = isCheckedIn ? 'log-out-outline' : 'log-in-outline';

  return (
    <>
      <Card style={{ padding: spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
            <Ionicons name="time-outline" size={22} color={colors.primary} />
            <AppText variant="h3" style={{ fontWeight: '700', flexShrink: 1 }}>
              Attendance
            </AppText>
          </View>
          <StatusBadge isCheckedIn={isCheckedIn} />
        </View>

        <AppText variant="secondary" style={{ marginBottom: spacing.lg, flexShrink: 1 }}>
          Update your current status
        </AppText>

        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <Pressable
            onPress={() => setPhotoPreviewOpen(true)}
            disabled={!photoUrl || profileLoading}
            accessibilityRole="button"
            accessibilityLabel="View check-in photo"
          >
            <View
              style={{
                padding: 5,
                borderRadius: radius.full,
                borderWidth: 2,
                borderColor: colors.border,
                backgroundColor: colors.background,
              }}
            >
              <View
                style={{
                  padding: 4,
                  borderRadius: radius.full,
                  borderWidth: 1,
                  borderColor: '#E8ECEF',
                  backgroundColor: colors.card,
                }}
              >
                <View
                  style={{
                    width: AVATAR_SIZE,
                    height: AVATAR_SIZE,
                    borderRadius: radius.full,
                    overflow: 'hidden',
                    backgroundColor: colors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {profileLoading ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Ionicons name="person" size={44} color={colors.secondaryForeground} />
                  )}
                  {loading ? (
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.35)',
                      }}
                    >
                      <ActivityIndicator color={colors.primaryForeground} />
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          </Pressable>
        </View>

        <InfoRow icon="shield-checkmark-outline" label="Selfie verification required" />
        <InfoRow icon="location-outline" label="Location captured automatically" />

        {cameraDenied ? (
          <PermissionGuidance
            type="camera"
            onRetry={() => {
              setCameraDenied(false);
              beginCapture();
            }}
          />
        ) : null}

        <Button
          variant="primary"
          size="lg"
          loading={loading}
          onPress={beginCapture}
          icon={<Ionicons name={actionIcon} size={18} color={colors.primaryForeground} />}
          style={{ marginTop: spacing.md, width: '100%' }}
        >
          {actionLabel}
        </Button>
      </Card>

      <Modal
        visible={photoPreviewOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoPreviewOpen(false)}
      >
        <Pressable
          style={{
            flex: 1,
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.45)',
            padding: spacing.lg,
          }}
          onPress={() => setPhotoPreviewOpen(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Card style={{ padding: spacing.lg }}>
              <AppText variant="h3" style={{ fontWeight: '700', marginBottom: spacing.md, textAlign: 'center' }}>
                Check-in photo
              </AppText>
              {photoUrl ? (
                <Image
                  source={{ uri: photoUrl }}
                  style={{
                    width: '100%',
                    aspectRatio: 1,
                    borderRadius: radius.md,
                    backgroundColor: colors.muted,
                  }}
                  resizeMode="contain"
                />
              ) : null}
              <Button
                variant="secondary"
                onPress={() => setPhotoPreviewOpen(false)}
                style={{ marginTop: spacing.md }}
              >
                Close
              </Button>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
