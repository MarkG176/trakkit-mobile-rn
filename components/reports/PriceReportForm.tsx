import { useState } from 'react';
import { Alert, View } from 'react-native';
import { FormField } from '@/components/forms/FormField';
import { AppText, Button, Card, ChipSelect } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { workspaceService } from '@/services/workspaceService';
import { spacing } from '@/theme';
import {
  parsePrice,
  reportAlert,
  submitPriceRows,
  todayWorkDate,
  useReportSkus,
} from './shared';

const STOCK_LEVELS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'out', label: 'Out of stock' },
];

type PriceRowState = {
  competitorPrice: string;
  ourPrice: string;
  measurement: string;
  stockLevel: string;
};

const EMPTY_ROW: PriceRowState = {
  competitorPrice: '',
  ourPrice: '',
  measurement: '',
  stockLevel: '',
};

export function PriceReportForm() {
  const { user } = useAuth();
  const { skus, loading: skusLoading } = useReportSkus();
  const [rows, setRows] = useState<Record<string, PriceRowState>>({});
  const [loading, setLoading] = useState(false);
  const currency = workspaceService.getProjectCurrencyCode();

  const updateRow = (id: string, patch: Partial<PriceRowState>) => {
    setRows((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? EMPTY_ROW), ...patch },
    }));
  };

  const submit = async () => {
    if (!user) return;

    const payloads = skus
      .map((sku) => {
        const row = rows[sku.productVariantId] ?? EMPTY_ROW;
        const competitorPrice = parsePrice(row.competitorPrice);
        if (competitorPrice == null) return null;
        return {
          agent_id: user.id,
          product_variant_id: sku.productVariantId,
          work_date: todayWorkDate(),
          price: competitorPrice,
          sku: sku.name,
          measurement: row.measurement.trim() || row.ourPrice.trim() || null,
          stock_level: row.stockLevel || null,
        };
      })
      .filter(Boolean) as Record<string, unknown>[];

    if (!payloads.length) {
      Alert.alert('Missing prices', 'Enter a competitor price for at least one product.');
      return;
    }

    setLoading(true);
    try {
      const { synced } = await submitPriceRows(payloads);
      reportAlert(synced);
      setRows({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
      <AppText variant="h3" style={{ fontWeight: '700', marginBottom: spacing.sm }}>
        Price Report
      </AppText>
      <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
        Capture competitor and shelf prices observed in store.
      </AppText>

      {skusLoading ? null : skus.length === 0 ? (
        <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
          No assigned products for this workspace.
        </AppText>
      ) : (
        skus.map((sku) => {
          const row = rows[sku.productVariantId] ?? EMPTY_ROW;
          return (
            <View key={sku.productVariantId} style={{ marginBottom: spacing.md }}>
              <AppText style={{ fontWeight: '500', marginBottom: spacing.xs }}>{sku.name}</AppText>
              <FormField
                label={`Competitor price (${currency})`}
                value={row.competitorPrice}
                onChangeText={(value) => updateRow(sku.productVariantId, { competitorPrice: value })}
                keyboardType="decimal-pad"
              />
              <FormField
                label={`Our shelf price (${currency}, optional)`}
                value={row.ourPrice}
                onChangeText={(value) => updateRow(sku.productVariantId, { ourPrice: value })}
                keyboardType="decimal-pad"
              />
              <FormField
                label="Pack size / measurement"
                value={row.measurement}
                onChangeText={(value) => updateRow(sku.productVariantId, { measurement: value })}
              />
              <ChipSelect
                label="Shelf stock level"
                options={STOCK_LEVELS}
                value={row.stockLevel}
                onChange={(value) => updateRow(sku.productVariantId, { stockLevel: value })}
              />
            </View>
          );
        })
      )}

      <Button onPress={submit} loading={loading} disabled={skus.length === 0}>
        Submit price report
      </Button>
    </Card>
  );
}
