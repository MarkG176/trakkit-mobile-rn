import { useState } from 'react';
import { Alert, View } from 'react-native';
import { AppText, Button, Card } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { spacing } from '@/theme';
import {
  parseCount,
  reportAlert,
  SkuCountField,
  submitStockRows,
  todayWorkDate,
  useReportSkus,
} from './shared';

export function MorningStockReportForm() {
  const { user } = useAuth();
  const { skus, loading: skusLoading } = useReportSkus();
  const [openingBySku, setOpeningBySku] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) return;

    const rows = skus
      .map((sku) => {
        const openingStock = parseCount(openingBySku[sku.productVariantId] ?? '');
        if (openingStock == null) return null;
        return {
          agent_id: user.id,
          product_variant_id: sku.productVariantId,
          report_type: 'morning_stock',
          work_date: todayWorkDate(),
          opening_stock: openingStock,
          reported_at: new Date().toISOString(),
        };
      })
      .filter(Boolean) as Record<string, unknown>[];

    if (!rows.length) {
      Alert.alert('Missing counts', 'Enter opening stock for at least one product.');
      return;
    }

    setLoading(true);
    try {
      const { synced } = await submitStockRows(rows);
      reportAlert(synced);
      setOpeningBySku({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
      <AppText variant="h3" style={{ fontWeight: '700', marginBottom: spacing.sm }}>
        Morning Stock Count
      </AppText>
      <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
        Opening stock check at the start of an in-store shift.
      </AppText>

      {skusLoading ? null : skus.length === 0 ? (
        <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
          No assigned products for this workspace.
        </AppText>
      ) : (
        skus.map((sku) => (
          <View key={sku.productVariantId}>
            <SkuCountField
              label={`${sku.name} — opening stock`}
              value={openingBySku[sku.productVariantId] ?? ''}
              onChangeText={(value) =>
                setOpeningBySku((prev) => ({ ...prev, [sku.productVariantId]: value }))
              }
            />
          </View>
        ))
      )}

      <Button onPress={submit} loading={loading} disabled={skus.length === 0}>
        Submit morning stock
      </Button>
    </Card>
  );
}
