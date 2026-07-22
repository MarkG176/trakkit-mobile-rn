import '../global.css';
import '@/tasks/backgroundLocation';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { WorkspaceProvider } from '@/providers/WorkspaceProvider';
import { AgentStatusProvider } from '@/providers/AgentStatusProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AppShell } from '@/components/AppShell';
import { queryClient } from '@/lib/queryClient';
import { SyncStatusBar } from '@/components/SyncStatusBar';
import { BackgroundLocationTracker } from '@/components/BackgroundLocationTracker';
import { LoadingSpinner } from '@/components/ui';
import { useUserRole } from '@/hooks/useUserRole';
import { colors } from '@/theme';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { isSupervisor, loading: roleLoading } = useUserRole();
  const segments = useSegments();
  const router = useRouter();

  const inAuth = segments[0] === '(auth)';
  const atRoot = !segments[0];

  useEffect(() => {
    if (loading || roleLoading) return;

    if (!user && !inAuth) {
      router.replace('/(auth)/login');
      return;
    }

    if (user && (inAuth || atRoot)) {
      router.replace(isSupervisor ? '/(supervisor)' : '/(agent)');
    }
  }, [user, loading, roleLoading, isSupervisor, inAuth, atRoot, router]);

  const pendingRoute =
    loading ||
    roleLoading ||
    (!user && !inAuth) ||
    (user && (inAuth || atRoot));

  if (pendingRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <LoadingSpinner label="Loading session" />
      </View>
    );
  }

  return <>{children}</>;
}

function RootFrame({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <SyncStatusBar />
      <View style={{ flex: 1, minHeight: 0, backgroundColor: colors.background }}>{children}</View>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppShell>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <WorkspaceProvider>
              <AgentStatusProvider>
                <BackgroundLocationTracker />
                <RootFrame>
                  <AuthGate>
                    <Slot />
                  </AuthGate>
                </RootFrame>
              </AgentStatusProvider>
            </WorkspaceProvider>
          </AuthProvider>
        </QueryClientProvider>
      </AppShell>
    </ThemeProvider>
  );
}
