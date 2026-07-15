import { View } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { useUserRole } from '@/hooks/useUserRole';
import { tabBarIcon, getTabScreenOptions } from '@/components/navigation/TabIcon';
import { TopBar } from '@/components/dashboard/TopBar';
import { colors } from '@/theme';

export default function AgentLayout() {
  const insets = useSafeAreaInsets();
  const { isEnabled, isLoaded } = useProjectComponents();
  const { isSupervisor, loading } = useUserRole();

  if (loading) return null;
  if (isSupervisor) return <Redirect href="/(supervisor)" />;

  const show = (code: string, always = false) =>
    always || !isLoaded || isEnabled(code);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar />
      <View style={{ flex: 1 }}>
        <Tabs screenOptions={getTabScreenOptions(insets.bottom)}>
          <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabBarIcon('home') }} />
          <Tabs.Screen
            name="reports"
            options={{
              title: 'Reports',
              href: show('CRM-0099') ? undefined : null,
              tabBarIcon: tabBarIcon('clipboard'),
            }}
          />
          <Tabs.Screen
            name="routes"
            options={{
              title: 'Stores',
              href: show('CRM-0098') ? undefined : null,
              tabBarIcon: tabBarIcon('storefront'),
            }}
          />
          <Tabs.Screen
            name="inventory"
            options={{
              title: 'Inventory',
              href: show('CRM-0093') ? undefined : null,
              tabBarIcon: tabBarIcon('cube'),
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
          <Tabs.Screen name="surveys" options={{ href: null }} />
          <Tabs.Screen name="support-ticket" options={{ href: null }} />
          <Tabs.Screen name="profile" options={{ href: null }} />
          <Tabs.Screen name="record-sale" options={{ href: null }} />
          <Tabs.Screen name="give-products" options={{ href: null }} />
          <Tabs.Screen name="log-interaction" options={{ href: null }} />
          <Tabs.Screen name="activity" options={{ href: null }} />
          <Tabs.Screen name="settings" options={{ href: null }} />
          <Tabs.Screen name="help-support" options={{ href: null }} />
          <Tabs.Screen name="manage-agents" options={{ href: null }} />
          <Tabs.Screen name="interaction-history" options={{ href: null }} />
          <Tabs.Screen name="sales-activities" options={{ href: null }} />
          <Tabs.Screen name="giveaway-activities" options={{ href: null }} />
          <Tabs.Screen name="survey-activities" options={{ href: null }} />
        </Tabs>
      </View>
    </View>
  );
}
