import { useMemo, useCallback } from 'react';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { workspaceService } from '@/services/workspaceService';
import { mergeWithDefaults, DEFAULT_MOBILE_COMPONENTS } from '@/data/mobileComponentsCatalog';
import { normalizeComponentFlag } from '@/utils/componentFlags';

export function useProjectComponents() {
  const { userWorkspaces, currentWorkspaceId, isInitialized } = useWorkspace();

  const codes = useMemo(() => {
    const raw =
      userWorkspaces.find((w) => w.workspace_id === currentWorkspaceId)?.active_components ??
      workspaceService.getCurrentActiveComponents();
    return mergeWithDefaults(raw);
  }, [userWorkspaces, currentWorkspaceId]);

  const isEnabled = useCallback(
    (code: string): boolean => {
      const raw = codes[code] ?? DEFAULT_MOBILE_COMPONENTS[code];
      if (raw === undefined) return true;
      return normalizeComponentFlag(raw);
    },
    [codes],
  );

  return {
    codes,
    isEnabled,
    isLoading: !isInitialized,
    isLoaded: isInitialized,
  };
}
