import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { tabBarIcon, getTabScreenOptions } from '@/components/navigation/TabIcon';

export default function SupervisorTabsLayout() {
  const insets = useSafeAreaInsets();
  const { isEnabled, isLoaded } = useProjectComponents();

  const show = (code: string) => !isLoaded || isEnabled(code);

  return (
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
    </Tabs>
  );
}
