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

// [CRM-0001] Bottom Navigation — agent tab bar (Dashboard, Activity, Reports, Profile, More)

export default function AgentLayout() {
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
  if (isSupervisor) return <Redirect href="/(supervisor)" />;

  const show = (code: string, always = false) => always || !isLoaded || isEnabled(code);

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ComponentGate code="CRM-0050">
        <TopBar />
      </ComponentGate>
      <View style={{ flex: 1 }}>
        <Tabs screenOptions={getTabScreenOptions(insets.bottom)}>
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              href: show('CRM-0089', true) ? undefined : null,
              tabBarIcon: tabBarIcon('home'),
            }}
          />
          <Tabs.Screen
            name="activity"
            options={{
              title: 'Activity',
              href: show('CRM-0091') ? undefined : null,
              tabBarIcon: tabBarIcon('pulse'),
            }}
          />
          <Tabs.Screen
            name="reports"
            options={{
              title: 'Reports',
              href: show('CRM-0099') ? undefined : null,
              tabBarIcon: tabBarIcon('clipboard'),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              href: show('CRM-0090') ? undefined : null,
              tabBarIcon: tabBarIcon('person'),
            }}
          />
          <Tabs.Screen
            name="more"
            options={{
              title: 'More',
              href: show('CRM-0100', true) ? undefined : null,
              tabBarIcon: tabBarIcon('menu'),
            }}
          />
          {/* Hidden stack routes */}
          <Tabs.Screen name="routes" options={{ href: null }} />
          <Tabs.Screen name="inventory" options={{ href: null }} />
          <Tabs.Screen name="surveys" options={{ href: null }} />
          <Tabs.Screen name="support-ticket" options={{ href: null }} />
          <Tabs.Screen name="record-sale" options={{ href: null }} />
          <Tabs.Screen name="give-products" options={{ href: null }} />
          <Tabs.Screen name="log-interaction" options={{ href: null }} />
          <Tabs.Screen name="settings" options={{ href: null }} />
          <Tabs.Screen name="help-support" options={{ href: null }} />
          <Tabs.Screen name="manage-agents" options={{ href: null }} />
          <Tabs.Screen name="interaction-history" options={{ href: null }} />
          <Tabs.Screen name="sales-activities" options={{ href: null }} />
          <Tabs.Screen name="giveaway-activities" options={{ href: null }} />
          <Tabs.Screen name="survey-activities" options={{ href: null }} />
          <Tabs.Screen name="check-in" options={{ href: null }} />
          <Tabs.Screen name="engagement" options={{ href: null }} />
          <Tabs.Screen name="activity-detail" options={{ href: null }} />
        </Tabs>
      </View>
    </View>
  );
}
