import { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComponentGate } from '@/components/ComponentGate';
import { useInventory } from '@/hooks/useInventory';
import {
  Screen,
  LoadingSpinner,
  AppText,
  Card,
  Badge,
} from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

function stockBadge(amount: number): { label: string; tone: 'success' | 'warning' | 'destructive' } {
  if (amount <= 0) return { label: 'Out of Stock', tone: 'destructive' };
  if (amount < 10) return { label: 'Low Stock', tone: 'warning' };
  return { label: 'Available', tone: 'success' };
}

export default function InventoryScreen() {
  const { inventory, loading } = useInventory();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return inventory;
    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.sku?.toLowerCase().includes(term) ?? false),
    );
  }, [inventory, search]);

  return (
    <ComponentGate code="CRM-0093" redirectTo="/(agent)">
      <Screen scroll>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            backgroundColor: colors.card,
            minHeight: 48,
            marginBottom: spacing.md,
          }}
        >
          <Ionicons name="search" size={18} color={colors.secondaryForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search inventory..."
            placeholderTextColor={colors.secondaryForeground}
            style={{ flex: 1, fontSize: 16, color: colors.foreground, paddingVertical: spacing.sm }}
          />
        </View>

        {loading ? (
          <LoadingSpinner label="Loading inventory" />
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
            <Ionicons name="cube-outline" size={48} color={colors.mutedForeground} />
            <AppText variant="secondary" style={{ marginTop: spacing.md, textAlign: 'center' }}>
              {inventory.length === 0 ? 'No assigned stock.' : 'No products match your search.'}
            </AppText>
          </View>
        ) : (
          <Card style={{ paddingVertical: spacing.xs, paddingHorizontal: 0, overflow: 'hidden' }}>
            {filtered.map((item, index) => {
              const badge = stockBadge(item.amount_issued);
              return (
                <View
                  key={item.product_variant_id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.md,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                    gap: spacing.md,
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: radius.md,
                      backgroundColor: colors.muted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="cube-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, flexShrink: 1, minWidth: 0 }}>
                    <AppText style={{ fontSize: 16, fontWeight: '600', flexShrink: 1 }} numberOfLines={2}>
                      {item.name}
                    </AppText>
                    {item.sku ? (
                      <AppText variant="secondary" style={{ marginTop: 2, fontSize: 12 }}>
                        {item.sku}
                      </AppText>
                    ) : null}
                    <AppText variant="secondary" style={{ marginTop: 2 }}>
                      Qty: {item.amount_issued}
                    </AppText>
                  </View>
                  <Badge variant={badge.tone}>{badge.label}</Badge>
                </View>
              );
            })}
          </Card>
        )}
      </Screen>
    </ComponentGate>
  );
}
