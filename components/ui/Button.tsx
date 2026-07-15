import { ReactNode } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { button, buttonHeights, colors } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive' | 'tile';
type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
  icon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: { container: button.primary, text: button.primaryText },
  secondary: { container: button.secondary, text: button.secondaryText },
  outline: { container: button.outline, text: button.outlineText },
  ghost: { container: button.ghost, text: button.ghostText },
  link: { container: button.link, text: button.linkText },
  destructive: { container: button.destructive, text: button.destructiveText },
  tile: { container: { ...button.primary, ...button.tile }, text: button.primaryText },
};

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: { height: buttonHeights.sm, paddingHorizontal: 12 },
  default: { height: buttonHeights.default, paddingHorizontal: 16 },
  lg: { height: buttonHeights.lg, paddingHorizontal: 32 },
  icon: { height: buttonHeights.icon, width: buttonHeights.icon, paddingHorizontal: 0 },
};

export function Button({
  variant = 'primary',
  size = 'default',
  loading = false,
  children,
  icon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const styles = variantStyles[variant];
  const spinnerColor =
    variant === 'secondary' || variant === 'ghost' || variant === 'outline' || variant === 'link'
      ? colors.primary
      : colors.primaryForeground;

  return (
    <TouchableOpacity
      style={[
        button.base,
        sizeStyles[variant === 'tile' ? 'default' : size],
        styles.container,
        disabled && { opacity: 0.5 },
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          {icon}
          {typeof children === 'string' ? <Text style={styles.text}>{children}</Text> : children}
        </>
      )}
    </TouchableOpacity>
  );
}
