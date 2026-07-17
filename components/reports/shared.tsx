import { useEffect, useState, type ReactNode } from 'react';
import { Alert, View } from 'react-native';
import { FormField } from '@/components/forms/FormField';
import { AppText, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { workspaceService } from '@/services/workspaceService';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { spacing } from '@/theme';

export type ReportSku = {
  productVariantId: string;
  name: string;
  sku: string | null;
};

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

interface SkuCountFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}

export function SkuCountField({ label, value, onChangeText }: SkuCountFieldProps) {
  return (
    <FormField
      label={label}
      value={value}
      onChangeText={onChangeText}
      keyboardType="number-pad"
    />
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
