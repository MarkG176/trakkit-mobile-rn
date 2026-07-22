import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import {
  Screen,
  LoadingSpinner,
  EmptyMessage,
  AppText,
  Card,
  Badge,
  IconChip,
} from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

type HistoryItem = {
  id: string;
  interaction_type: string | null;
  created_at: string | null;
};

type FilterKey = 'all' | 'sale' | 'survey' | 'giveaway';

function typeMeta(type: string | null): {
  label: string;
  icon: IoniconName;
  tone: 'primary' | 'secondary' | 'success';
} {
  const t = (type ?? '').toLowerCase();
  if (t.includes('sale')) return { label: 'SALE', icon: 'cart-outline', tone: 'primary' };
  if (t.includes('survey')) return { label: 'SURVEY', icon: 'bar-chart-outline', tone: 'secondary' };
  if (t.includes('give')) return { label: 'GIVEAWAY', icon: 'gift-outline', tone: 'success' };
  return { label: 'GENERAL', icon: 'chatbubble-outline', tone: 'secondary' };
}

export default function InteractionHistoryScreen() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>('all');

  useEffect(() => {
    const load = async () => {
      if (!user || !currentWorkspaceId) {
        setItems([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from('interactions')
        .select('id, interaction_type, created_at')
        .eq('agent_id', user.id)
        .eq('workspace_id', currentWorkspaceId)
        .order('created_at', { ascending: false })
        .limit(30);
      setItems(data ?? []);
      setLoading(false);
    };
    load();
  }, [user?.id, currentWorkspaceId]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => {
      const t = (item.interaction_type ?? '').toLowerCase();
      if (filter === 'sale') return t.includes('sale');
      if (filter === 'survey') return t.includes('survey');
      if (filter === 'giveaway') return t.includes('give');
      return true;
    });
  }, [items, filter]);

  const chips: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All Activity' },
    { key: 'sale', label: 'Sales' },
    { key: 'survey', label: 'Surveys' },
    { key: 'giveaway', label: 'Giveaways' },
  ];

  return (
    <ComponentGate code="CRM-0105">
      <Screen scroll showBack>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
            marginBottom: spacing.md,
          }}
        >
          {chips.map((chip) => {
            const active = filter === chip.key;
            return (
              <Pressable
                key={chip.key}
                onPress={() => setFilter(chip.key)}
                hitSlop={hitSlop}
                style={{
                  minHeight: 36,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.full,
                  backgroundColor: active ? colors.primary : colors.muted,
                  justifyContent: 'center',
                }}
              >
                <AppText
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: active ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  {chip.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <LoadingSpinner label="Loading history" />
        ) : filtered.length === 0 ? (
          <EmptyMessage>No interactions yet.</EmptyMessage>
        ) : (
          filtered.map((item) => {
            const meta = typeMeta(item.interaction_type);
            return (
              <Card key={item.id} style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <IconChip
                    name={meta.icon}
                    backgroundColor={colors.muted}
                    color={colors.primary}
                  />
                  <View style={{ flex: 1, flexShrink: 1, minWidth: 0 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        gap: spacing.sm,
                        marginBottom: spacing.xs,
                      }}
                    >
                      <Badge variant={meta.tone}>{meta.label}</Badge>
                      <AppText variant="secondary" style={{ fontSize: 12 }}>
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString()
                          : ''}
                      </AppText>
                    </View>
                    <AppText style={{ fontWeight: '600', fontSize: 16, flexShrink: 1 }}>
                      {(item.interaction_type ?? 'interaction').replace(/_/g, ' ')}
                    </AppText>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </Screen>
    </ComponentGate>
  );
}
