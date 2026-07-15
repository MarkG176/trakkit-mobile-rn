import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { offlineQueue } from '@/services/offlineQueue';
import { AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';

export function TopBar() {
  const [pending, setPending] = useState(0);

  useEffect(() => {
    return offlineQueue.subscribe(setPending);
  }, []);

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.card,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      }}
    >
      <WorkspaceSwitcher />
      {pending > 0 ? (
        <AppText variant="secondary" style={{ color: colors.warning, marginTop: spacing.xs, flexShrink: 1 }}>
          {pending} item{pending === 1 ? '' : 's'} pending sync
        </AppText>
      ) : null}
    </View>
  );
}
