// [CRM-0100] More — overflow menu of secondary agent actions
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  BarChart3,
  ClipboardList,
  Gift,
  HelpCircle,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Sparkles,
  User,
  Users,
  Zap,
} from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { useAuth } from '@/providers/AuthProvider';
import { Screen, AppText } from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';

type LinkItem = {
  code: string;
  label: string;
  path?: `/(agent)/${string}`;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  destructive?: boolean;
};

const LINKS: LinkItem[] = [
  { code: 'CRM-0090', label: 'Profile', path: '/(agent)/profile', icon: User },
  { code: 'CRM-0091', label: 'Activity', path: '/(agent)/activity', icon: ClipboardList },
  { code: 'CRM-0093', label: 'Inventory', path: '/(agent)/inventory', icon: Package },
  { code: 'CRM-0098', label: 'Routes', path: '/(agent)/routes', icon: MapPin },
  { code: 'CRM-0010', label: 'Check-in', path: '/(agent)/check-in', icon: LogIn },
  { code: 'CRM-0030', label: 'Engagement', path: '/(agent)/engagement', icon: Zap },
  { code: 'CRM-0094', label: 'Record Sale', path: '/(agent)/record-sale', icon: ShoppingCart },
  { code: 'CRM-0095', label: 'Give Products', path: '/(agent)/give-products', icon: Gift },
  { code: 'CRM-0097', label: 'Surveys', path: '/(agent)/surveys', icon: ClipboardList },
  { code: 'CRM-0096', label: 'Log Interaction', path: '/(agent)/log-interaction', icon: Sparkles },
  { code: 'CRM-0110', label: 'Chat', path: '/(agent)/support-ticket', icon: MessageCircle },
  { code: 'CRM-0099', label: 'Reports', path: '/(agent)/reports', icon: BarChart3 },
  { code: 'CRM-0105', label: 'Interaction History', path: '/(agent)/interaction-history', icon: MessageSquare },
  { code: 'CRM-0106', label: 'Sales Activities', path: '/(agent)/sales-activities', icon: ShoppingCart },
  { code: 'CRM-0107', label: 'Giveaway Activities', path: '/(agent)/giveaway-activities', icon: Gift },
  { code: 'CRM-0108', label: 'Survey Activities', path: '/(agent)/survey-activities', icon: ClipboardList },
  { code: 'CRM-0109', label: 'Help & Support', path: '/(agent)/help-support', icon: HelpCircle },
  { code: 'CRM-0111', label: 'Manage Agents', path: '/(agent)/manage-agents', icon: Users },
  { code: 'CRM-0101', label: 'Settings', path: '/(agent)/settings', icon: Settings },
  { code: 'CRM-0100', label: 'Logout', icon: LogOut, destructive: true },
];

export default function MoreScreen() {
  const router = useRouter();
  const { isEnabled } = useProjectComponents();
  const { signOut } = useAuth();

  const visibleLinks = LINKS.filter((l) => l.destructive || isEnabled(l.code));

  const handlePress = async (link: LinkItem) => {
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
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const color = link.destructive ? colors.destructive : colors.foreground;
          return (
            <Pressable
              key={`${link.code}-${link.label}`}
              onPress={() => handlePress(link)}
              hitSlop={hitSlop}
              style={({ pressed }) => ({
                minHeight: 48,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.sm,
                backgroundColor: pressed ? colors.muted : 'transparent',
              })}
            >
              <Icon size={20} color={color} />
              <AppText
                style={{
                  fontSize: 16,
                  fontWeight: '500',
                  color,
                }}
              >
                {link.label}
              </AppText>
            </Pressable>
          );
        })}
      </Screen>
    </ComponentGate>
  );
}
