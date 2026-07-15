import { ReactNode } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { workspaceService } from '@/services/workspaceService';
import { colors } from '@/theme';

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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const componentEnabled = isEnabled(code);

  if (!componentEnabled) {
    if (redirectTo) return <Redirect href={redirectTo as never} />;
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
