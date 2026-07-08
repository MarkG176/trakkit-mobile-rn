import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';

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
    <View className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <Text className="mb-1 font-semibold text-amber-900">{msg.title}</Text>
      <Text className="mb-3 text-sm text-amber-800">{msg.body}</Text>
      <View className="flex-row gap-2">
        {onRetry && (
          <TouchableOpacity className="flex-1 rounded-lg bg-amber-600 px-3 py-2" onPress={onRetry}>
            <Text className="text-center text-sm font-medium text-white">Try again</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity className="flex-1 rounded-lg border border-amber-300 px-3 py-2" onPress={openSettings}>
          <Text className="text-center text-sm font-medium text-amber-900">Open settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
