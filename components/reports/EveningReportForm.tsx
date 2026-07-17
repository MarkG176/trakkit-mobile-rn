import { useState } from 'react';
import { View } from 'react-native';
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

export function EveningReportForm() {
  const { user } = useAuth();
  const { skus, loading: skusLoading } = useReportSkus();
  const [notes, setNotes] = useState('');
  const [soldBySku, setSoldBySku] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) return;
    const rows = skus
      .map((sku) => {
        const quantitySold = parseCount(soldBySku[sku.productVariantId] ?? '');
        if (quantitySold == null && !notes.trim()) return null;
        return {
          agent_id: user.id,
          product_variant_id: sku.productVariantId,
          report_type: 'evening',
          work_date: todayWorkDate(),
          quantity_sold: quantitySold,
          notes: notes.trim() || null,
          reported_at: new Date().toISOString(),
        };
      })
      .filter(Boolean) as Record<string, unknown>[];

    if (!rows.length) {
      if (!notes.trim()) return;
      return;
    }

    setLoading(true);
    try {
      const { synced } = await submitStockRows(rows);
      reportAlert(synced);
      setNotes('');
      setSoldBySku({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
      <AppText variant="h3" style={{ fontWeight: '700', marginBottom: spacing.sm }}>
        Evening Report
      </AppText>
      <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
        End-of-day summary with units sold per product.
      </AppText>

      {skusLoading ? null : skus.length === 0 ? (
        <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
          No assigned products. Add notes below.
        </AppText>
      ) : (
        skus.map((sku) => (
          <View key={sku.productVariantId}>
            <SkuCountField
              label={`${sku.name} — qty sold`}
              value={soldBySku[sku.productVariantId] ?? ''}
              onChangeText={(value) =>
                setSoldBySku((prev) => ({ ...prev, [sku.productVariantId]: value }))
              }
            />
          </View>
        ))
      )}

      <FormField label="Notes / summary" value={notes} onChangeText={setNotes} multiline />
      <Button
        onPress={submit}
        loading={loading}
        disabled={skus.length === 0 || (!notes.trim() && !Object.values(soldBySku).some((v) => v.trim()))}
      >
        Submit evening report
      </Button>
    </Card>
  );
}
