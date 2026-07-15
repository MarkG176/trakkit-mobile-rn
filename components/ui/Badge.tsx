import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { badge } from '@/theme';

type BadgeVariant = 'primary' | 'secondary' | 'outline' | 'warning' | 'destructive';

interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: { container: badge.primary, text: badge.primaryText },
  secondary: { container: badge.secondary, text: badge.secondaryText },
  outline: { container: badge.outline, text: badge.outlineText },
  warning: { container: badge.warning, text: badge.warningText },
  destructive: { container: badge.destructive, text: badge.destructiveText },
};

export function Badge({ children, variant = 'secondary', style }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <View style={[badge.base, styles.container, style]}>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
}
