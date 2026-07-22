import { ReactNode } from 'react';
import { Pressable, ScrollView, ScrollViewProps, View, ViewProps } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, hitSlop, spacing } from '@/theme';
import { AppText } from './AppText';

interface ScreenProps extends ViewProps {
  children: ReactNode;
  scroll?: boolean;
  scrollProps?: ScrollViewProps;
  safeBottom?: boolean;
  onBack?: () => void;
  showBack?: boolean;
  headerRight?: ReactNode;
}

function ScreenBackButton({ onBack }: { onBack?: () => void }) {
  const router = useRouter();

  const handlePress = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(agent)/more');
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{ marginBottom: spacing.sm, alignSelf: 'flex-start', padding: spacing.xs }}
      hitSlop={hitSlop}
      accessibilityLabel="Go back"
    >
      <Ionicons name="arrow-back" size={22} color={colors.foreground} />
    </Pressable>
  );
}

function useNeedsBottomSafeArea(forced?: boolean) {
  const segments = useSegments();
  // Tab screens sit above the tab bar (which already pads for the home indicator).
  // Stack screens outside (tabs) need their own bottom inset.
  const inTabs = (segments as string[]).includes('(tabs)');
  if (typeof forced === 'boolean') return forced;
  return !inTabs;
}

export function Screen({
  children,
  scroll = false,
  scrollProps,
  safeBottom,
  showBack,
  onBack,
  style,
  ...props
}: ScreenProps) {
  const needsBottomSafeArea = useNeedsBottomSafeArea(safeBottom);
  const contentPadding = {
    padding: spacing.md,
    paddingBottom: spacing.md,
  };

  const body = (
    <>
      {showBack ? <ScreenBackButton onBack={onBack} /> : null}
      {children}
    </>
  );

  const content = scroll ? (
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
  );

  if (needsBottomSafeArea) {
    return (
      <SafeAreaView
        edges={['bottom']}
        style={[{ flex: 1, minHeight: 0, backgroundColor: colors.canvas }, style]}
        {...props}
      >
        {content}
      </SafeAreaView>
    );
  }

  return (
    <View style={[{ flex: 1, minHeight: 0, backgroundColor: colors.canvas }, style]} {...props}>
      {content}
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
