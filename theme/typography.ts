import { Platform, TextStyle } from 'react-native';
import { colors } from './tokens';

export const font = {
  family: Platform.select({ ios: 'Roboto', android: 'Roboto', default: 'Roboto' }),
  light: 'Roboto_300Light',
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  bold: 'Roboto_700Bold',
} as const;

export const text: Record<string, TextStyle> = {
  h1: { fontSize: 28, fontWeight: '700', color: colors.foreground, fontFamily: font.bold },
  h2: { fontSize: 22, fontWeight: '600', color: colors.foreground, fontFamily: font.medium },
  h3: { fontSize: 20, fontWeight: '500', color: colors.foreground, fontFamily: font.medium },
  body: { fontSize: 16, fontWeight: '400', color: colors.foreground, fontFamily: font.regular },
  secondary: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.secondaryForeground,
    fontFamily: font.regular,
  },
};
