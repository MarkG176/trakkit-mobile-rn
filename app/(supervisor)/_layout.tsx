import { Tabs, Redirect } from 'expo-router';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { useUserRole } from '@/hooks/useUserRole';

export default function SupervisorLayout() {
  const { isEnabled, isLoaded } = useProjectComponents();
  const { isSupervisor, loading } = useUserRole();

  if (loading) return null;
  if (!isSupervisor) return <Redirect href="/(agent)" />;

  const show = (code: string) => !isLoaded || isEnabled(code);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: () => null }} />
      <Tabs.Screen name="users" options={{ title: 'Users', href: show('CRM-0123') ? undefined : null, tabBarIcon: () => null }} />
      <Tabs.Screen name="map" options={{ title: 'Map', href: show('CRM-0125') ? undefined : null, tabBarIcon: () => null }} />
      <Tabs.Screen name="inbox" options={{ title: 'Inbox', href: show('CRM-0126') ? undefined : null, tabBarIcon: () => null }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats', href: show('CRM-0124') ? undefined : null, tabBarIcon: () => null }} />
      <Tabs.Screen name="sales" options={{ href: null }} />
      <Tabs.Screen name="gallery" options={{ href: null }} />
      <Tabs.Screen name="rankings" options={{ href: null }} />
      <Tabs.Screen name="feedback" options={{ href: null }} />
    </Tabs>
  );
}
