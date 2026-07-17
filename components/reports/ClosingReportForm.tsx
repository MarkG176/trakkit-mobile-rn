import { useState } from 'react';
import { Alert, View } from 'react-native';
import { FormField } from '@/components/forms/FormField';
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

export function ClosingReportForm() {
  const { user } = useAuth();
  const { skus, loading: skusLoading } = useReportSkus();
  const [notes, setNotes] = useState('');
  const [closingBySku, setClosingBySku] = useState<Record<string, string>>({});
  const [soldBySku, setSoldBySku] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) return;

    const rows = skus
      .map((sku) => {
        const closingStock = parseCount(closingBySku[sku.productVariantId] ?? '');
        const quantitySold = parseCount(soldBySku[sku.productVariantId] ?? '');
        if (closingStock == null && quantitySold == null) return null;
        return {
          agent_id: user.id,
          product_variant_id: sku.productVariantId,
          report_type: 'closing',
          work_date: todayWorkDate(),
          closing_stock: closingStock,
          quantity_sold: quantitySold,
          notes: notes.trim() || null,
          reported_at: new Date().toISOString(),
        };
      })
      .filter(Boolean) as Record<string, unknown>[];

    if (!rows.length) {
      Alert.alert('Missing counts', 'Enter closing stock or units sold for at least one product.');
      return;
    }

    setLoading(true);
    try {
      const { synced } = await submitStockRows(rows);
      reportAlert(synced);
      setNotes('');
      setClosingBySku({});
      setSoldBySku({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
      <AppText variant="h3" style={{ fontWeight: '700', marginBottom: spacing.sm }}>
        In-store Closing Report
      </AppText>
      <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
        Capture closing stock and day totals per SKU.
      </AppText>

      {skusLoading ? null : skus.length === 0 ? (
        <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
          No assigned products for this workspace.
        </AppText>
      ) : (
        skus.map((sku) => (
          <View key={sku.productVariantId} style={{ marginBottom: spacing.sm }}>
            <AppText style={{ fontWeight: '500', marginBottom: spacing.xs }}>{sku.name}</AppText>
            <SkuCountField
              label="Closing stock"
              value={closingBySku[sku.productVariantId] ?? ''}
              onChangeText={(value) =>
                setClosingBySku((prev) => ({ ...prev, [sku.productVariantId]: value }))
              }
            />
            <SkuCountField
              label="Quantity sold"
              value={soldBySku[sku.productVariantId] ?? ''}
              onChangeText={(value) =>
                setSoldBySku((prev) => ({ ...prev, [sku.productVariantId]: value }))
              }
            />
          </View>
        ))
      )}

      <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />
      <Button onPress={submit} loading={loading} disabled={skus.length === 0}>
        Submit closing report
      </Button>
    </Card>
  );
}
