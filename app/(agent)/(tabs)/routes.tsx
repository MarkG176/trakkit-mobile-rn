import { useEffect, useState } from 'react';
import { View } from 'react-native';
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
  IconChip,
  Badge,
} from '@/components/ui';
import { colors, spacing } from '@/theme';

interface RouteStop {
  id: string;
  area_name?: string | null;
  status?: string;
}

export default function RoutesScreen() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user || !currentWorkspaceId) return;
      const today = new Date().toISOString().split('T')[0];

      const { data: assignments } = await supabase
        .from('route_assignments')
        .select('id, area_name, status')
        .eq('workspace_id', currentWorkspaceId)
        .eq('agent_id', user.id)
        .eq('date', today);

      setStops(assignments ?? []);
      setLoading(false);
    };
    load();
  }, [user?.id, currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0098" redirectTo="/(agent)">
      <Screen scroll>
        {loading ? (
          <LoadingSpinner label="Loading stores" />
        ) : stops.length === 0 ? (
          <EmptyMessage>No stores assigned for today.</EmptyMessage>
        ) : (
          <>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.md,
              }}
            >
              <IconChip
                name="navigate-outline"
                backgroundColor={colors.primaryLight}
                color={colors.primary}
              />
              <AppText style={{ fontWeight: '600', fontSize: 16, flex: 1, flexShrink: 1 }}>
                Today&apos;s route
              </AppText>
            </View>
            {stops.map((stop, i) => (
              <Card key={stop.id} style={{ marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <AppText style={{ color: colors.primaryForeground, fontWeight: '700' }}>
                      {i + 1}
                    </AppText>
                  </View>
                  <View style={{ flex: 1, flexShrink: 1, minWidth: 0 }}>
                    <AppText style={{ fontWeight: '600', fontSize: 16, flexShrink: 1 }}>
                      {stop.area_name ?? 'Stop'}
                    </AppText>
                    <AppText
                      variant="secondary"
                      style={{ marginTop: 2, textTransform: 'capitalize', fontSize: 13 }}
                    >
                      {(stop.status ?? 'pending').replace(/_/g, ' ')}
                    </AppText>
                  </View>
                  <Badge
                    variant={
                      stop.status === 'completed'
                        ? 'success'
                        : stop.status === 'in_progress'
                          ? 'primary'
                          : 'secondary'
                    }
                  >
                    {(stop.status ?? 'pending').replace(/_/g, ' ')}
                  </Badge>
                </View>
              </Card>
            ))}
            <Card style={{ marginTop: spacing.sm, backgroundColor: colors.muted }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <IconChip
                  name="git-branch-outline"
                  backgroundColor={colors.primary}
                  color={colors.primaryForeground}
                />
                <View style={{ flex: 1, flexShrink: 1 }}>
                  <AppText style={{ fontWeight: '600', color: colors.primary }}>
                    Daily Route
                  </AppText>
                  <AppText variant="secondary" style={{ fontSize: 13, marginTop: 2 }}>
                    {stops.length} store{stops.length === 1 ? '' : 's'} assigned for today&apos;s
                    shift.
                  </AppText>
                </View>
              </View>
            </Card>
          </>
        )}
      </Screen>
    </ComponentGate>
  );
}
