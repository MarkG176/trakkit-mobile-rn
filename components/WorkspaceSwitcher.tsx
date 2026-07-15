import { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { AppText, Button, Card } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export function WorkspaceSwitcher() {
  const { userWorkspaces, currentWorkspaceId, switchWorkspace, isLoading } = useWorkspace();
  const [open, setOpen] = useState(false);

  const currentName =
    userWorkspaces.find((w) => w.workspace_id === currentWorkspaceId)?.workspace.name ??
    'Select workspace';

  const handleSelect = async (workspaceId: string | null) => {
    if (!workspaceId) return;
    await switchWorkspace(workspaceId);
    setOpen(false);
  };

  if (userWorkspaces.length <= 1) {
    return (
      <AppText variant="secondary" style={{ fontWeight: '500', maxWidth: 160 }} numberOfLines={1}>
        {currentName}
      </AppText>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: radius.lg,
          backgroundColor: colors.muted,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }}
      >
        <AppText style={{ fontWeight: '500', maxWidth: 120 }} numberOfLines={1}>
          {currentName}
        </AppText>
        <Ionicons name="chevron-down" size={16} color={colors.secondaryForeground} style={{ marginLeft: 4 }} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View
            style={{
              maxHeight: '60%',
              borderTopLeftRadius: radius.lg * 2,
              borderTopRightRadius: radius.lg * 2,
              backgroundColor: colors.card,
              padding: spacing.lg,
            }}
          >
            <AppText variant="h3" style={{ marginBottom: spacing.md }}>
              Switch workspace
            </AppText>
            {isLoading && <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.sm }} />}
            <FlatList
              data={userWorkspaces}
              keyExtractor={(item) => item.workspace_id ?? item.id}
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
                    <AppText style={{ fontWeight: '500' }}>{item.workspace.name}</AppText>
                    <AppText variant="secondary" style={{ textTransform: 'capitalize' }}>{item.role}</AppText>
                  </TouchableOpacity>
                );
              }}
            />
            <Button variant="secondary" onPress={() => setOpen(false)} style={{ marginTop: spacing.sm }}>
              Cancel
            </Button>
          </View>
        </View>
      </Modal>
    </>
  );
}
