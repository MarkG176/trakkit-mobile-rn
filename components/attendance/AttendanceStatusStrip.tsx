import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
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
import { getLastCheckInPhotoUrl, uploadCheckInPhoto } from '@/utils/agentPhotos';
import { AppText, Button, Card } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

type AttendanceStatus = 'checked_in' | 'checked_out';

function formatClockTime(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return format(date, 'h:mm a');
}

function formatBreakRange(start: string, end: string | null): string {
  const startDate = new Date(start);
  if (!end) return format(startDate, 'h:mm a');
  const endDate = new Date(end);
  const startMeridiem = format(startDate, 'a');
  const endMeridiem = format(endDate, 'a');
  if (startMeridiem === endMeridiem) {
    return `${format(startDate, 'h:mm')}–${format(endDate, 'h:mm a')}`;
  }
  return `${format(startDate, 'h:mm a')}–${format(endDate, 'h:mm a')}`;
}

function StatusLine({ icon, iconColor, label }: { icon: string; iconColor: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%' }}>
      <AppText style={{ color: iconColor, fontSize: 13 }}>{icon}</AppText>
      <AppText variant="secondary" style={{ fontSize: 11, flexShrink: 1 }} numberOfLines={2}>
        {label}
      </AppText>
    </View>
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
  const [profileLoading, setProfileLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<AttendanceStatus | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [breakLabel, setBreakLabel] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user || !currentWorkspaceId) {
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const today = startOfDay.toISOString().split('T')[0];

      const [statusRes, breakRes, lastPhoto] = await Promise.all([
        supabase
          .from('agent_status_log')
          .select('status, timestamp, created_at')
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .gte('timestamp', startOfDay.toISOString())
          .order('timestamp', { ascending: true }),
        supabase
          .from('agent_work_segments')
          .select('segment_start, segment_end')
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('work_date', today)
          .eq('segment_type', 'break')
          .order('segment_start', { ascending: true })
          .limit(1)
          .maybeSingle(),
        getLastCheckInPhotoUrl(user.id),
      ]);

      const logs = statusRes.data ?? [];
      const firstCheckIn = logs.find((entry) => entry.status === 'checked_in');
      const lastCheckOut = [...logs].reverse().find((entry) => entry.status === 'checked_out');

      setCheckInTime(formatClockTime(firstCheckIn?.timestamp ?? firstCheckIn?.created_at ?? null));
      setCheckOutTime(formatClockTime(lastCheckOut?.timestamp ?? lastCheckOut?.created_at ?? null));

      const breakSegment = breakRes.data;
      setBreakLabel(
        breakSegment ? formatBreakRange(breakSegment.segment_start, breakSegment.segment_end) : null,
      );
      setPhotoUrl(lastPhoto);
    } catch (error) {
      console.error('Error loading check-in profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [user, currentWorkspaceId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile, isCheckedIn]);

  useEffect(() => {
    Location.getForegroundPermissionsAsync().then(({ status }) => {
      setLocationDenied(status === 'denied');
    });
  }, []);

  const handleAvatarPress = () => {
    if (loading) return;
    setPendingStatus(isCheckedIn ? 'checked_out' : 'checked_in');
    setShowCamera(true);
  };

  const handleCapture = async (uri: string) => {
    if (!user || !currentWorkspaceId || !pendingStatus) return;
    setLoading(true);
    setShowCamera(false);

    try {
      const location = await getCurrentLocation();
      setLocationDenied(false);
      const uploaded = await uploadCheckInPhoto(uri, user.id);

      const payload = {
        agent_id: user.id,
        workspace_id: currentWorkspaceId,
        status: pendingStatus,
        location_lat: location.latitude,
        location_lng: location.longitude,
        selfie_url: uploaded,
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
      await loadProfile();
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
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
          <Card>
            <AppText style={{ textAlign: 'center', fontWeight: '500', marginBottom: spacing.md, flexShrink: 1 }}>
              Take a selfie to {pendingStatus === 'checked_in' ? 'check in' : 'check out'}
            </AppText>
            <CameraCapture onCapture={handleCapture} label="Capture selfie" />
            <Button variant="ghost" onPress={() => setShowCamera(false)} style={{ marginTop: spacing.md }}>
              Cancel
            </Button>
          </Card>
        </View>
      </ComponentGate>
    );
  }

  const checkInLabel = checkInTime ? `In ${checkInTime}` : 'Not in';
  const checkOutLabel = checkOutTime
    ? `Out ${checkOutTime}`
    : isCheckedIn
      ? 'Still in'
      : 'Not out';

  return (
    <ComponentGate code="CRM-0026">
      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, alignItems: 'center' }}>
        <Card
          style={{
            alignSelf: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            alignItems: 'center',
            maxWidth: 220,
          }}
        >
          {locationDenied ? (
            <Pressable
              onPress={openSettings}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm }}
            >
              <Ionicons name="warning-outline" size={14} color={colors.warning} />
              <AppText variant="secondary" style={{ color: colors.warning, fontSize: 11, flexShrink: 1 }}>
                Location denied
              </AppText>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityLabel={isCheckedIn ? 'Check out' : 'Check in'}
            accessibilityHint="Opens camera to capture a selfie"
            disabled={loading}
            onPress={handleAvatarPress}
          >
            <View
              style={{
                width: 56,
                height: 56,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: radius.full,
                backgroundColor: colors.accent,
                borderWidth: 2,
                borderColor: isCheckedIn ? colors.success : colors.border,
              }}
            >
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={26} color={colors.secondaryForeground} />
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
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                </View>
              ) : null}
            </View>
          </Pressable>

          {profileLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />
          ) : (
            <View style={{ marginTop: spacing.sm, alignItems: 'center', width: '100%' }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs }}>
                <StatusLine icon="↪" iconColor={colors.success} label={checkInLabel} />
                {breakLabel ? (
                  <>
                    <AppText style={{ color: colors.border, fontSize: 11 }}>·</AppText>
                    <StatusLine icon="☕" iconColor={colors.warning} label={`Break ${breakLabel}`} />
                  </>
                ) : null}
                <AppText style={{ color: colors.border, fontSize: 11 }}>·</AppText>
                <StatusLine icon="↩" iconColor={colors.secondaryForeground} label={checkOutLabel} />
              </View>
              <AppText variant="secondary" style={{ marginTop: spacing.xs, fontSize: 10, textAlign: 'center', flexShrink: 1 }}>
                Tap photo to {isCheckedIn ? 'check out' : 'check in'}
              </AppText>
            </View>
          )}
        </Card>
      </View>
    </ComponentGate>
  );
}
