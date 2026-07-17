/**
 * Opening Stock Count — mirrors trakkit-mobile InstoreMorningStockCountDialog.
 * Filters out unavailable / not_sold from prior availability levels.
 */
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, TextInput, useWindowDimensions, View } from 'react-native';
import { AppText, Button, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme';
import { ReportDialogShell } from './ReportDialogShell';
import {
  parseCount,
  reportAlert,
  stockReport,
  stockReportBorder,
  submitStockRows,
  todayWorkDate,
  useReportSkus,
  type StockLevelValue,
} from './shared';

export type OpeningStockCountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockLevels: Record<string, StockLevelValue>;
  onComplete?: () => void;
};

export function OpeningStockCountDialog({
  open,
  onOpenChange,
  stockLevels,
  onComplete,
}: OpeningStockCountDialogProps) {
  const { user } = useAuth();
  const { height: windowH } = useWindowDimensions();
  const { skus, loading: skusLoading } = useReportSkus();
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const eligible = useMemo(
    () =>
      skus.filter((sku) => {
        const level = stockLevels[sku.productVariantId];
        return level !== 'unavailable' && level !== 'not_sold';
      }),
    [skus, stockLevels],
  );

  useEffect(() => {
    if (!open) return;
    setCounts({});
  }, [open]);

  const submit = async () => {
    if (!user) return;

    const rows = eligible
      .map((sku) => {
        const n = parseCount(counts[sku.productVariantId] ?? '');
        if (n == null) return null;
        return {
          agent_id: user.id,
          product_variant_id: sku.productVariantId,
          report_type: 'morning',
          work_date: todayWorkDate(),
          opening_stock: n,
          quantity_sold: 0,
          closing_stock: 0,
          reported_at: new Date().toISOString(),
        };
      })
      .filter(Boolean) as Record<string, unknown>[];

    if (!rows.length) {
      Alert.alert('Missing counts', 'Please enter stock count for at least one product');
      return;
    }

    setLoading(true);
    try {
      const { synced } = await submitStockRows(rows);
      reportAlert(synced);
      setCounts({});
      onOpenChange(false);
      onComplete?.();
    } finally {
      setLoading(false);
    }
  };

  const maxListH = Math.min(windowH * 0.9, 640) - 220;

  return (
    <ReportDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Morning Stock Count"
      subtitle="Enter the opening stock quantity for each product"
      icon="clipboard-outline"
      footer={
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          <Button
            variant="outline"
            onPress={() => onOpenChange(false)}
            disabled={loading}
            style={{ flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            onPress={submit}
            loading={loading}
            disabled={eligible.length === 0}
            style={{ flex: 1 }}
          >
            Submit Count
          </Button>
        </View>
      }
    >
      {skusLoading ? (
        <LoadingSpinner label="Loading products" />
      ) : eligible.length === 0 ? (
        <AppText
          style={{
            textAlign: 'center',
            fontSize: 14,
            color: colors.secondaryForeground,
            marginBottom: spacing.md,
          }}
        >
          No products assigned
        </AppText>
      ) : (
        <ScrollView
          style={{ maxHeight: maxListH }}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {eligible.map((sku) => (
            <View
              key={sku.productVariantId}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                backgroundColor: stockReport.panel,
                borderRadius: radius.md,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <AppText
                style={{
                  flex: 1,
                  fontWeight: '500',
                  fontSize: 14,
                  color: stockReport.heading,
                  flexShrink: 1,
                }}
              >
                {sku.name}
              </AppText>
              <TextInput
                value={counts[sku.productVariantId] ?? ''}
                onChangeText={(text) =>
                  setCounts((prev) => ({ ...prev, [sku.productVariantId]: text }))
                }
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.secondaryForeground}
                style={{
                  width: 96,
                  height: 40,
                  textAlign: 'center',
                  fontSize: 14,
                  color: stockReport.heading,
                  backgroundColor: colors.card,
                  ...stockReportBorder,
                  borderRadius: radius.md,
                  paddingHorizontal: 8,
                }}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </ReportDialogShell>
  );
}
