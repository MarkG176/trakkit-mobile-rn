/**
 * StockReportDialog — morning qualitative stock levels + evening sold-quantity report.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppText, Button, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme';
import { ReportDialogShell } from './ReportDialogShell';
import { StockProductRow } from './StockLevelSelect';
import {
  fetchTodaySalesByProduct,
  reportAlert,
  submitStockRows,
  todayWorkDate,
  useReportSkus,
  type ReportSku,
  type StockLevelValue,
} from './shared';

export type StockReportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType: 'morning' | 'stock' | 'evening';
  title?: string;
  subtitle?: string;
  requireAll?: boolean;
  onComplete?: (levels: Record<string, StockLevelValue>) => void;
};

function EveningSoldRow({
  name,
  value,
  onChangeText,
}: {
  name: string;
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        backgroundColor: colors.card,
        padding: spacing.md,
        marginBottom: spacing.sm,
      }}
    >
      <AppText
        style={{
          fontWeight: '500',
          fontSize: 16,
          color: colors.foreground,
          marginBottom: spacing.sm,
          flexShrink: 1,
        }}
      >
        {name}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <AppText style={{ fontSize: 16, color: colors.secondaryForeground }}>Number sold:</AppText>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.secondaryForeground}
          style={{
            width: 96,
            minHeight: 48,
            textAlign: 'center',
            fontSize: 16,
            color: colors.foreground,
            backgroundColor: colors.muted,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
          }}
        />
      </View>
    </View>
  );
}

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
  const [soldBySku, setSoldBySku] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEvening = reportType === 'evening';
  const workDate = todayWorkDate();

  const resolvedTitle =
    title ??
    (reportType === 'morning'
      ? 'Morning Stock Report'
      : reportType === 'evening'
        ? 'Evening Stock Report'
        : 'Stock Report');
  const resolvedSubtitle =
    subtitle ??
    (reportType === 'morning'
      ? 'Report the current stock level for each product in your inventory.'
      : reportType === 'evening'
        ? 'Review and correct the number sold for each product today.'
        : 'Submit the stock level for each product in your inventory.');

  useEffect(() => {
    if (!open || !isEvening || !user) return;

    let cancelled = false;
    setPrefillLoading(true);

    fetchTodaySalesByProduct(user.id, workDate)
      .then((totals) => {
        if (cancelled) return;
        const next: Record<string, string> = {};
        for (const sku of skus) {
          const qty = totals[sku.productVariantId];
          if (qty != null && qty > 0) {
            next[sku.productVariantId] = String(qty);
          }
        }
        setSoldBySku(next);
      })
      .finally(() => {
        if (!cancelled) setPrefillLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, isEvening, user, workDate, skus]);

  useEffect(() => {
    if (!open) {
      setLevelBySku({});
      setSoldBySku({});
      setExpandedId(null);
      return;
    }

    if (isEvening || skus.length === 0) return;

    setLevelBySku((prev) => {
      const next: Record<string, StockLevelValue | ''> = { ...prev };
      let changed = false;
      for (const sku of skus) {
        if (!next[sku.productVariantId]) {
          next[sku.productVariantId] = 'available';
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [open, isEvening, skus]);

  const handleLevelChange = useCallback((productVariantId: string, value: StockLevelValue) => {
    setLevelBySku((prev) => ({ ...prev, [productVariantId]: value }));
  }, []);

  const handleExpandedChange = useCallback((productVariantId: string | null) => {
    setExpandedId(productVariantId);
  }, []);

  const allReported =
    skus.length > 0 && skus.every((sku) => Boolean(levelBySku[sku.productVariantId]));

  const hasEveningValues = skus.some((sku) => {
    const trimmed = (soldBySku[sku.productVariantId] ?? '').trim();
    return trimmed !== '' && Number.isFinite(Number.parseInt(trimmed, 10));
  });

  const canSubmit = isEvening
    ? hasEveningValues
    : requireAll
      ? allReported
      : skus.some((sku) => Boolean(levelBySku[sku.productVariantId]));

  const submit = async () => {
    if (!user) return;

    if (isEvening) {
      const rows = skus
        .map((sku) => {
          const raw = (soldBySku[sku.productVariantId] ?? '').trim();
          if (!raw) return null;
          const quantitySold = Number.parseInt(raw, 10);
          if (!Number.isFinite(quantitySold)) return null;
          return {
            agent_id: user.id,
            product_variant_id: sku.productVariantId,
            report_type: 'evening',
            work_date: workDate,
            quantity_sold: quantitySold,
            reported_at: new Date().toISOString(),
          };
        })
        .filter(Boolean) as Record<string, unknown>[];

      if (!rows.length) {
        Alert.alert('Missing counts', 'Enter the number sold for at least one product.');
        return;
      }

      setLoading(true);
      try {
        const { synced } = await submitStockRows(rows);
        reportAlert(synced);
        setSoldBySku({});
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
      return;
    }

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
          work_date: workDate,
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
      onOpenChange(false);
      onComplete?.(levels);
    } finally {
      setLoading(false);
    }
  };

  const maxListH = Math.min(windowH * 0.9, 640) - 220;

  const renderMorningItem = useCallback(
    ({ item }: { item: ReportSku }) => (
      <StockProductRow
        productVariantId={item.productVariantId}
        name={item.name}
        value={levelBySku[item.productVariantId] ?? ''}
        expanded={expandedId === item.productVariantId}
        onExpandedChange={handleExpandedChange}
        onChange={handleLevelChange}
      />
    ),
    [levelBySku, expandedId, handleExpandedChange, handleLevelChange],
  );

  const renderEveningItem = useCallback(
    ({ item }: { item: ReportSku }) => (
      <EveningSoldRow
        name={item.name}
        value={soldBySku[item.productVariantId] ?? ''}
        onChangeText={(text) =>
          setSoldBySku((prev) => ({ ...prev, [item.productVariantId]: text }))
        }
      />
    ),
    [soldBySku],
  );

  const listLoading = skusLoading || (isEvening && prefillLoading);

  return (
    <ReportDialogShell
      open={open}
      onOpenChange={(next) => {
        if (!next) setExpandedId(null);
        onOpenChange(next);
      }}
      title={resolvedTitle}
      subtitle={resolvedSubtitle}
      icon={isEvening ? 'moon-outline' : 'cube-outline'}
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
      {listLoading ? (
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
        <FlatList
          data={skus}
          keyExtractor={(item) => item.productVariantId}
          renderItem={isEvening ? renderEveningItem : renderMorningItem}
          style={{ maxHeight: maxListH }}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </ReportDialogShell>
  );
}
