import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useWorkspace } from '@/providers/WorkspaceProvider';

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
      <Text className="text-sm font-medium text-slate-600" numberOfLines={1}>
        {currentName}
      </Text>
    );
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="flex-row items-center rounded-lg bg-slate-100 px-3 py-2"
      >
        <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>
          {currentName}
        </Text>
        <Text className="ml-1 text-slate-500">▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[60%] rounded-t-2xl bg-white p-4">
            <Text className="mb-3 text-lg font-bold text-slate-900">Switch workspace</Text>
            {isLoading && <ActivityIndicator className="mb-2" />}
            <FlatList
              data={userWorkspaces}
              keyExtractor={(item) => item.workspace_id ?? item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`mb-2 rounded-xl border p-4 ${
                    item.workspace_id === currentWorkspaceId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white'
                  }`}
                  onPress={() => handleSelect(item.workspace_id)}
                >
                  <Text className="font-semibold text-slate-900">{item.workspace.name}</Text>
                  <Text className="text-xs capitalize text-slate-500">{item.role}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity className="mt-2 rounded-xl bg-slate-100 p-3" onPress={() => setOpen(false)}>
              <Text className="text-center font-medium text-slate-700">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
