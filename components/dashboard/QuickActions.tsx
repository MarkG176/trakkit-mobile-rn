import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { ComponentGate } from '@/components/ComponentGate';

const ACTIONS = [
  { code: 'CRM-0097', label: 'Start Survey', path: '/(agent)/surveys' as const, emoji: '📋' },
  { code: 'CRM-0034', label: 'Record Sale', path: '/(agent)/record-sale' as const, emoji: '🛒' },
  { code: 'CRM-0034G', label: 'Give Products', path: '/(agent)/give-products' as const, emoji: '🎁' },
  { code: 'CRM-0096', label: 'Log Interaction', path: '/(agent)/log-interaction' as const, emoji: '💬' },
];

export function QuickActions() {
  const router = useRouter();
  const { isEnabled } = useProjectComponents();
  const actions = ACTIONS.filter((a) => isEnabled(a.code));

  if (actions.length === 0) return null;

  return (
    <ComponentGate code="CRM-0051">
      <View className="px-4 py-4">
        <Text className="mb-3 text-base font-bold text-slate-900">Quick Actions</Text>
        <View className="flex-row flex-wrap gap-3">
          {actions.map((action) => (
            <TouchableOpacity
              key={action.code}
              className="min-w-[45%] flex-1 items-center rounded-xl bg-blue-600 px-4 py-4"
              onPress={() => router.push(action.path)}
            >
              <Text className="text-2xl">{action.emoji}</Text>
              <Text className="mt-1 text-center text-xs font-semibold text-white">{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ComponentGate>
  );
}
