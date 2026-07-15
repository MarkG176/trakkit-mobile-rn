import { Tabs, Redirect } from 'expo-router';
import {
  Home,
  BarChart3,
  ClipboardList,
  Map,
  Package,
  MessageCircle,
  User,
} from 'lucide-react-native';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { useUserRole } from '@/hooks/useUserRole';
import { tabBarIcon, tabScreenOptions } from '@/components/navigation/TabIcon';

export default function AgentLayout() {
  const { isEnabled, isLoaded } = useProjectComponents();
  const { isSupervisor, loading } = useUserRole();

  if (loading) return null;
  if (isSupervisor) return <Redirect href="/(supervisor)" />;

  const show = (code: string, always = false) =>
    always || !isLoaded || isEnabled(code);

  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabBarIcon(Home) }} />
      <Tabs.Screen
        name="reports"
        options={{ title: 'Reports', href: show('CRM-0099') ? undefined : null, tabBarIcon: tabBarIcon(BarChart3) }}
      />
      <Tabs.Screen
        name="surveys"
        options={{ title: 'Surveys', href: show('CRM-0097') ? undefined : null, tabBarIcon: tabBarIcon(ClipboardList) }}
      />
      <Tabs.Screen
        name="routes"
        options={{ title: 'Routes', href: show('CRM-0098') ? undefined : null, tabBarIcon: tabBarIcon(Map) }}
      />
      <Tabs.Screen
        name="inventory"
        options={{ title: 'Inventory', href: show('CRM-0093') ? undefined : null, tabBarIcon: tabBarIcon(Package) }}
      />
      <Tabs.Screen
        name="support-ticket"
        options={{ title: 'Chat', href: show('CRM-0110', true) ? undefined : null, tabBarIcon: tabBarIcon(MessageCircle) }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', href: show('CRM-0090', true) ? undefined : null, tabBarIcon: tabBarIcon(User) }}
      />
      <Tabs.Screen name="record-sale" options={{ href: null }} />
      <Tabs.Screen name="give-products" options={{ href: null }} />
      <Tabs.Screen name="log-interaction" options={{ href: null }} />
      <Tabs.Screen name="activity" options={{ href: null }} />
      <Tabs.Screen name="more" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="help-support" options={{ href: null }} />
      <Tabs.Screen name="manage-agents" options={{ href: null }} />
      <Tabs.Screen name="interaction-history" options={{ href: null }} />
      <Tabs.Screen name="sales-activities" options={{ href: null }} />
      <Tabs.Screen name="giveaway-activities" options={{ href: null }} />
      <Tabs.Screen name="survey-activities" options={{ href: null }} />
    </Tabs>
  );
}
