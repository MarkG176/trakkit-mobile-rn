import '../global.css';
import '@/tasks/backgroundLocation';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { WorkspaceProvider } from '@/providers/WorkspaceProvider';
import { AgentStatusProvider } from '@/providers/AgentStatusProvider';
import { PermissionRequestProvider } from '@/providers/PermissionRequestProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AppShell } from '@/components/AppShell';
import { asyncStoragePersister, queryClient } from '@/lib/queryClient';
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
        <LoadingSpinner label="Loading session" />
      </View>
    );
  }

  return <>{children}</>;
}

function RootFrame({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        backgroundColor: colors.background,
      }}
    >
      <SyncStatusBar />
      <View style={{ flex: 1, backgroundColor: colors.background }}>{children}</View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppShell>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister, maxAge: 24 * 60 * 60 * 1000 }}
        >
          <AuthProvider>
            <WorkspaceProvider>
              <AgentStatusProvider>
                <PermissionRequestProvider>
                  <BackgroundLocationTracker />
                  <RootFrame>
                    <AuthGate>
                      <Slot />
                    </AuthGate>
                  </RootFrame>
                </PermissionRequestProvider>
              </AgentStatusProvider>
            </WorkspaceProvider>
          </AuthProvider>
        </PersistQueryClientProvider>
      </AppShell>
    </ThemeProvider>
  );
}
