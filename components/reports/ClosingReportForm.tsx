import { useEffect, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Card } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { colors, radius, spacing } from '@/theme';
import {
  fetchTodayMorningOpeningStock,
  parseCount,
  reportAlert,
  stockReport,
  stockReportBorder,
  submitStockRows,
  todayWorkDate,
  useReportSkus,
} from './shared';

const INPUT_WIDTH = 56;
const INPUT_HEIGHT = 44;

function ColumnHeader({
  icon,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={16} color={color} />
      <AppText style={{ fontSize: 11, color: colors.secondaryForeground, textAlign: 'center' }}>
        {label}
      </AppText>
    </View>
  );
}

function CountInput({
  value,
  onChangeText,
  accent,
}: {
  value: string;
  onChangeText: (text: string) => void;
  accent: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType="number-pad"
      placeholder="0"
      placeholderTextColor={colors.secondaryForeground}
      style={{
        width: INPUT_WIDTH,
        height: INPUT_HEIGHT,
        textAlign: 'center',
        fontSize: 14,
        color: stockReport.heading,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: accent,
        borderRadius: radius.md,
      }}
    />
  );
}

export function ClosingReportForm() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const { skus, loading: skusLoading } = useReportSkus();
  const [openingBySku, setOpeningBySku] = useState<Record<string, string>>({});
  const [soldBySku, setSoldBySku] = useState<Record<string, string>>({});
  const [closingBySku, setClosingBySku] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const workDate = todayWorkDate();

  useEffect(() => {
    if (!user || !currentWorkspaceId) return;

    fetchTodayMorningOpeningStock(user.id, workDate, currentWorkspaceId).then((prefill) => {
      const next: Record<string, string> = {};
      for (const [id, count] of Object.entries(prefill)) {
        next[id] = String(count);
      }
      setOpeningBySku(next);
    });
  }, [user, currentWorkspaceId, workDate]);

  const hasAnyValue = skus.some((sku) => {
    const id = sku.productVariantId;
    return (
      (openingBySku[id] ?? '').trim() !== '' ||
      (soldBySku[id] ?? '').trim() !== '' ||
      (closingBySku[id] ?? '').trim() !== ''
    );
  });

  const submit = async () => {
    if (!user) return;

    const rows = skus
      .map((sku) => {
        const openingStock = parseCount(openingBySku[sku.productVariantId] ?? '');
        const quantitySold = parseCount(soldBySku[sku.productVariantId] ?? '');
        const closingStock = parseCount(closingBySku[sku.productVariantId] ?? '');
        if (openingStock == null && quantitySold == null && closingStock == null) return null;
        return {
          agent_id: user.id,
          product_variant_id: sku.productVariantId,
          report_type: 'evening',
          work_date: workDate,
          opening_stock: openingStock,
          quantity_sold: quantitySold,
          closing_stock: closingStock,
          reported_at: new Date().toISOString(),
        };
      })
      .filter(Boolean) as Record<string, unknown>[];

    if (!rows.length) {
      Alert.alert('Missing counts', 'Enter at least one value for at least one product.');
      return;
    }

    setLoading(true);
    try {
      const { synced } = await submitStockRows(rows);
      reportAlert(synced);
      setOpeningBySku({});
      setSoldBySku({});
      setClosingBySku({});
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
      <AppText
        variant="h3"
        style={{ fontWeight: '700', color: stockReport.heading, marginBottom: spacing.sm }}
      >
        In-store Closing Report
      </AppText>
      <AppText
        variant="secondary"
        style={{ marginBottom: spacing.md, fontSize: stockReport.labelSize }}
      >
        Enter opening, sales, and closing counts for each product.
      </AppText>

      {skusLoading ? null : skus.length === 0 ? (
        <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
          No assigned products for this workspace.
        </AppText>
      ) : (
        skus.map((sku) => (
          <Card
            key={sku.productVariantId}
            style={{
              marginBottom: spacing.sm,
              padding: spacing.md,
              backgroundColor: stockReport.panel,
            }}
          >
            <AppText
              style={{
                fontWeight: '500',
                fontSize: stockReport.labelSize,
                marginBottom: spacing.md,
                flexShrink: 1,
              }}
            >
              {sku.name}
            </AppText>

            <View style={{ flexDirection: 'row', marginBottom: spacing.sm }}>
              <ColumnHeader icon="sunny-outline" label="Open" color={stockReport.column.open} />
              <ColumnHeader
                icon="cash-outline"
                label="Sales"
                color={stockReport.column.sales}
              />
              <ColumnHeader icon="moon-outline" label="Close" color={stockReport.column.close} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <CountInput
                value={openingBySku[sku.productVariantId] ?? ''}
                onChangeText={(value) =>
                  setOpeningBySku((prev) => ({ ...prev, [sku.productVariantId]: value }))
                }
                accent={stockReport.column.open}
              />
              <CountInput
                value={soldBySku[sku.productVariantId] ?? ''}
                onChangeText={(value) =>
                  setSoldBySku((prev) => ({ ...prev, [sku.productVariantId]: value }))
                }
                accent={stockReport.column.sales}
              />
              <CountInput
                value={closingBySku[sku.productVariantId] ?? ''}
                onChangeText={(value) =>
                  setClosingBySku((prev) => ({ ...prev, [sku.productVariantId]: value }))
                }
                accent={stockReport.column.close}
              />
            </View>
          </Card>
        ))
      )}

      <Button onPress={submit} loading={loading} disabled={skus.length === 0 || !hasAnyValue}>
        Submit closing report
      </Button>
    </Card>
  );
}
