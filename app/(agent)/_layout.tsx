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

/**
 * Stack wraps tab bar screens so secondary routes (profile, settings, …)
 * push onto history and back returns to the previous screen — not Home.
 *
 * Layout chrome:
 *   [status bar — RootFrame]
 *   [TopBar]
 *   [ContentBetweenChrome — screens / tabs]
 *   [tab bar — only inside (tabs)]
 *   [system home indicator — tab bar padding / stack SafeArea]
 */
export default function AgentLayout() {
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
  if (isSupervisor) return <Redirect href="/(supervisor)" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ComponentGate code="CRM-0050">
        <TopBar />
      </ComponentGate>
      <ContentBetweenChrome>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { flex: 1, backgroundColor: colors.canvas },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="activity" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="surveys" />
          <Stack.Screen name="support-ticket" />
          <Stack.Screen name="record-sale" />
          <Stack.Screen name="give-products" />
          <Stack.Screen name="log-interaction" />
          <Stack.Screen name="help-support" />
          <Stack.Screen name="manage-agents" />
          <Stack.Screen name="interaction-history" />
          <Stack.Screen name="sales-activities" />
          <Stack.Screen name="giveaway-activities" />
          <Stack.Screen name="survey-activities" />
        </Stack>
      </ContentBetweenChrome>
    </View>
  );
}
