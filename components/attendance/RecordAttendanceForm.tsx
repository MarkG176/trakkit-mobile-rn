import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useAgentStatus } from '@/providers/AgentStatusProvider';
import { CameraCapture } from '@/components/CameraCapture';
import { getCurrentLocation } from '@/utils/location';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { startBackgroundTracking, stopBackgroundTracking } from '@/tasks/backgroundLocation';
import * as FileSystem from 'expo-file-system';

async function uploadPhoto(uri: string, userId: string): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const path = `check-ins/${userId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from('agent-photos')
      .upload(path, decode(base64), { contentType: 'image/jpeg', upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('agent-photos').getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}

function decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function RecordAttendanceForm() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { isCheckedIn, refresh } = useAgentStatus();
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'checked_in' | 'checked_out' | null>(null);

  const startCheckIn = (status: 'checked_in' | 'checked_out') => {
    setPendingStatus(status);
    setShowCamera(true);
  };

  const handleCapture = async (uri: string) => {
    if (!user || !currentWorkspaceId || !pendingStatus) return;
    setLoading(true);
    setShowCamera(false);

    try {
      const location = await getCurrentLocation();
      const photoUrl = await uploadPhoto(uri, user.id);

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
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Check-in failed');
    } finally {
      setLoading(false);
      setPendingStatus(null);
    }
  };

  if (showCamera) {
    return (
      <View className="w-full rounded-xl border border-slate-200 bg-white p-4">
        <Text className="mb-3 text-center font-semibold text-slate-800">Take a selfie to continue</Text>
        <CameraCapture onCapture={handleCapture} label="Capture selfie" />
        <TouchableOpacity className="mt-3" onPress={() => setShowCamera(false)}>
          <Text className="text-center text-slate-500">Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="w-full rounded-xl border border-slate-200 bg-white p-4">
      <Text className="mb-3 text-center font-semibold text-slate-800">
        {isCheckedIn ? 'You are checked in' : 'Not checked in'}
      </Text>
      {loading ? (
        <ActivityIndicator color="#2563eb" />
      ) : (
        <View className="flex-row gap-3">
          {!isCheckedIn ? (
            <TouchableOpacity
              className="flex-1 rounded-xl bg-green-600 py-3"
              onPress={() => startCheckIn('checked_in')}
            >
              <Text className="text-center font-semibold text-white">Check In</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="flex-1 rounded-xl bg-slate-700 py-3"
              onPress={() => startCheckIn('checked_out')}
            >
              <Text className="text-center font-semibold text-white">Check Out</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
