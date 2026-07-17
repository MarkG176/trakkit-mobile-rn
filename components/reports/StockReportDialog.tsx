/**
 * StockReportDialog — morning/stock availability (static cards + select overlay).
 */
import { useCallback, useState } from 'react';
import { Alert, ScrollView, useWindowDimensions } from 'react-native';
import { AppText, Button, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/theme';
import { ReportDialogShell } from './ReportDialogShell';
import { StockProductRow } from './StockLevelSelect';
import {
  reportAlert,
  submitStockRows,
  todayWorkDate,
  useReportSkus,
  type StockLevelValue,
} from './shared';

export type StockReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType: 'morning' | 'stock';
  title?: string;
  subtitle?: string;
  requireAll?: boolean;
  onComplete?: (levels: Record<string, StockLevelValue>) => void;
};

export function StockReportDialog({
  open,
  onOpenChange,
  reportType,
  title,
  subtitle,
  requireAll = reportType === 'morning',
  onComplete,
}: StockReportDialogProps) {
  const { user } = useAuth();
  const { height: windowH } = useWindowDimensions();
  const { skus, loading: skusLoading } = useReportSkus();
  const [levelBySku, setLevelBySku] = useState<Record<string, StockLevelValue | ''>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resolvedTitle =
    title ?? (reportType === 'morning' ? 'Morning Stock Report' : 'Stock Report');
  const resolvedSubtitle =
    subtitle ??
    (reportType === 'morning'
      ? 'Report the current stock level for each product in your inventory.'
      : 'Submit the stock level for each product in your inventory.');

  const handleLevelChange = useCallback((productVariantId: string, value: StockLevelValue) => {
    setLevelBySku((prev) => ({ ...prev, [productVariantId]: value }));
  }, []);

  const handleOpenChange = useCallback((productVariantId: string | null) => {
    setOpenId(productVariantId);
  }, []);

  const allReported =
    skus.length > 0 && skus.every((sku) => Boolean(levelBySku[sku.productVariantId]));

  const canSubmit = requireAll
    ? allReported
    : skus.some((sku) => Boolean(levelBySku[sku.productVariantId]));

  const submit = async () => {
    if (!user) return;

    if (requireAll) {
      const missing = skus.filter((sku) => !levelBySku[sku.productVariantId]);
      if (missing.length > 0) {
        Alert.alert(
          'Incomplete Report',
          `Please report stock level for all ${missing.length} remaining product(s)`,
        );
        return;
      }
    }

    const rows = skus
      .map((sku) => {
        const stockLevel = levelBySku[sku.productVariantId];
        if (!stockLevel) return null;
        return {
          agent_id: user.id,
          product_variant_id: sku.productVariantId,
          report_type: reportType === 'morning' ? 'morning' : 'stock',
          work_date: todayWorkDate(),
          stock_level: stockLevel,
          reported_at: new Date().toISOString(),
        };
      })
      .filter(Boolean) as Record<string, unknown>[];

    if (!rows.length) {
      Alert.alert('Missing selection', 'Select a stock level for at least one product.');
      return;
    }

    setLoading(true);
    try {
      const { synced } = await submitStockRows(rows);
      reportAlert(synced);
      const levels = Object.fromEntries(
        Object.entries(levelBySku).filter(([, v]) => Boolean(v)),
      ) as Record<string, StockLevelValue>;
      setLevelBySku({});
      setOpenId(null);
      onOpenChange(false);
      onComplete?.(levels);
    } finally {
      setLoading(false);
    }
  };

  const maxListH = Math.min(windowH * 0.9, 640) - 220;

  return (
    <ReportDialogShell
      open={open}
      onOpenChange={(next) => {
        if (!next) setOpenId(null);
        onOpenChange(next);
      }}
      title={resolvedTitle}
      subtitle={resolvedSubtitle}
      icon="cube-outline"
      footer={
        <Button
          onPress={submit}
          loading={loading}
          disabled={skus.length === 0 || !canSubmit}
          style={{ marginTop: spacing.md }}
        >
          Submit Report
        </Button>
      }
    >
      {skusLoading ? (
        <LoadingSpinner label="Loading inventory" />
      ) : skus.length === 0 ? (
        <AppText
          style={{
            textAlign: 'center',
            fontSize: 14,
            color: colors.secondaryForeground,
            marginBottom: spacing.md,
          }}
        >
          No products in your inventory to report.
        </AppText>
      ) : (
        <ScrollView
          style={{ maxHeight: maxListH }}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {skus.map((sku) => (
            <StockProductRow
              key={sku.productVariantId}
              productVariantId={sku.productVariantId}
              name={sku.name}
              value={levelBySku[sku.productVariantId] ?? ''}
              open={openId === sku.productVariantId}
              onOpenChange={handleOpenChange}
              onChange={handleLevelChange}
            />
          ))}
        </ScrollView>
      )}
    </ReportDialogShell>
  );
}
