import { View } from 'react-native';
import { Stack, Redirect } from 'expo-router';
import { useUserRole } from '@/hooks/useUserRole';
import { TopBar } from '@/components/dashboard/TopBar';
import { ComponentGate } from '@/components/ComponentGate';
import { ContentBetweenChrome } from '@/components/layout/ContentBetweenChrome';
import { LoadingSpinner } from '@/components/ui';
import { colors } from '@/theme';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function SupervisorLayout() {
  const { isSupervisor, loading } = useUserRole();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <LoadingSpinner label="Loading dashboard" />
      </View>
    );
  }
  if (!isSupervisor) return <Redirect href="/(agent)" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ComponentGate code="CRM-0050">
        <TopBar />
      </ComponentGate>
      <ContentBetweenChrome>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { flex: 1, backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="sales" />
          <Stack.Screen name="gallery" />
          <Stack.Screen name="rankings" />
          <Stack.Screen name="feedback" />
        </Stack>
      </ContentBetweenChrome>
    </View>
  );
}
