import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { ComponentGate } from '@/components/ComponentGate';
import { AppText, Card, LoadingSpinner } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

function SectionIcon({ name }: { name: IoniconName }) {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: radius.md,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={name} size={18} color={colors.foreground} />
    </View>
  );
}

export function DashboardMessagesCard() {
  const router = useRouter();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { count } = await supabase
      .from('supervisor_messages')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_deleted', false)
      .eq('is_read', false);

    setUnreadCount(count ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const hasNew = unreadCount > 0;

  return (
    <ComponentGate code="CRM-0110">
      <Pressable onPress={() => router.push('/(agent)/support-ticket' as never)}>
        <Card style={{ padding: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <SectionIcon name="chatbubble-outline" />
            <AppText variant="h3" style={{ flex: 1, fontWeight: '700', flexShrink: 1 }}>
              Messages
            </AppText>
          </View>
          {loading ? (
            <LoadingSpinner label="Loading messages" />
          ) : (
            <>
              <AppText style={{ fontWeight: '500', marginBottom: spacing.xs, flexShrink: 1 }}>
                {hasNew ? `${unreadCount} new message${unreadCount === 1 ? '' : 's'}` : 'No new messages'}
              </AppText>
              <AppText variant="secondary" style={{ flexShrink: 1 }}>
                {hasNew ? 'Tap to read your inbox.' : 'Your inbox is up to date.'}
              </AppText>
            </>
          )}
        </Card>
      </Pressable>
    </ComponentGate>
  );
}
