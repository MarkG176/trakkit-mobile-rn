import { View } from 'react-native';
import { ClipboardList, ShoppingCart, Gift, MessageSquare } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { ComponentGate } from '@/components/ComponentGate';
import { Button, SectionHeader } from '@/components/ui';
import { spacing, colors } from '@/theme';

const ACTIONS = [
  { code: 'CRM-0097', label: 'Start Survey', path: '/(agent)/surveys' as const, Icon: ClipboardList },
  { code: 'CRM-0034', label: 'Record Sale', path: '/(agent)/record-sale' as const, Icon: ShoppingCart },
  { code: 'CRM-0034G', label: 'Give Products', path: '/(agent)/give-products' as const, Icon: Gift },
  { code: 'CRM-0096', label: 'Log Interaction', path: '/(agent)/log-interaction' as const, Icon: MessageSquare },
] as const;

export function QuickActions() {
  const router = useRouter();
  const { isEnabled } = useProjectComponents();
  const actions = ACTIONS.filter((a) => isEnabled(a.code));

  if (actions.length === 0) return null;

  return (
    <ComponentGate code="CRM-0051">
      <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}>
        <SectionHeader title="Quick Actions" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {actions.map((action) => (
            <Button
              key={action.code}
              variant="tile"
              style={{ minWidth: '45%', flex: 1 }}
              onPress={() => router.push(action.path)}
              icon={<action.Icon size={20} color={colors.primaryForeground} />}
            >
              {action.label}
            </Button>
          ))}
        </View>
      </View>
    </ComponentGate>
  );
}
