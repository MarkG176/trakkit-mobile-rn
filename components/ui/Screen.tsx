import { ReactNode } from 'react';
import { ScrollView, ScrollViewProps, View, ViewProps } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from './AppText';

interface ScreenProps extends ViewProps {
  children: ReactNode;
  scroll?: boolean;
  scrollProps?: ScrollViewProps;
}

export function Screen({ children, scroll = false, scrollProps, style, ...props }: ScreenProps) {
  const content = (
    <View style={[{ flex: 1, backgroundColor: colors.muted }, style]} {...props}>
      {children}
    </View>
  );

  if (scroll) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.muted }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    );
  }

  return content;
}

interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return <AppText variant="h3" style={{ marginBottom: spacing.md }}>{title}</AppText>;
}
