import { ReactNode } from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  ActivityIndicator,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { button, colors } from '@/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'tile';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
  icon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: { container: button.primary, text: button.primaryText },
  secondary: { container: button.secondary, text: button.secondaryText },
  ghost: { container: button.ghost, text: button.ghostText },
  destructive: { container: button.destructive, text: button.destructiveText },
  tile: { container: { ...button.primary, ...button.tile }, text: button.primaryText },
};

export function Button({
  variant = 'primary',
  loading = false,
  children,
  icon,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const styles = variantStyles[variant];
  const spinnerColor =
    variant === 'secondary' || variant === 'ghost' ? colors.primary : colors.primaryForeground;

  return (
    <TouchableOpacity
      style={[button.base, styles.container, disabled && { opacity: 0.5 }, style]}
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
