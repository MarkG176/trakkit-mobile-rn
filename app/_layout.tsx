import '../global.css';
import '@/tasks/backgroundLocation';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { WorkspaceProvider } from '@/providers/WorkspaceProvider';
import { AgentStatusProvider } from '@/providers/AgentStatusProvider';
import { queryClient } from '@/lib/queryClient';
import { SyncStatusBar } from '@/components/SyncStatusBar';
import { BackgroundLocationTracker } from '@/components/BackgroundLocationTracker';
import { useUserRole } from '@/hooks/useUserRole';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isSupervisor, loading: roleLoading } = useUserRole();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || roleLoading) return;

    const inAuth = segments[0] === '(auth)';

    if (!user && !inAuth) {
      router.replace('/(auth)/login');
      return;
    }

    if (user && inAuth) {
      router.replace(isSupervisor ? '/(supervisor)' : '/(agent)');
    }
  }, [user, loading, roleLoading, isSupervisor, segments]);

  if (loading || (user && roleLoading)) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <AgentStatusProvider>
            <SyncStatusBar />
            <BackgroundLocationTracker />
            <AuthGate>
              <Slot />
            </AuthGate>
          </AgentStatusProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
