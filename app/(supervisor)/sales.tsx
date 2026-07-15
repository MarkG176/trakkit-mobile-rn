import { useEffect, useState } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { formatCurrencySimple } from '@/utils/currency';
import { workspaceService } from '@/services/workspaceService';
import { Screen, PageHeader, LoadingSpinner, ListItemCard, AppText } from '@/components/ui';
import { colors } from '@/theme';

export default function SalesScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [sales, setSales] = useState<{ id: string; product_name: string | null; total_price: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const currency = workspaceService.getProjectCurrencyCode();

  useEffect(() => {
    const load = async () => {
      if (!currentWorkspaceId) return;
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
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0121">
      <Screen scroll>
        <PageHeader title="Sales" />
        {loading ? (
          <LoadingSpinner />
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
