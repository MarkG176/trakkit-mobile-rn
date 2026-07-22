import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ComponentGate } from '@/components/ComponentGate';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { useAuth } from '@/providers/AuthProvider';
import { Screen, AppText, Card, IconChip } from '@/components/ui';
import { colors, hitSlop, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';
import Constants from 'expo-constants';

const LINKS: {
  code: string;
  label: string;
  path?: `/(agent)/${string}`;
  icon: IoniconName;
}[] = [
  { code: 'CRM-0090', label: 'Profile', path: '/(agent)/profile', icon: 'person-outline' },
  { code: 'CRM-0091', label: 'Activity', path: '/(agent)/activity', icon: 'pulse-outline' },
  { code: 'CRM-0097', label: 'Surveys', path: '/(agent)/surveys', icon: 'clipboard-outline' },
  { code: 'CRM-0110', label: 'Chat', path: '/(agent)/support-ticket', icon: 'chatbubble-outline' },
  { code: 'CRM-0099', label: 'Reports', path: '/(agent)/reports', icon: 'bar-chart-outline' },
  {
    code: 'CRM-0105',
    label: 'Interaction History',
    path: '/(agent)/interaction-history',
    icon: 'time-outline',
  },
  { code: 'CRM-0106', label: 'Sales Activities', path: '/(agent)/sales-activities', icon: 'cart-outline' },
  {
    code: 'CRM-0107',
    label: 'Giveaway Activities',
    path: '/(agent)/giveaway-activities',
    icon: 'gift-outline',
  },
  {
    code: 'CRM-0108',
    label: 'Survey Activities',
    path: '/(agent)/survey-activities',
    icon: 'clipboard-outline',
  },
  { code: 'CRM-0109', label: 'Help & Support', path: '/(agent)/help-support', icon: 'help-circle-outline' },
  { code: 'CRM-0111', label: 'Manage Agents', path: '/(agent)/manage-agents', icon: 'people-outline' },
  { code: 'CRM-0101', label: 'Settings', path: '/(agent)/settings', icon: 'settings-outline' },
];

function displayName(email?: string | null): string {
  if (!email) return 'Agent';
  const local = email.split('@')[0] ?? email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

type MenuRowProps = {
  label: string;
  icon: IoniconName;
  onPress: () => void;
  destructive?: boolean;
  showDivider?: boolean;
};

function MenuRow({ label, icon, onPress, destructive, showDivider }: MenuRowProps) {
  const iconColor = destructive ? colors.destructive : colors.primary;
  const chipBg = destructive ? '#FFE5E3' : colors.primaryLight;
  const labelColor = destructive ? colors.destructive : colors.foreground;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ flex: 1 }}
    >
      {({ pressed }) => (
        <View
          style={{
            flex: 1,
            minHeight: 72,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            backgroundColor: pressed
              ? destructive
                ? '#FFE5E3'
                : colors.muted
              : colors.card,
            borderBottomWidth: showDivider ? 1 : 0,
            borderBottomColor: colors.border,
          }}
        >
          <IconChip
            name={icon}
            backgroundColor={chipBg}
            color={iconColor}
            size={52}
            iconSize={26}
          />
          <AppText
            style={{
              flex: 1,
              flexShrink: 1,
              fontSize: 16,
              fontWeight: '600',
              color: labelColor,
            }}
            numberOfLines={1}
          >
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

export default function MoreScreen() {
  const router = useRouter();
  const { isEnabled } = useProjectComponents();
  const { user, signOut } = useAuth();

  const visibleLinks = LINKS.filter((l) => isEnabled(l.code));
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <ComponentGate code="CRM-0100">
      <Screen>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          <IconChip
            name="person"
            size={56}
            iconSize={28}
            backgroundColor={colors.primaryLight}
            color={colors.primary}
          />
          <View style={{ flex: 1, flexShrink: 1 }}>
            <AppText
              style={{ fontWeight: '700', fontSize: 18, flexShrink: 1 }}
              numberOfLines={1}
            >
              {displayName(user?.email)}
            </AppText>
            {user?.email ? (
              <AppText
                variant="secondary"
                style={{ marginTop: 2, flexShrink: 1 }}
                numberOfLines={1}
              >
                {user.email}
              </AppText>
            ) : null}
          </View>
        </View>

        <Card style={{ flex: 1, padding: 0, elevation: 0, shadowOpacity: 0 }}>
          {visibleLinks.map((link, index) => (
            <MenuRow
              key={link.code}
              label={link.label}
              icon={link.icon}
              showDivider
              onPress={() => link.path && router.push(link.path as never)}
            />
          ))}
          <MenuRow
            label="Logout"
            icon="log-out-outline"
            destructive
            onPress={handleLogout}
          />
        </Card>

        <AppText
          variant="secondary"
          style={{ textAlign: 'center', marginTop: spacing.md, fontSize: 12 }}
        >
          Version {version}
        </AppText>
      </Screen>
    </ComponentGate>
  );
}
