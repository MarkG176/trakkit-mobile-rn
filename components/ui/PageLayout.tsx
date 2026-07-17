import { ReactNode } from 'react';
import { ActivityIndicator, View, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing } from '@/theme';

export function LoadingSpinner({ style, label }: { style?: ViewStyle; label: string }) {
  return (
    <View style={[{ alignItems: 'center', paddingVertical: spacing.lg }, style]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText variant="secondary" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
        {label}
      </AppText>
    </View>
  );
}

export function EmptyMessage({ children }: { children: string }) {
  return <AppText variant="secondary">{children}</AppText>;
}

export function CenteredScreen({ children }: { children: ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
        padding: spacing.lg,
      }}
    >
      {children}
    </View>
  );
}
