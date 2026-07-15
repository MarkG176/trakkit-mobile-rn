import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import {
  Screen,
  LoadingSpinner,
  EmptyMessage,
  AppText,
} from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

function stockColor(amount: number): string {
  if (amount < 5) return colors.destructive;
  if (amount < 10) return colors.warning;
  return colors.success;
}

export default function InventoryScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<{ id: string; name?: string | null; amount_issued: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('agent_task_inventory')
        .select('id, name, amount_issued')
        .eq('agent_id', user.id);

      setItems(data ?? []);
      setLoading(false);
    };
    load();
  }, [user?.id]);

  return (
    <ComponentGate code="CRM-0093" redirectTo="/(agent)">
      <Screen scroll title="Inventory" subtitle="Your assigned products">
        {loading ? (
          <LoadingSpinner label="Loading inventory" />
        ) : items.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
            <Ionicons name="cube-outline" size={48} color={colors.mutedForeground} />
            <AppText variant="secondary" style={{ marginTop: spacing.md, textAlign: 'center' }}>
              No assigned stock.
            </AppText>
          </View>
        ) : (
          items.map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: '#EBF0F2',
                borderRadius: radius.md,
                padding: spacing.md,
                marginBottom: spacing.sm,
                shadowColor: '#64748B',
                shadowOpacity: 0.06,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 2 },
                elevation: 1,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: radius.md,
                  backgroundColor: colors.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.md,
                }}
              >
                <Ionicons name="cube" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontSize: 18, fontWeight: '500' }}>{item.name ?? 'Product'}</AppText>
                <AppText variant="secondary" style={{ marginTop: 4 }}>
                  Stock:{' '}
                  <AppText style={{ fontWeight: '600', color: stockColor(item.amount_issued) }}>
                    {item.amount_issued}
                  </AppText>
                </AppText>
              </View>
            </View>
          ))
        )}
      </Screen>
    </ComponentGate>
  );
}
