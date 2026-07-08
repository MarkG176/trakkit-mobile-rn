import { ScrollView, Text, View } from 'react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { useAgentStatus } from '@/providers/AgentStatusProvider';
import { startBackgroundTracking, stopBackgroundTracking } from '@/tasks/backgroundLocation';
import { PermissionGuidance } from '@/components/PermissionGuidance';
import { useState } from 'react';
import { TouchableOpacity } from 'react-native';

export default function SettingsScreen() {
  const { isCheckedIn } = useAgentStatus();
  const [bgDenied, setBgDenied] = useState(false);

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
      <ScrollView className="flex-1 bg-white px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Settings</Text>
        <View className="mb-4 rounded-xl border border-slate-200 p-4">
          <Text className="mb-2 font-medium text-slate-900">Background location</Text>
          <Text className="mb-3 text-sm text-slate-600">
            Tracks your position during active shifts for supervisor visibility.
          </Text>
          {bgDenied && <PermissionGuidance type="background-location" onRetry={toggleBackground} />}
          <TouchableOpacity className="rounded-xl bg-blue-600 py-3" onPress={toggleBackground}>
            <Text className="text-center font-semibold text-white">
              {isCheckedIn ? 'Enable background tracking' : 'Stop background tracking'}
            </Text>
          </TouchableOpacity>
        </View>
        <Text className="text-sm text-slate-500">Language: English (v1)</Text>
      </ScrollView>
    </ComponentGate>
  );
}
