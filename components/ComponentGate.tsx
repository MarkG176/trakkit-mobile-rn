import { ReactNode } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { workspaceService } from '@/services/workspaceService';
import { mergeWithDefaults } from '@/data/mobileComponentsCatalog';

interface ComponentGateProps {
  code: string;
  fallback?: ReactNode;
  redirectTo?: string;
  children: ReactNode;
}

export function ComponentGate({
  code,
  fallback = null,
  redirectTo,
  children,
}: ComponentGateProps) {
  const { isInitialized } = useWorkspace();
  const { isEnabled, isLoaded } = useProjectComponents();

  const workspaceReady = isInitialized || workspaceService.isInitialized();
  const componentsReady = isLoaded || workspaceService.isInitialized();

  if (!workspaceReady || !componentsReady) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const componentEnabled = componentsReady
    ? isEnabled(code)
    : (mergeWithDefaults(workspaceService.getCurrentActiveComponents())[code] ?? true);

  if (!componentEnabled) {
    if (redirectTo) return <Redirect href={redirectTo as never} />;
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
