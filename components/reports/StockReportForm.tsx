import { useState } from 'react';
import { Alert, View } from 'react-native';
import { FormField } from '@/components/forms/FormField';
import { AppText, Button, Card, ChipSelect } from '@/components/ui';
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

const STOCK_LEVELS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'out', label: 'Out of stock' },
];

export function StockReportForm() {
  const { user } = useAuth();
  const { skus, loading: skusLoading } = useReportSkus();
  const [countsBySku, setCountsBySku] = useState<Record<string, string>>({});
  const [levelBySku, setLevelBySku] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) return;

    const rows = skus
      .map((sku) => {
        const stockCount = parseCount(countsBySku[sku.productVariantId] ?? '');
        const stockLevel = levelBySku[sku.productVariantId];
        if (stockCount == null && !stockLevel) return null;
        return {
          agent_id: user.id,
          product_variant_id: sku.productVariantId,
          report_type: 'stock',
          work_date: todayWorkDate(),
          closing_stock: stockCount,
          stock_level: stockLevel || null,
          notes: notes.trim() || null,
          reported_at: new Date().toISOString(),
        };
      })
      .filter(Boolean) as Record<string, unknown>[];

    if (!rows.length) {
      Alert.alert('Missing counts', 'Enter stock on hand or a level for at least one product.');
      return;
    }

    setLoading(true);
    try {
      const { synced } = await submitStockRows(rows);
      reportAlert(synced);
      setCountsBySku({});
      setLevelBySku({});
      setNotes('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
      <AppText variant="h3" style={{ fontWeight: '700', marginBottom: spacing.sm }}>
        Stock Report
      </AppText>
      <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
        Submit stock-on-hand counts per SKU.
      </AppText>

      {skusLoading ? null : skus.length === 0 ? (
        <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
          No assigned products for this workspace.
        </AppText>
      ) : (
        skus.map((sku) => (
          <View key={sku.productVariantId} style={{ marginBottom: spacing.md }}>
            <AppText style={{ fontWeight: '500', marginBottom: spacing.xs }}>{sku.name}</AppText>
            <SkuCountField
              label="Stock on hand"
              value={countsBySku[sku.productVariantId] ?? ''}
              onChangeText={(value) =>
                setCountsBySku((prev) => ({ ...prev, [sku.productVariantId]: value }))
              }
            />
            <ChipSelect
              label="Stock level"
              options={STOCK_LEVELS}
              value={levelBySku[sku.productVariantId] ?? ''}
              onChange={(value) =>
                setLevelBySku((prev) => ({ ...prev, [sku.productVariantId]: value }))
              }
            />
          </View>
        ))
      )}

      <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />
      <Button onPress={submit} loading={loading} disabled={skus.length === 0}>
        Submit stock report
      </Button>
    </Card>
  );
}
