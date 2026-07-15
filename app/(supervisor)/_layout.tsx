import { Tabs, Redirect } from 'expo-router';
import { LayoutDashboard, Users, Map, Inbox, BarChart3 } from 'lucide-react-native';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { useUserRole } from '@/hooks/useUserRole';
import { tabBarIcon, tabScreenOptions } from '@/components/navigation/TabIcon';

export default function SupervisorLayout() {
  const { isEnabled, isLoaded } = useProjectComponents();
  const { isSupervisor, loading } = useUserRole();

  if (loading) return null;
  if (!isSupervisor) return <Redirect href="/(agent)" />;

  const show = (code: string) => !isLoaded || isEnabled(code);

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: tabBarIcon(LayoutDashboard) }} />
      <Tabs.Screen name="users" options={{ title: 'Users', href: show('CRM-0123') ? undefined : null, tabBarIcon: tabBarIcon(Users) }} />
      <Tabs.Screen name="map" options={{ title: 'Map', href: show('CRM-0125') ? undefined : null, tabBarIcon: tabBarIcon(Map) }} />
      <Tabs.Screen name="inbox" options={{ title: 'Inbox', href: show('CRM-0126') ? undefined : null, tabBarIcon: tabBarIcon(Inbox) }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats', href: show('CRM-0124') ? undefined : null, tabBarIcon: tabBarIcon(BarChart3) }} />
      <Tabs.Screen name="sales" options={{ href: null }} />
      <Tabs.Screen name="gallery" options={{ href: null }} />
      <Tabs.Screen name="rankings" options={{ href: null }} />
      <Tabs.Screen name="feedback" options={{ href: null }} />
    </Tabs>
  );
}
