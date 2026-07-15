import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { ComponentGate } from '@/components/ComponentGate';
import { Button, SectionHeader } from '@/components/ui';
import { spacing, colors } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

const ACTIONS: { code: string; label: string; path: `/(agent)/${string}`; icon: IoniconName }[] = [
  { code: 'CRM-0097', label: 'Start Survey', path: '/(agent)/surveys', icon: 'clipboard' },
  { code: 'CRM-0034', label: 'Record Sale', path: '/(agent)/record-sale', icon: 'cart' },
  { code: 'CRM-0034G', label: 'Give Products', path: '/(agent)/give-products', icon: 'gift' },
  { code: 'CRM-0096', label: 'Log Interaction', path: '/(agent)/log-interaction', icon: 'chatbox' },
];

export function QuickActions() {
  const router = useRouter();
  const { isEnabled } = useProjectComponents();
  const actions = ACTIONS.filter((a) => isEnabled(a.code));

  if (actions.length === 0) return null;

  return (
    <ComponentGate code="CRM-0051">
      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}>
        <SectionHeader title="Quick Actions" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {actions.map((action) => (
            <Button
              key={action.code}
              variant="tile"
              style={{ minWidth: '45%', flex: 1 }}
              onPress={() => router.push(action.path as never)}
              icon={<Ionicons name={action.icon} size={20} color={colors.primaryForeground} />}
            >
              {action.label}
            </Button>
          ))}
        </View>
      </View>
    </ComponentGate>
  );
}
