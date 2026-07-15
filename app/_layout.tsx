import '../global.css';
import '@/tasks/backgroundLocation';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { WorkspaceProvider } from '@/providers/WorkspaceProvider';
import { AgentStatusProvider } from '@/providers/AgentStatusProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { queryClient } from '@/lib/queryClient';
import { SyncStatusBar } from '@/components/SyncStatusBar';
import { BackgroundLocationTracker } from '@/components/BackgroundLocationTracker';
import { useUserRole } from '@/hooks/useUserRole';
import { colors } from '@/theme';

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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}
