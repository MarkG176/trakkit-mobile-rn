import { useCallback, useEffect, useState } from 'react';
import {
  type PermissionType,
  type PermissionStatus,
  type PermissionStateMap,
  requestPermission,
  requestAllPermissions,
  getAllPermissionStatuses,
  dismissPermissionPrompt,
  clearPermissionDismissal,
  isPermissionDismissed,
} from '@/utils/permissionUtils';

export function usePermissions() {
  const [permissions, setPermissions] = useState<PermissionStateMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const states = await getAllPermissionStatuses();
      setPermissions(states);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const getPermissionStatus = useCallback(
    (type: PermissionType): PermissionStatus | null => permissions?.[type]?.status ?? null,
    [permissions],
  );

  const requestPermissionCallback = useCallback(
    async (type: PermissionType) => {
      const result = await requestPermission(type);
      await loadPermissions();
      return result;
    },
    [loadPermissions],
  );

  const requestAllPermissionsCallback = useCallback(async () => {
    const results = await requestAllPermissions();
    await loadPermissions();
    return results;
  }, [loadPermissions]);

  const dismissPromptCallback = useCallback(async (type: PermissionType, hours?: number) => {
    await dismissPermissionPrompt(type, hours);
  }, []);

  const clearDismissalCallback = useCallback(async (type: PermissionType) => {
    await clearPermissionDismissal(type);
  }, []);

  const isDismissedCallback = useCallback(async (type: PermissionType) => isPermissionDismissed(type), []);

  return {
    permissions,
    loading,
    error,
    getPermissionStatus,
    requestPermission: requestPermissionCallback,
    requestAllPermissions: requestAllPermissionsCallback,
    dismissPermissionPrompt: dismissPromptCallback,
    clearPermissionDismissal: clearDismissalCallback,
    isPermissionDismissed: isDismissedCallback,
    refreshPermissions: loadPermissions,
  };
}
