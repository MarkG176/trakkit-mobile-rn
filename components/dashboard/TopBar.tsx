import { View, Text } from 'react-native';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { useAuth } from '@/providers/AuthProvider';

export function TopBar() {
  const { user } = useAuth();

  return (
    <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
      <View>
        <Text className="text-lg font-bold text-slate-900">TraKKiT</Text>
        <Text className="text-xs text-slate-500">{user?.email}</Text>
      </View>
      <WorkspaceSwitcher />
    </View>
  );
}
