import { View } from 'react-native';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { useAuth } from '@/providers/AuthProvider';
import { AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';

export function TopBar() {
  const { user } = useAuth();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.card,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
      }}
    >
      <View>
        <AppText variant="h3">TraKKiT</AppText>
        <AppText variant="secondary">{user?.email}</AppText>
      </View>
      <WorkspaceSwitcher />
    </View>
  );
}
