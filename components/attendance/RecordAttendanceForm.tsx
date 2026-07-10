import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
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
    return `${format(startDate, 'h:mm')}–${format(endDate, 'h:mm a')}`;
  }
  return `${format(startDate, 'h:mm a')}–${format(endDate, 'h:mm a')}`;
}

function StatusItem({
  icon,
  iconColor,
  label,
  muted,
}: {
  icon: string;
  iconColor: string;
  label: string;
  muted?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-1">
      <Text style={{ color: iconColor, fontSize: 15 }}>{icon}</Text>
      <Text className={`text-[13px] ${muted ? 'text-slate-400' : 'text-slate-500'}`}>{label}</Text>
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

  const startCheckIn = (status: 'checked_in' | 'checked_out') => {
    setPendingStatus(status);
    setShowCamera(true);
  };

  const handleAvatarPress = () => {
    if (loading) return;
    startCheckIn(isCheckedIn ? 'checked_out' : 'checked_in');
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
        <View className="w-full rounded-2xl bg-white p-5">
          <Text className="mb-3 text-center text-[15px] font-medium text-slate-800">
            Take a selfie to {pendingStatus === 'checked_in' ? 'check in' : 'check out'}
          </Text>
          <CameraCapture onCapture={handleCapture} label="Capture selfie" />
          <TouchableOpacity className="mt-3" onPress={() => setShowCamera(false)}>
            <Text className="text-center text-slate-500">Cancel</Text>
          </TouchableOpacity>
        </View>
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
      <View className="w-full rounded-2xl bg-white px-5 py-6">
        <View className="mb-8 flex-row items-center justify-between">
          <View className="flex-row items-center gap-1">
            <Text className="text-[15px] font-medium text-slate-900">{profile.teamName}</Text>
            <Text className="text-base text-slate-400">▾</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Menu"
            className="p-1.5"
            onPress={() => router.push('/(agent)/more')}
          >
            <Text className="text-xl text-slate-900">☰</Text>
          </TouchableOpacity>
        </View>

        <View className="items-center">
          <Pressable
            accessibilityLabel={isCheckedIn ? 'Check out' : 'Check in'}
            accessibilityHint="Opens camera to capture a selfie"
            className="mb-5"
            disabled={loading}
            onPress={handleAvatarPress}
          >
            <View className="relative h-[108px] w-[108px] items-center justify-center overflow-hidden rounded-full bg-blue-50">
              {profile.photoUrl ? (
                <Image
                  source={{ uri: profile.photoUrl }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-5xl text-blue-400">👤</Text>
              )}
              {loading && (
                <View className="absolute inset-0 items-center justify-center bg-black/30">
                  <ActivityIndicator color="#ffffff" />
                </View>
              )}
            </View>
          </Pressable>

          {profileLoading ? (
            <ActivityIndicator className="mb-6" color="#2563eb" />
          ) : (
            <>
              <Text className="mb-1 text-center text-[22px] font-medium text-slate-900">
                {profile.displayName}
              </Text>
              <Text className="mb-6 text-center text-[15px] font-medium text-slate-900">
                {profile.teamLabel}
              </Text>
            </>
          )}

          <View className="mb-5 h-px w-full bg-slate-200" />

          <View className="flex-row flex-wrap items-center justify-center gap-x-2.5 gap-y-2">
            <StatusItem icon="↪" iconColor="#16a34a" label={checkInLabel} />
            {profile.breakLabel ? (
              <>
                <Text className="text-slate-300">·</Text>
                <StatusItem icon="☕" iconColor="#d97706" label={`Break ${profile.breakLabel}`} />
              </>
            ) : null}
            <Text className="text-slate-300">·</Text>
            <StatusItem
              icon="↩"
              iconColor="#94a3b8"
              label={checkOutLabel}
              muted={!profile.checkOutTime}
            />
          </View>

          <Text className="mt-4 text-center text-xs text-slate-400">
            Tap photo to {isCheckedIn ? 'check out' : 'check in'}
          </Text>
        </View>
      </View>
    </ComponentGate>
  );
}
