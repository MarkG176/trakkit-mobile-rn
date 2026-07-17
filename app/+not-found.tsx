import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Screen style={styles.container}>
        <AppText variant="h3" style={styles.title}>
          This screen doesn't exist.
        </AppText>

        <Link href="/" style={styles.link}>
          <AppText style={styles.linkText}>Go to home screen</AppText>
        </Link>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  link: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
  },
});
