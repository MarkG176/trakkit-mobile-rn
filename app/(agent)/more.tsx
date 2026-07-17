import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ComponentGate } from '@/components/ComponentGate';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { useAuth } from '@/providers/AuthProvider';
import { Screen, AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

const LINKS: {
  code: string;
  label: string;
  path?: `/(agent)/${string}`;
  icon: IoniconName;
  destructive?: boolean;
}[] = [
  { code: 'CRM-0090', label: 'Profile', path: '/(agent)/profile', icon: 'person' },
  { code: 'CRM-0097', label: 'Surveys', path: '/(agent)/surveys', icon: 'clipboard' },
  { code: 'CRM-0110', label: 'Chat', path: '/(agent)/support-ticket', icon: 'chatbubble' },
  { code: 'CRM-0099', label: 'Reports', path: '/(agent)/reports', icon: 'bar-chart' },
  { code: 'CRM-0105', label: 'Interaction History', path: '/(agent)/interaction-history', icon: 'chatbox' },
  { code: 'CRM-0106', label: 'Sales Activities', path: '/(agent)/sales-activities', icon: 'cart' },
  { code: 'CRM-0107', label: 'Giveaway Activities', path: '/(agent)/giveaway-activities', icon: 'gift' },
  { code: 'CRM-0108', label: 'Survey Activities', path: '/(agent)/survey-activities', icon: 'clipboard' },
  { code: 'CRM-0109', label: 'Help & Support', path: '/(agent)/help-support', icon: 'help-circle' },
  { code: 'CRM-0111', label: 'Manage Agents', path: '/(agent)/manage-agents', icon: 'people' },
  { code: 'CRM-0101', label: 'Settings', path: '/(agent)/settings', icon: 'settings' },
  { code: 'CRM-0100', label: 'Logout', icon: 'log-out', destructive: true },
];

export default function MoreScreen() {
  const router = useRouter();
  const { isEnabled } = useProjectComponents();
  const { user, signOut } = useAuth();

  const visibleLinks = LINKS.filter(
    (l) => l.destructive || l.code === 'CRM-0090' || l.code === 'CRM-0110' || isEnabled(l.code),
  );

  const handlePress = async (link: (typeof LINKS)[number]) => {
    if (link.destructive) {
      await signOut();
      router.replace('/(auth)/login');
      return;
    }
    if (link.path) router.push(link.path as never);
  };

  return (
    <ComponentGate code="CRM-0100">
      <Screen scroll>
        {visibleLinks.map((link) => (
          <Pressable
            key={link.code}
            onPress={() => handlePress(link)}
            style={({ pressed }) => ({
              height: 56,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              paddingHorizontal: spacing.md,
              borderRadius: 8,
              backgroundColor: pressed ? colors.muted : 'transparent',
            })}
          >
            <Ionicons
              name={link.icon}
              size={20}
              color={link.destructive ? colors.destructive : colors.foreground}
            />
            <AppText
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: link.destructive ? colors.destructive : colors.foreground,
              }}
            >
              {link.label}
            </AppText>
          </Pressable>
        ))}
      </Screen>
    </ComponentGate>
  );
}
