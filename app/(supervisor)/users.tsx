// [CRM-0123] Supervisor Users — workspace members with names, emails, roles, search
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import {
  AppText,
  Badge,
  Card,
  EmptyMessage,
  Input,
  LoadingSpinner,
  Screen,
} from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { colors, spacing } from '@/theme';

interface Member {
  id: string;
  user_id: string | null;
  role: string;
  name: string | null;
  email: string | null;
  is_active: boolean | null;
}

function roleVariant(role: string): 'primary' | 'secondary' | 'outline' | 'warning' {
  const r = role.toLowerCase();
  if (r === 'admin' || r === 'supervisor') return 'primary';
  if (r === 'agent' || r === 'member') return 'secondary';
  if (r === 'viewer') return 'outline';
  return 'warning';
}

function displayName(m: Member): string {
  return m.name || m.email?.split('@')[0] || 'Unknown';
}

export default function UsersScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [search, setSearch] = useState('');

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['supervisor-users', currentWorkspaceId],
    enabled: Boolean(currentWorkspaceId),
    queryFn: async (): Promise<Member[]> => {
      if (!currentWorkspaceId) return [];

      const { data, error } = await supabase
        .from('user_workspaces')
        .select('id, user_id, role, name, email, is_active')
        .eq('workspace_id', currentWorkspaceId)
        .eq('is_deleted', false)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data as Member[]) || [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        displayName(m).toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q),
    );
  }, [members, search]);

  return (
    <ComponentGate code="CRM-0123">
      <Screen style={styles.screen}>
        <View style={styles.header}>
          <Users size={20} color={colors.primary} />
          <AppText style={styles.headerTitle}>Users</AppText>
          <Badge variant="secondary">{String(filtered.length)}</Badge>
        </View>
        <View style={styles.searchWrap}>
          <Search size={18} color={colors.mutedForeground} style={styles.searchIcon} />
          <Input
            placeholder="Search name, email, role..."
            value={search}
            onChangeText={setSearch}
            containerStyle={styles.searchInput}
            style={styles.searchField}
          />
        </View>

        {isLoading ? (
          <LoadingSpinner label="Loading users" />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<EmptyMessage>No users found.</EmptyMessage>}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.avatar}>
                    <AppText style={styles.avatarText}>
                      {displayName(item).charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                  <View style={styles.flex}>
                    <AppText style={styles.name}>{displayName(item)}</AppText>
                    {item.email ? (
                      <AppText variant="secondary" numberOfLines={1}>
                        {item.email}
                      </AppText>
                    ) : null}
                  </View>
                  <View style={styles.badges}>
                    <Badge variant={roleVariant(item.role)}>{item.role}</Badge>
                    {item.is_active === false ? (
                      <Badge variant="outline">Inactive</Badge>
                    ) : null}
                  </View>
                </View>
              </Card>
            )}
          />
        )}
      </Screen>
    </ComponentGate>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerTitle: { flex: 1, fontWeight: '600', fontSize: 16 },
  searchWrap: { position: 'relative' },
  searchIcon: { position: 'absolute', left: spacing.md, top: 18, zIndex: 1 },
  searchInput: { marginBottom: spacing.sm },
  searchField: { paddingLeft: 40 },
  list: { paddingBottom: spacing.xl, flexGrow: 1 },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '600', color: colors.primary, fontSize: 16 },
  flex: { flex: 1 },
  name: { fontWeight: '500' },
  badges: { gap: spacing.xs, alignItems: 'flex-end' },
});
