import { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { AppText, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const SHEET_HEADER_HEIGHT = 56;
const SHEET_FOOTER_HEIGHT = 72;

export function WorkspaceSwitcher() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { userWorkspaces, currentWorkspaceId, switchWorkspace, isLoading, isInitialized } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [teamByWorkspace, setTeamByWorkspace] = useState<Record<string, string | null>>({});

  const workspaceName =
    userWorkspaces.find((w) => w.workspace_id === currentWorkspaceId)?.workspace.name ??
    'Select workspace';
  const isLoaded = isInitialized && !isLoading && userWorkspaces.length > 0;

  useEffect(() => {
    const loadTeamNames = async () => {
      if (!user?.id || userWorkspaces.length === 0) {
        setTeamByWorkspace({});
        return;
      }

      const workspaceIds = userWorkspaces
        .map((w) => w.workspace_id)
        .filter((id): id is string => Boolean(id));

      const { data } = await supabase
        .from('team_members')
        .select('workspace_id, teams:team_id(name)')
        .eq('agent_id', user.id)
        .eq('is_active', true)
        .in('workspace_id', workspaceIds);

      const map: Record<string, string | null> = {};
      for (const row of data ?? []) {
        if (row.workspace_id) {
          map[row.workspace_id] = (row.teams as { name?: string | null } | null)?.name ?? null;
        }
      }
      setTeamByWorkspace(map);
    };

    loadTeamNames();
  }, [user?.id, userWorkspaces]);

  const formatRoleTeamLine = (role: string, workspaceId: string | null) => {
    const teamName = workspaceId ? teamByWorkspace[workspaceId] : null;
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
    return teamName ? `${roleLabel} • ${teamName}` : roleLabel;
  };

  const labelStyle = isLoaded
    ? {
        fontSize: 20,
        fontWeight: '700' as const,
        color: colors.primary,
        letterSpacing: 0.25,
      }
    : {
        fontWeight: '500' as const,
        color: colors.secondaryForeground,
      };

  const listMaxHeight =
    Dimensions.get('window').height * 0.7 -
    SHEET_HEADER_HEIGHT -
    SHEET_FOOTER_HEIGHT -
    Math.max(insets.bottom, spacing.md);

  const handleSelect = async (workspaceId: string | null) => {
    if (!workspaceId) return;
    await switchWorkspace(workspaceId);
    setOpen(false);
  };

  if (userWorkspaces.length === 0) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        {isLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        <AppText style={{ ...labelStyle, flexShrink: 1 }} numberOfLines={1}>
          {isLoading ? 'Loading workspaces' : workspaceName}
        </AppText>
      </View>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Switch workspace"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          maxWidth: '100%',
          borderRadius: isLoaded ? 0 : radius.lg,
          backgroundColor: isLoaded ? 'transparent' : colors.muted,
          paddingHorizontal: isLoaded ? 0 : spacing.md,
          paddingVertical: isLoaded ? 0 : spacing.sm,
        }}
      >
        <AppText style={{ ...labelStyle, flexShrink: 1 }} numberOfLines={1}>
          {workspaceName}
        </AppText>
        <Ionicons
          name="chevron-down"
          size={16}
          color={isLoaded ? colors.primary : colors.secondaryForeground}
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={{
              maxHeight: '70%',
              borderTopLeftRadius: radius.lg * 2,
              borderTopRightRadius: radius.lg * 2,
              backgroundColor: colors.card,
              overflow: 'hidden',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
              <AppText variant="h3">Switch workspace</AppText>
            </View>

            {isLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
                <ActivityIndicator color={colors.primary} />
                <AppText variant="secondary" style={{ marginTop: spacing.sm }}>
                  Loading workspaces
                </AppText>
              </View>
            ) : (
              <FlatList
                data={userWorkspaces}
                keyExtractor={(item) => item.workspace_id ?? item.id}
                style={{ maxHeight: Math.max(listMaxHeight, 120) }}
                contentContainerStyle={{
                  paddingHorizontal: spacing.lg,
                  paddingBottom: spacing.sm,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={userWorkspaces.length > 3}
                renderItem={({ item }) => {
                  const selected = item.workspace_id === currentWorkspaceId;
                  return (
                    <TouchableOpacity
                      style={{
                        marginBottom: spacing.sm,
                        borderRadius: radius.lg,
                        borderWidth: 1,
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? colors.accent : colors.card,
                        padding: spacing.lg,
                      }}
                      onPress={() => handleSelect(item.workspace_id)}
                    >
                      <AppText style={{ fontWeight: '600', marginBottom: spacing.xs }}>
                        {item.workspace.name}
                      </AppText>
                      <AppText variant="secondary">
                        {formatRoleTeamLine(item.role, item.workspace_id)}
                      </AppText>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <View
              style={{
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.sm,
                paddingBottom: Math.max(insets.bottom, spacing.md),
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <Button variant="secondary" onPress={() => setOpen(false)}>
                Cancel
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
