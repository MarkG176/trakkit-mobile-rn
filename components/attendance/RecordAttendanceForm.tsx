import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
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
import { AppText, Button, Card, IconButton } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

interface AttendanceProfile {
  displayName: string;
  teamName: string;
  teamLabel: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  breakLabel: string | null;
  photoUrl: string | null;
}

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
    return `${format(startDate, 'h:mm')}ΓÇô${format(endDate, 'h:mm a')}`;
  }
  return `${format(startDate, 'h:mm a')}ΓÇô${format(endDate, 'h:mm a')}`;
}

function StatusItem({
  icon,
  iconColor,
  label,
}: {
  icon: string;
  iconColor: string;
  label: string;
  muted?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      <AppText style={{ color: iconColor, fontSize: 15 }}>{icon}</AppText>
      <AppText variant="secondary" style={{ fontSize: 13 }}>{label}</AppText>
    </View>
  );
}

export function RecordAttendanceForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { isCheckedIn, refresh } = useAgentStatus();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'checked_in' | 'checked_out' | null>(null);
  const [profile, setProfile] = useState<AttendanceProfile>({
    displayName: 'Agent',
    teamName: 'Team',
    teamLabel: 'Field Team',
    checkInTime: null,
    checkOutTime: null,
    breakLabel: null,
    photoUrl: null,
  });

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

      const [roleRes, teamRes, statusRes, breakRes, photoUrl] = await Promise.all([
        supabase
          .from('user_roles')
          .select('display_name, first_name, last_name, role_title')
          .eq('user_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .maybeSingle(),
        supabase
          .from('team_members')
          .select('teams(name)')
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle(),
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

      const role = roleRes.data;
      const displayName =
        role?.display_name?.trim() ||
        [role?.first_name, role?.last_name].filter(Boolean).join(' ').trim() ||
        user.email?.split('@')[0] ||
        'Agent';

      const teamName = teamRes.data?.teams?.name ?? 'Team';
      const teamLabel = role?.role_title?.trim() || teamName || 'Field Team';

      const logs = statusRes.data ?? [];
      const firstCheckIn = logs.find((entry) => entry.status === 'checked_in');
      const lastCheckOut = [...logs].reverse().find((entry) => entry.status === 'checked_out');

      const checkInIso = firstCheckIn?.timestamp ?? firstCheckIn?.created_at ?? null;
      const checkOutIso = lastCheckOut?.timestamp ?? lastCheckOut?.created_at ?? null;

      const breakSegment = breakRes.data;
      const breakLabel = breakSegment
        ? formatBreakRange(breakSegment.segment_start, breakSegment.segment_end)
        : null;

      setProfile({
        displayName,
        teamName,
        teamLabel,
        checkInTime: formatClockTime(checkInIso),
        checkOutTime: formatClockTime(checkOutIso),
        breakLabel,
        photoUrl,
      });
    } catch (error) {
      console.error('Error loading attendance profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, [user, currentWorkspaceId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile, isCheckedIn]);

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
      await loadProfile();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setLoading(false);
      setPendingStatus(null);
    }
  };

  if (showCamera) {
    return (
      <ComponentGate code="CRM-0026">
        <Card>
          <AppText style={{ textAlign: 'center', fontWeight: '500', marginBottom: spacing.md }}>
            Take a selfie to {pendingStatus === 'checked_in' ? 'check in' : 'check out'}
          </AppText>
          <CameraCapture onCapture={handleCapture} label="Capture selfie" />
          <Button variant="ghost" onPress={() => setShowCamera(false)} style={{ marginTop: spacing.md }}>
            Cancel
          </Button>
        </Card>
      </ComponentGate>
    );
  }

  const checkInLabel = profile.checkInTime ? `Checked in ${profile.checkInTime}` : 'Not checked in';
  const checkOutLabel = profile.checkOutTime
    ? `Checked out ${profile.checkOutTime}`
    : isCheckedIn
      ? 'Still checked in'
      : 'Not checked out';

  return (
    <ComponentGate code="CRM-0026">
      <Card style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing['2xl'] }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing['3xl'],
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <AppText style={{ fontWeight: '500' }}>{profile.teamName}</AppText>
            <Ionicons name="chevron-down" size={16} color={colors.secondaryForeground} />
          </View>
          <IconButton
            accessibilityLabel="Menu"
            onPress={() => router.push('/(agent)/more')}
            style={{ backgroundColor: 'transparent' }}
          >
            <Ionicons name="menu" size={20} color={colors.foreground} />
          </IconButton>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Pressable
            accessibilityLabel={isCheckedIn ? 'Check out' : 'Check in'}
            accessibilityHint="Opens camera to capture a selfie"
            style={{ marginBottom: spacing.xl }}
            disabled={loading}
            onPress={handleAvatarPress}
          >
            <View
              style={{
                width: 108,
                height: 108,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderRadius: radius.full,
                backgroundColor: colors.accent,
              }}
            >
              {profile.photoUrl ? (
                <Image source={{ uri: profile.photoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={32} color={colors.secondaryForeground} />
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
                    backgroundColor: 'rgba(0,0,0,0.3)',
                  }}
                >
                  <ActivityIndicator color={colors.primaryForeground} />
                </View>
              ) : null}
            </View>
          </Pressable>

          {profileLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing['2xl'] }} />
          ) : (
            <>
              <AppText variant="h2" style={{ textAlign: 'center', marginBottom: spacing.xs }}>
                {profile.displayName}
              </AppText>
              <AppText style={{ textAlign: 'center', fontWeight: '500', marginBottom: spacing['2xl'] }}>
                {profile.teamLabel}
              </AppText>
            </>
          )}

          <View style={{ height: 1, width: '100%', backgroundColor: colors.border, marginBottom: spacing.xl }} />

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
            }}
          >
            <StatusItem icon="↪" iconColor={colors.success} label={checkInLabel} />
            {profile.breakLabel ? (
              <>
                <AppText style={{ color: colors.border }}>·</AppText>
                <StatusItem icon="☕" iconColor={colors.warning} label={`Break ${profile.breakLabel}`} />
              </>
            ) : null}
            <AppText style={{ color: colors.border }}>·</AppText>
            <StatusItem icon="↩" iconColor={colors.secondaryForeground} label={checkOutLabel} />
          </View>

          <AppText variant="secondary" style={{ marginTop: spacing.lg, textAlign: 'center' }}>
            Tap photo to {isCheckedIn ? 'check out' : 'check in'}
          </AppText>
        </View>
      </Card>
    </ComponentGate>
  );
}
