import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { Screen, AppText, EmptyMessage } from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

const LINKS: {
  code: string;
  label: string;
  path: `/(supervisor)/${string}`;
  icon: IoniconName;
}[] = [
  { code: 'CRM-0121', label: 'Sales', path: '/(supervisor)/sales', icon: 'cart-outline' },
  { code: 'CRM-0120', label: 'Gallery', path: '/(supervisor)/gallery', icon: 'images-outline' },
  { code: 'CRM-0122', label: 'Rankings', path: '/(supervisor)/rankings', icon: 'trophy-outline' },
  {
    code: 'CRM-0119',
    label: 'Feedback',
    path: '/(supervisor)/feedback',
    icon: 'chatbubble-ellipses-outline',
  },
  { code: 'CRM-0130', label: 'Giveaways', path: '/(supervisor)/giveaways', icon: 'gift-outline' },
];

export default function SupervisorMoreScreen() {
  const router = useRouter();
  const { isEnabled } = useProjectComponents();
  const visible = LINKS.filter((link) => isEnabled(link.code));

  return (
    <Screen scroll>
      {visible.length === 0 ? (
        <EmptyMessage>No additional pages enabled for this workspace.</EmptyMessage>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {visible.map((link) => (
            <Pressable
              key={link.code}
              onPress={() => router.push(link.path as never)}
              hitSlop={hitSlop}
              accessibilityRole="button"
              accessibilityLabel={link.label}
            >
              {({ pressed }) => (
                <View
                  style={{
                    minHeight: 56,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm + 2,
                    borderRadius: radius.md,
                    backgroundColor: pressed ? colors.muted : colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: radius.sm,
                      backgroundColor: colors.primaryLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={link.icon} size={22} color={colors.primary} />
                  </View>
                  <AppText style={{ flex: 1, fontSize: 16, fontWeight: '500' }}>{link.label}</AppText>
                  <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}
