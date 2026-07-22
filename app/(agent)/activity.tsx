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

type ActivityItem = { id: string; action: string; created_at: string };
type FilterKey = 'all' | 'check' | 'sale' | 'giveaway';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

function actionMeta(action: string): {
  label: string;
  icon: 'cart-outline' | 'location-outline' | 'gift-outline' | 'pulse-outline';
  tone: 'primary' | 'secondary' | 'success';
} {
  const a = action.toLowerCase();
  if (a.includes('sale')) return { label: 'SALE', icon: 'cart-outline', tone: 'primary' };
  if (a.includes('check') || a.includes('attend'))
    return { label: 'CHECK-IN', icon: 'location-outline', tone: 'secondary' };
  if (a.includes('give')) return { label: 'GIVEAWAY', icon: 'gift-outline', tone: 'success' };
  return { label: 'ACTIVITY', icon: 'pulse-outline', tone: 'secondary' };
}

export default function ActivityScreen() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [items, setItems] = useState<ActivityItem[]>([]);
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
        .from('activity_logs')
        .select('id, action, created_at')
        .eq('user_id', user.id)
        .eq('workspace_id', currentWorkspaceId)
        .order('created_at', { ascending: false })
        .limit(50);

      setItems(data ?? []);
      setLoading(false);
    };
    load();
  }, [user?.id, currentWorkspaceId]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => {
      const a = item.action.toLowerCase();
      if (filter === 'sale') return a.includes('sale');
      if (filter === 'check') return a.includes('check') || a.includes('attend');
      if (filter === 'giveaway') return a.includes('give');
      return true;
    });
  }, [items, filter]);

  const chips: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'check', label: 'Check-ins' },
    { key: 'sale', label: 'Sales' },
    { key: 'giveaway', label: 'Giveaways' },
  ];

  return (
    <ComponentGate code="CRM-0091">
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
          <LoadingSpinner label="Loading activity" />
        ) : filtered.length === 0 ? (
          <EmptyMessage>No activity yet.</EmptyMessage>
        ) : (
          filtered.map((item) => {
            const meta = actionMeta(item.action);
            return (
              <Card key={item.id} style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
                  <IconChip
                    name={meta.icon}
                    backgroundColor={colors.muted}
                    color={colors.primary}
                  />
                  <View style={{ flex: 1, flexShrink: 1, minWidth: 0 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: spacing.sm,
                        marginBottom: spacing.xs,
                      }}
                    >
                      <Badge variant={meta.tone}>{meta.label}</Badge>
                      <AppText variant="secondary" style={{ fontSize: 12 }}>
                        {relativeTime(item.created_at)}
                      </AppText>
                    </View>
                    <AppText style={{ fontWeight: '600', fontSize: 16, flexShrink: 1 }}>
                      {item.action.replace(/_/g, ' ')}
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
