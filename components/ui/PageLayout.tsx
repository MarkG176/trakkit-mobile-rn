import { ReactNode } from 'react';
import { ActivityIndicator, View, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors, spacing } from '@/theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <AppText variant="h2">{title}</AppText>
      {subtitle ? <AppText variant="secondary" style={{ marginTop: spacing.xs }}>{subtitle}</AppText> : null}
    </View>
  );
}

export function LoadingSpinner({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{ alignItems: 'center', paddingVertical: spacing.lg }, style]}>
      <ActivityIndicator size="large" color={colors.primary} />
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
        padding: spacing['2xl'],
      }}
    >
      {children}
    </View>
  );
}
