import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { text } from '@/theme';

type TextVariant = keyof typeof text;

interface AppTextProps extends TextProps {
  variant?: TextVariant;
}

export function AppText({ variant = 'body', style, ...props }: AppTextProps) {
  return <RNText style={[text[variant], style as TextStyle]} {...props} />;
}
