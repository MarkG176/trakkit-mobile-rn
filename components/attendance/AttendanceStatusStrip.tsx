import { useCallback, useEffect, useState } from 'react';
import { View, Alert, Linking, Platform, Pressable } from 'react-native';
import * as Location from 'expo-location';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useAgentStatus } from '@/providers/AgentStatusProvider';
import { CameraCapture } from '@/components/CameraCapture';
import { ComponentGate } from '@/components/ComponentGate';
import { getCurrentLocation } from '@/utils/location';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { startBackgroundTracking, stopBackgroundTracking } from '@/tasks/backgroundLocation';
import { uploadCheckInPhoto } from '@/utils/agentPhotos';
import { AppText, Button, Badge } from '@/components/ui';
import { colors, spacing } from '@/theme';

type AttendanceStatus = 'checked_in' | 'checked_out';

function getStatusBadge(isCheckedIn: boolean, checkInTime: string | null) {
  if (isCheckedIn) {
    return {
      label: checkInTime ? `Checked in ${checkInTime}` : 'Checked in',
      variant: 'success' as const,
    };
  }
  return { label: 'Not checked in', variant: 'outline' as const };
}

function getNextAction(isCheckedIn: boolean): {
  label: string;
  status: AttendanceStatus;
  variant: 'primary' | 'destructive';
} {
  if (isCheckedIn) {
    return { label: 'Check Out', status: 'checked_out', variant: 'destructive' };
  }
  return { label: 'Check In', status: 'checked_in', variant: 'primary' };
}

function formatClockTime(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, 'h:mm a');
}

function showCaptureInfo() {
  Alert.alert(
    'Check-in details',
    'Camera will open automatically to capture a selfie. Location will be captured automatically with each check-in or check-out.',
  );
}

function openSettings() {
  if (Platform.OS === 'android') {
    Linking.openSettings();
  } else {
    Linking.openURL('app-settings:');
  }
}

export function AttendanceStatusStrip() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { isCheckedIn, refresh } = useAgentStatus();
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<AttendanceStatus | null>(null);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  const loadCheckInTime = useCallback(async () => {
    if (!user || !currentWorkspaceId) return;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('agent_status_log')
      .select('status, timestamp, created_at')
      .eq('agent_id', user.id)
      .eq('workspace_id', currentWorkspaceId)
      .gte('timestamp', startOfDay.toISOString())
      .order('timestamp', { ascending: true });

    const firstCheckIn = (data ?? []).find((entry) => entry.status === 'checked_in');
    const checkInIso = firstCheckIn?.timestamp ?? firstCheckIn?.created_at ?? null;
    setCheckInTime(formatClockTime(checkInIso));
  }, [user, currentWorkspaceId]);

  useEffect(() => {
    loadCheckInTime();
  }, [loadCheckInTime, isCheckedIn]);

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      setLocationDenied(status === 'denied');
    });
  }, []);

  const beginCapture = (status: AttendanceStatus) => {
    if (loading) return;
    setPendingStatus(status);
    setShowCamera(true);
  };

  const handleCapture = async (uri: string) => {
    if (!user || !currentWorkspaceId || !pendingStatus) return;
    setLoading(true);
    setShowCamera(false);

    try {
      const location = await getCurrentLocation();
      setLocationDenied(false);
      const photoUrl = await uploadCheckInPhoto(uri, user.id);

      const payload = {
        agent_id: user.id,
        workspace_id: currentWorkspaceId,
        status: pendingStatus,
        location_lat: location.latitude,
        location_lng: location.longitude,
        selfie_url: photoUrl,
        timestamp: new Date().toISOString(),
      };

      const { synced } = await writeWithOfflineQueue('agent_status_log', payload);
      if (!synced) {
        Alert.alert('Saved offline', 'Check-in will sync when you reconnect.');
      } else {
        Alert.alert('Success', pendingStatus === 'checked_in' ? 'Checked in!' : 'Checked out!');
      }

      if (pendingStatus === 'checked_in') {
        await startBackgroundTracking();
      } else {
        await stopBackgroundTracking();
      }

      await refresh();
      await loadCheckInTime();
    } catch (error) {
      if (error instanceof Error && error.message.includes('Location permission')) {
        setLocationDenied(true);
      }
      Alert.alert('Error', error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setLoading(false);
      setPendingStatus(null);
    }
  };

  if (showCamera) {
    return (
      <ComponentGate code="CRM-0026">
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
          }}
        >
          <AppText style={{ textAlign: 'center', fontWeight: '500', marginBottom: spacing.md }}>
            Take a selfie to {pendingStatus === 'checked_in' ? 'check in' : 'check out'}
          </AppText>
          <CameraCapture onCapture={handleCapture} label="Capture selfie" />
          <Button variant="ghost" onPress={() => setShowCamera(false)} style={{ marginTop: spacing.md }}>
            Cancel
          </Button>
        </View>
      </ComponentGate>
    );
  }

  const statusBadge = getStatusBadge(isCheckedIn, checkInTime);
  const nextAction = getNextAction(isCheckedIn);

  return (
    <ComponentGate code="CRM-0026">
      <View
        style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        {locationDenied ? (
          <Pressable
            onPress={openSettings}
            accessibilityLabel="Location permission denied. Open settings."
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.md,
              paddingTop: spacing.sm,
              minHeight: 44,
            }}
          >
            <Ionicons name="warning-outline" size={16} color={colors.warning} />
            <AppText variant="secondary" style={{ color: colors.warning, flex: 1 }}>
              Location denied — tap to open settings
            </AppText>
          </Pressable>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.sm,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 }}>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            <Pressable
              onPress={showCaptureInfo}
              accessibilityLabel="Check-in information"
              hitSlop={8}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="information-circle-outline" size={20} color={colors.secondaryForeground} />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Button
              variant={nextAction.variant}
              size="lg"
              loading={loading}
              onPress={() => beginCapture(nextAction.status)}
              style={{ minWidth: 100 }}
            >
              {nextAction.label}
            </Button>
          </View>
        </View>
      </View>
    </ComponentGate>
  );
}
