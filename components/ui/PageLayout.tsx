import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { colors, pageHeader, spacing } from '@/theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  right?: ReactNode;
}

export function PageHeader({ title, subtitle, onBack, showBack, right }: PageHeaderProps) {
  const router = useRouter();
  const handleBack = onBack ?? (showBack ? () => router.back() : undefined);

  return (
    <View style={{ backgroundColor: pageHeader.backgroundColor, padding: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          {handleBack ? (
            <Pressable
              onPress={handleBack}
              style={{ marginBottom: spacing.sm, alignSelf: 'flex-start', padding: 4, borderRadius: 8 }}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primaryForeground} />
            </Pressable>
          ) : null}
          <AppText style={pageHeader.title}>{title}</AppText>
          {subtitle ? <AppText style={pageHeader.subtitle}>{subtitle}</AppText> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

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
