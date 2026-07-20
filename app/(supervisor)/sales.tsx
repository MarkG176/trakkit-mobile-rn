import { useEffect, useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { formatCurrencySimple } from '@/utils/currency';
import { workspaceService } from '@/services/workspaceService';
import { Screen, LoadingSpinner, ListItemCard, AppText } from '@/components/ui';
import { colors } from '@/theme';

type SaleItem = { id: string; product_name: string | null; total_price: number };

export default function SalesScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const currency = workspaceService.getProjectCurrencyCode();

  useEffect(() => {
    if (!currentWorkspaceId) return;

    const load = async () => {
      const { data } = await supabase
        .from('sale_items')
        .select('id, product_name, total_price')
        .eq('workspace_id', currentWorkspaceId)
        .order('created_at', { ascending: false })
        .limit(30);
      setSales(data ?? []);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`supervisor-sales-${currentWorkspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sale_items',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        (payload) => {
          const row = payload.new as SaleItem;
          setSales((prev) => [row, ...prev.filter((s) => s.id !== row.id)].slice(0, 30));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0121">
      <Screen scroll>
        {loading ? (
          <LoadingSpinner label="Loading sales" />
        ) : (
          sales.map((s) => (
            <ListItemCard
              key={s.id}
              title={s.product_name ?? 'Sale'}
              trailing={
                <AppText style={{ fontWeight: '600', color: colors.primary }}>
                  {formatCurrencySimple(s.total_price ?? 0, currency)}
                </AppText>
              }
            />
          ))
        )}
      </Screen>
    </ComponentGate>
  );
}
