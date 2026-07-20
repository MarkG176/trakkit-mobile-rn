import { View } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { useUserRole } from '@/hooks/useUserRole';
import { tabBarIcon, getTabScreenOptions } from '@/components/navigation/TabIcon';
import { TopBar } from '@/components/dashboard/TopBar';
import { ComponentGate } from '@/components/ComponentGate';
import { LoadingSpinner } from '@/components/ui';
import { colors } from '@/theme';

// [CRM-0002] Supervisor Bottom Nav — Dashboard, Users, Map, Inbox, Stats

export default function SupervisorLayout() {
  const insets = useSafeAreaInsets();
  const { isEnabled, isLoaded } = useProjectComponents();
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
        <LoadingSpinner label="Loading TraKKiT" />
      </View>
    );
  }
  if (!isSupervisor) return <Redirect href="/(agent)" />;

  const show = (code: string) => !isLoaded || isEnabled(code);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ComponentGate code="CRM-0050">
        <TopBar />
      </ComponentGate>
      <View style={{ flex: 1 }}>
        <Tabs screenOptions={getTabScreenOptions(insets.bottom)}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              href: show('CRM-0118') ? undefined : null,
              tabBarIcon: tabBarIcon('home'),
            }}
          />
          <Tabs.Screen
            name="users"
            options={{
              title: 'Users',
              href: show('CRM-0123') ? undefined : null,
              tabBarIcon: tabBarIcon('people'),
            }}
          />
          <Tabs.Screen
            name="map"
            options={{
              title: 'Map',
              href: show('CRM-0125') ? undefined : null,
              tabBarIcon: tabBarIcon('location'),
            }}
          />
          <Tabs.Screen
            name="inbox"
            options={{
              title: 'Inbox',
              href: show('CRM-0126') ? undefined : null,
              tabBarIcon: tabBarIcon('mail'),
            }}
          />
          <Tabs.Screen
            name="stats"
            options={{
              title: 'Stats',
              href: show('CRM-0124') ? undefined : null,
              tabBarIcon: tabBarIcon('bar-chart'),
            }}
          />
          <Tabs.Screen name="sales" options={{ href: null }} />
          <Tabs.Screen name="gallery" options={{ href: null }} />
          <Tabs.Screen name="rankings" options={{ href: null }} />
          <Tabs.Screen name="feedback" options={{ href: null }} />
          <Tabs.Screen name="giveaways" options={{ href: null }} />
        </Tabs>
      </View>
    </View>
  );
}
