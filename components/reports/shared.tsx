import { useEffect, useState, type ReactNode } from 'react';
import { Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '@/components/forms/FormField';
import { AppText, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { workspaceService } from '@/services/workspaceService';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { colors, radius, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

export type ReportSku = {
  productVariantId: string;
  name: string;
  sku: string | null;
};

export type StockLevelValue = 'available' | 'low_stock' | 'unavailable' | 'not_sold';

/**
 * Stock Report aesthetic (field entry, shadcn-like):
 * teal brand, soft #CCC borders, muted panels, hardcoded status greens/yellows/reds.
 * Values match trakkit-mobile StockReportDialog.
 */
export const stockReport = {
  border: '#CCCCCC',
  primary: '#00A3AD',
  primaryLight: '#E0F4F5',
  /** bg-muted/40-ish tinted panel */
  panel: 'rgba(248, 248, 248, 0.5)',
  heading: '#000000',
  labelSize: 14,
  shadowSm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  /** Closing report column accents: open / sales / close */
  column: {
    open: '#F59E0B',
    sales: '#22C55E',
    close: '#3B82F6',
  },
  /** Tailwind green-600 / yellow-600 / red-600 (match web Lucide colors) */
  status: {
    available: '#16A34A',
    low: '#CA8A04',
    out: '#DC2626',
    notSold: '#6B7280',
  },
} as const;

export const STOCK_LEVEL_OPTIONS: {
  value: StockLevelValue;
  label: string;
  icon: IoniconName;
  color: string;
}[] = [
  { value: 'available', label: 'Available', icon: 'checkmark-circle', color: stockReport.status.available },
  { value: 'low_stock', label: 'Low Stock', icon: 'warning', color: stockReport.status.low },
  { value: 'unavailable', label: 'Out of Stock', icon: 'close-circle', color: stockReport.status.out },
  { value: 'not_sold', label: 'Not Sold', icon: 'cube-outline', color: stockReport.status.notSold },
];

/** Soft #CCC border + 8px radius for stock report selects/cards. */
export const stockReportBorder = {
  borderWidth: 1,
  borderColor: stockReport.border,
  borderRadius: radius.sm,
} as const;

export function ReportSectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: IoniconName;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
        <Ionicons name={icon} size={22} color={stockReport.heading} />
        <AppText
          variant="h3"
          style={{ fontWeight: '700', color: stockReport.heading, flex: 1, flexShrink: 1 }}
        >
          {title}
        </AppText>
      </View>
      <AppText
        variant="secondary"
        style={{ textAlign: 'center', fontSize: stockReport.labelSize }}
      >
        {subtitle}
      </AppText>
    </View>
  );
}

export function StockProductCard({
  name,
  status,
  children,
}: {
  name: string;
  status?: StockLevelValue | '';
  children: ReactNode;
}) {
  const statusOpt = status ? STOCK_LEVEL_OPTIONS.find((o) => o.value === status) : undefined;

  return (
    <View
      style={{
        ...stockReportBorder,
        ...stockReport.shadowSm,
        backgroundColor: colors.card,
        marginBottom: spacing.sm,
        padding: spacing.md,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
          marginBottom: spacing.sm,
        }}
      >
        {statusOpt ? (
          <Ionicons name={statusOpt.icon} size={18} color={statusOpt.color} style={{ marginTop: 2 }} />
        ) : null}
        <AppText
          style={{
            fontWeight: '500',
            fontSize: stockReport.labelSize,
            color: stockReport.heading,
            flex: 1,
            flexShrink: 1,
          }}
        >
          {name}
        </AppText>
      </View>
      {children}
    </View>
  );
}


export function useReportSkus() {
  const { user } = useAuth();
  const [skus, setSkus] = useState<ReportSku[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user) {
        if (!cancelled) {
          setSkus([]);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from('agent_task_inventory')
        .select('product_variant_id, name')
        .eq('agent_id', user.id)
        .not('is_deleted', 'is', true);

      if (cancelled) return;

      const unique = new Map<string, ReportSku>();
      for (const row of data ?? []) {
        if (!row.product_variant_id || unique.has(row.product_variant_id)) continue;
        unique.set(row.product_variant_id, {
          productVariantId: row.product_variant_id,
          name: row.name ?? 'Product',
          sku: null,
        });
      }
      setSkus([...unique.values()]);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { skus, loading };
}

export function todayWorkDate(): string {
  return new Date().toISOString().split('T')[0];
}

export async function submitStockRows(
  rows: Record<string, unknown>[],
): Promise<{ synced: boolean }> {
  let allSynced = true;
  for (const row of rows) {
    const payload = workspaceService.ensureWorkspaceContext(row);
    const { synced } = await writeWithOfflineQueue('daily_stock_reports', payload);
    if (!synced) allSynced = false;
  }
  return { synced: allSynced };
}

export async function submitPriceRows(
  rows: Record<string, unknown>[],
): Promise<{ synced: boolean }> {
  let allSynced = true;
  for (const row of rows) {
    const payload = workspaceService.ensureWorkspaceContext(row);
    const { synced } = await writeWithOfflineQueue('store_price_reports', payload);
    if (!synced) allSynced = false;
  }
  return { synced: allSynced };
}

export function parseCount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

export function parsePrice(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function reportAlert(synced: boolean) {
  Alert.alert(synced ? 'Report submitted' : 'Saved offline');
}

export async function submitNoteRow(
  payload: Record<string, unknown>,
): Promise<{ synced: boolean }> {
  const row = workspaceService.ensureWorkspaceContext(payload);
  const { synced } = await writeWithOfflineQueue('notes', row);
  return { synced };
}

export function formatWorkMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export async function fetchTodaySalesByProduct(
  agentId: string,
  workDate: string,
): Promise<Record<string, number>> {
  const { data } = await supabase
    .from('daily_sales_tracking')
    .select('product_variant_id, quantity_sold')
    .eq('agent_id', agentId)
    .eq('work_date', workDate);

  const totals: Record<string, number> = {};
  for (const row of data ?? []) {
    if (!row.product_variant_id) continue;
    totals[row.product_variant_id] =
      (totals[row.product_variant_id] ?? 0) + (row.quantity_sold ?? 0);
  }
  return totals;
}

export async function fetchTodayMorningOpeningStock(
  agentId: string,
  workDate: string,
): Promise<Record<string, number>> {
  const { data } = await supabase
    .from('daily_stock_reports')
    .select('product_variant_id, opening_stock')
    .eq('agent_id', agentId)
    .eq('work_date', workDate)
    .eq('report_type', 'morning');

  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.product_variant_id && row.opening_stock != null) {
      map[row.product_variant_id] = row.opening_stock;
    }
  }
  return map;
}

export async function fetchTodayMorningStockCounts(
  agentId: string,
  workDate: string,
): Promise<Record<string, number>> {
  return fetchTodayMorningOpeningStock(agentId, workDate);
}

interface SkuCountFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  /** Optional column accent (closing report open/sales/close). */
  accent?: string;
}

export function SkuCountField({ label, value, onChangeText, accent }: SkuCountFieldProps) {
  return (
    <View
      style={
        accent
          ? {
              marginBottom: spacing.xs,
              borderLeftWidth: 3,
              borderLeftColor: accent,
              paddingLeft: spacing.sm,
            }
          : undefined
      }
    >
      <FormField
        label={label}
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
      />
    </View>
  );
}

export function SkuSection({
  title,
  loading,
  emptyLabel,
  children,
}: {
  title: string;
  loading: boolean;
  emptyLabel: string;
  children: ReactNode;
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <AppText style={{ fontWeight: '600', marginBottom: spacing.sm }}>{title}</AppText>
      {loading ? (
        <LoadingSpinner label="Loading products" />
      ) : children ? (
        children
      ) : (
        <AppText variant="secondary">{emptyLabel}</AppText>
      )}
    </View>
  );
}
