// [CRM-0093] Inventory — agent assigned stock list
import { FlatList, View } from 'react-native';
import { Package } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { useInventory } from '@/hooks/useInventory';
import { formatProductName } from '@/utils/formatProductName';
import { AppText, EmptyMessage, LoadingSpinner, Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

function stockColor(amount: number): string {
  if (amount < 5) return colors.destructive;
  if (amount < 10) return colors.warning;
  return colors.success;
}

export default function InventoryScreen() {
  const { inventory, loading } = useInventory();

  return (
    <ComponentGate code="CRM-0093" redirectTo="/(agent)">
      <Screen>
        {loading ? (
          <LoadingSpinner label="Loading inventory" />
        ) : inventory.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
            <Package size={48} color={colors.mutedForeground} />
            <AppText variant="secondary" style={{ marginTop: spacing.md, textAlign: 'center' }}>
              No assigned stock.
            </AppText>
          </View>
        ) : (
          <FlatList
            data={inventory}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.lg }}
            ListEmptyComponent={<EmptyMessage>No assigned stock.</EmptyMessage>}
            renderItem={({ item }) => {
              const display = formatProductName(
                item.name || item.product_name,
                item.sku,
              );
              return (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                    minHeight: 72,
                  }}
                >
                  <View
                    style={{
                      minWidth: 56,
                      paddingHorizontal: spacing.sm,
                      height: 56,
                      borderRadius: radius.md,
                      backgroundColor: colors.primaryLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: spacing.md,
                    }}
                  >
                    <AppText
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: colors.primary,
                        textAlign: 'center',
                      }}
                      numberOfLines={2}
                    >
                      {item.sku?.trim() || 'SKU'}
                    </AppText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText style={{ fontSize: 16, fontWeight: '500' }} numberOfLines={2}>
                      {display}
                    </AppText>
                    <AppText variant="secondary" style={{ marginTop: 4 }}>
                      Stock:{' '}
                      <AppText style={{ fontWeight: '600', color: stockColor(item.amount_issued) }}>
                        {item.amount_issued}
                      </AppText>
                    </AppText>
                  </View>
                </View>
              );
            }}
          />
        )}
      </Screen>
    </ComponentGate>
  );
}
