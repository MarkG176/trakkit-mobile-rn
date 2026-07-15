import { ReactNode } from 'react';
import { Pressable, ScrollView, ScrollViewProps, View, ViewProps } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';
import { AppText } from './AppText';

interface ScreenProps extends ViewProps {
  children: ReactNode;
  scroll?: boolean;
  scrollProps?: ScrollViewProps;
  safeBottom?: boolean;
  /** @deprecated Page title bars removed; tab labels identify the screen. */
  title?: string;
  /** @deprecated */
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  headerRight?: ReactNode;
}

function ScreenBackButton({ onBack }: { onBack?: () => void }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={onBack ?? (() => router.back())}
      style={{ marginBottom: spacing.sm, alignSelf: 'flex-start', padding: 4 }}
      hitSlop={8}
      accessibilityLabel="Go back"
    >
      <Ionicons name="arrow-back" size={22} color={colors.foreground} />
    </Pressable>
  );
}

export function Screen({
  children,
  scroll = false,
  scrollProps,
  safeBottom = false,
  showBack,
  onBack,
  style,
  ...props
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = safeBottom ? insets.bottom : 0;
  const contentPadding = { padding: spacing.md, paddingBottom: spacing.md + bottomPad };

  const body = (
    <>
      {showBack ? <ScreenBackButton onBack={onBack} /> : null}
      {children}
    </>
  );

  return (
    <View style={[{ flex: 1, backgroundColor: colors.canvas }, style]} {...props}>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={contentPadding}
          showsVerticalScrollIndicator={false}
          {...scrollProps}
        >
          {body}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, contentPadding]}>{body}</View>
      )}
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <AppText variant="h3" style={{ marginBottom: spacing.md, color: colors.foreground }}>
      {title}
    </AppText>
  );
}
