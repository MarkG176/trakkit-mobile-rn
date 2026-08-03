import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
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
} from '@/components/ui';
import { colors, spacing } from '@/theme';

type DetailState = {
  title: string;
  subtitle?: string;
  rows: { label: string; value: string }[];
};

export default function ActivityDetailScreen() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const params = useLocalSearchParams<{
    id?: string;
    type?: string;
    activityId?: string;
  }>();
  const id =
    (typeof params.id === 'string' ? params.id : null) ??
    (typeof params.activityId === 'string' ? params.activityId : null);
  const type = typeof params.type === 'string' ? params.type : 'activity';

  const [detail, setDetail] = useState<DetailState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user || !currentWorkspaceId || !id) {
        setDetail(null);
        setLoading(false);
        return;
      }
      setLoading(true);

      if (type === 'sale') {
        const { data } = await supabase
          .from('sale_items')
          .select(
            'id, product_name, quantity, unit_price, total_price, customer_name, customer_phone, created_at',
          )
          .eq('id', id)
          .eq('workspace_id', currentWorkspaceId)
          .maybeSingle();
        if (data) {
          setDetail({
            title: data.product_name ?? 'Sale',
            subtitle: 'Sale',
            rows: [
              { label: 'Quantity', value: String(data.quantity ?? 0) },
              { label: 'Unit price', value: String(data.unit_price ?? 0) },
              { label: 'Total', value: String(data.total_price ?? 0) },
              { label: 'Customer', value: data.customer_name ?? '—' },
              { label: 'Phone', value: data.customer_phone ?? '—' },
              {
                label: 'When',
                value: data.created_at ? new Date(data.created_at).toLocaleString() : '—',
              },
            ],
          });
        } else setDetail(null);
      } else if (type === 'giveaway') {
        const { data } = await supabase
          .from('giveaways')
          .select('id, recipient_name, total_items, notes, created_at, engagement_quality')
          .eq('id', id)
          .eq('workspace_id', currentWorkspaceId)
          .maybeSingle();
        if (data) {
          setDetail({
            title: data.recipient_name ?? 'Giveaway',
            subtitle: 'Giveaway',
            rows: [
              { label: 'Items', value: String(data.total_items ?? 0) },
              { label: 'Quality', value: data.engagement_quality ?? '—' },
              { label: 'Notes', value: data.notes ?? '—' },
              {
                label: 'When',
                value: data.created_at ? new Date(data.created_at).toLocaleString() : '—',
              },
            ],
          });
        } else setDetail(null);
      } else if (type === 'interaction') {
        const { data } = await supabase
          .from('interactions')
          .select('id, interaction_type, customer_name, outcome, created_at, metadata')
          .eq('id', id)
          .eq('workspace_id', currentWorkspaceId)
          .maybeSingle();
        if (data) {
          const meta = (data.metadata ?? {}) as Record<string, unknown>;
          setDetail({
            title: data.customer_name ?? data.interaction_type ?? 'Interaction',
            subtitle: data.interaction_type ?? 'Interaction',
            rows: [
              { label: 'Outcome', value: data.outcome ?? '—' },
              { label: 'Notes', value: typeof meta.notes === 'string' ? meta.notes : '—' },
              {
                label: 'When',
                value: data.created_at ? new Date(data.created_at).toLocaleString() : '—',
              },
            ],
          });
        } else setDetail(null);
      } else {
        const { data } = await supabase
          .from('activity_logs')
          .select('id, action, created_at')
          .eq('id', id)
          .eq('workspace_id', currentWorkspaceId)
          .maybeSingle();
        if (data) {
          setDetail({
            title: (data.action ?? 'Activity').replace(/_/g, ' '),
            subtitle: 'Activity',
            rows: [
              {
                label: 'When',
                value: data.created_at ? new Date(data.created_at).toLocaleString() : '—',
              },
            ],
          });
        } else setDetail(null);
      }

      setLoading(false);
    };
    void load();
  }, [user?.id, currentWorkspaceId, id, type]);

  return (
    <ComponentGate code="CRM-0092" redirectTo="/(agent)/activity">
      <Screen scroll showBack>
        {loading ? (
          <LoadingSpinner label="Loading activity" />
        ) : !detail ? (
          <EmptyMessage>Activity not found.</EmptyMessage>
        ) : (
          <Card>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.md,
              }}
            >
              <AppText style={{ fontWeight: '700', fontSize: 18, flex: 1, flexShrink: 1 }}>
                {detail.title}
              </AppText>
              {detail.subtitle ? <Badge variant="primary">{detail.subtitle}</Badge> : null}
            </View>
            {detail.rows.map((row) => (
              <View key={row.label} style={{ marginBottom: spacing.sm }}>
                <AppText variant="secondary" style={{ fontSize: 12 }}>
                  {row.label}
                </AppText>
                <AppText style={{ fontSize: 16, color: colors.foreground, marginTop: 2 }}>
                  {row.value}
                </AppText>
              </View>
            ))}
          </Card>
        )}
      </Screen>
    </ComponentGate>
  );
}
