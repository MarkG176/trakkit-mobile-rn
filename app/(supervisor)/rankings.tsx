import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { formatCurrencySimple } from '@/utils/currency';
import { workspaceService } from '@/services/workspaceService';
import {
  AppText,
  EmptyMessage,
  Input,
  ListItemCard,
  LoadingSpinner,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { colors, spacing } from '@/theme';

type AgentRanking = {
  agent_id: string;
  agent_name: string;
  total_sales_value: number;
  total_units_sold: number;
  sales_count: number;
};

export default function RankingsScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const currency = workspaceService.getProjectCurrencyCode();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: rankings = [], isLoading } = useQuery({
    queryKey: ['mobile-rankings', currentWorkspaceId],
    queryFn: async (): Promise<AgentRanking[]> => {
      const since = new Date();
      since.setDate(since.getDate() - 90);
      const sinceWorkDate = since.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('daily_sales_tracking')
        .select('agent_id, agent_name, quantity_sold, total_value')
        .eq('workspace_id', currentWorkspaceId!)
        .gte('work_date', sinceWorkDate);
      if (error) throw error;
      if (!data?.length) return [];

      const agentSalesMap = new Map<string, Omit<AgentRanking, 'agent_id'>>();
      data.forEach((sale) => {
        if (!sale.agent_id) return;
        const current = agentSalesMap.get(sale.agent_id) || {
          agent_name: sale.agent_name || 'Unknown',
          total_sales_value: 0,
          total_units_sold: 0,
          sales_count: 0,
        };
        current.total_sales_value += sale.total_value || 0;
        current.total_units_sold += sale.quantity_sold || 0;
        current.sales_count += 1;
        if (sale.agent_name && current.agent_name === 'Unknown') {
          current.agent_name = sale.agent_name;
        }
        agentSalesMap.set(sale.agent_id, current);
      });

      return Array.from(agentSalesMap.entries())
        .map(([agent_id, row]) => ({ agent_id, ...row }))
        .sort((a, b) => b.total_sales_value - a.total_sales_value);
    },
    enabled: !!currentWorkspaceId,
  });

  const filtered = useMemo(
    () =>
      rankings.filter((agent) =>
        agent.agent_name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [rankings, searchQuery],
  );

  return (
    <ComponentGate code="CRM-0122">
      <Screen scroll showBack>
        <SectionHeader title="Sales rankings (90 days)" />
        <Input
          placeholder="Search agents..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {isLoading ? (
          <LoadingSpinner label="Loading rankings" />
        ) : filtered.length === 0 ? (
          <EmptyMessage>No rankings yet.</EmptyMessage>
        ) : (
          filtered.map((r, i) => (
            <ListItemCard
              key={r.agent_id}
              title={r.agent_name}
              subtitle={`${r.total_units_sold} units • ${r.sales_count} sales`}
              trailing={
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText variant="h3" style={{ color: colors.primary }}>
                    #{i + 1}
                  </AppText>
                  <AppText style={{ fontWeight: '600', fontSize: 12, marginTop: 2 }}>
                    {formatCurrencySimple(r.total_sales_value, currency)}
                  </AppText>
                </View>
              }
            />
          ))
        )}
      </Screen>
    </ComponentGate>
  );
}
