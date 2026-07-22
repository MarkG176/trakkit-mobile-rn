import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { tabBarIcon, getTabScreenOptions } from '@/components/navigation/TabIcon';

export default function AgentTabsLayout() {
  const insets = useSafeAreaInsets();
  const { isEnabled, isLoaded } = useProjectComponents();

  const show = (code: string, always = false) => always || !isLoaded || isEnabled(code);

  return (
    <Tabs screenOptions={getTabScreenOptions(insets.bottom)}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          href: show('CRM-0089', true) ? undefined : null,
          tabBarIcon: tabBarIcon('home'),
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
    </Tabs>
  );
}
