import { ReactNode } from 'react';
import { TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';
import { colors, hitSlop, iconButton, radius } from '@/theme';

interface IconButtonProps extends TouchableOpacityProps {
  children: ReactNode;
  circular?: boolean;
}

export function IconButton({ children, circular = true, style, ...props }: IconButtonProps) {
  const buttonStyle: ViewStyle = {
    width: iconButton.size,
    height: iconButton.size,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: circular ? iconButton.borderRadius : radius.lg,
    backgroundColor: colors.muted,
  };

  return (
    <TouchableOpacity style={[buttonStyle, style]} activeOpacity={0.7} hitSlop={hitSlop} {...props}>
      {children}
    </TouchableOpacity>
  );
}
