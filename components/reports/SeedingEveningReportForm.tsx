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

export function SeedingEveningReportForm() {
  const { user } = useAuth();
  const { skus, loading: skusLoading } = useReportSkus();
  const [seededBySku, setSeededBySku] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) return;

    const rows = skus
      .map((sku) => {
        const seeded = parseCount(seededBySku[sku.productVariantId] ?? '');
        if (seeded == null) return null;
        return {
          agent_id: user.id,
          product_variant_id: sku.productVariantId,
          report_type: 'seeding_evening',
          work_date: todayWorkDate(),
          quantity_sold: seeded,
          notes: notes.trim() || null,
          reported_at: new Date().toISOString(),
        };
      })
      .filter(Boolean) as Record<string, unknown>[];

    if (!rows.length) {
      Alert.alert('Missing counts', 'Enter units seeded for at least one product.');
      return;
    }

    setLoading(true);
    try {
      const { synced } = await submitStockRows(rows);
      reportAlert(synced);
      setSeededBySku({});
      setNotes('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
      <AppText variant="h3" style={{ fontWeight: '700', marginBottom: spacing.sm }}>
        Seeding Evening Report
      </AppText>
      <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
        Evening totals for product-seeding projects.
      </AppText>

      {skusLoading ? null : skus.length === 0 ? (
        <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
          No assigned products for this workspace.
        </AppText>
      ) : (
        skus.map((sku) => (
          <View key={sku.productVariantId}>
            <SkuCountField
              label={`${sku.name} — units seeded`}
              value={seededBySku[sku.productVariantId] ?? ''}
              onChangeText={(value) =>
                setSeededBySku((prev) => ({ ...prev, [sku.productVariantId]: value }))
              }
            />
          </View>
        ))
      )}

      <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />
      <Button onPress={submit} loading={loading} disabled={skus.length === 0}>
        Submit seeding report
      </Button>
    </Card>
  );
}
