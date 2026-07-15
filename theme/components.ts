import { ViewStyle, TextStyle } from 'react-native';
import { colors, radius } from './tokens';
import { font } from './typography';

const baseButton = {
  borderRadius: radius.lg,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  flexDirection: 'row' as const,
  gap: 8,
};

export const buttonHeights = { sm: 36, default: 40, lg: 44, icon: 40, tile: 56 };

export const button = {
  base: {
    ...baseButton,
    height: buttonHeights.default,
    paddingHorizontal: 16,
  } satisfies ViewStyle,
  primary: { backgroundColor: colors.primary } satisfies ViewStyle,
  primaryText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: font.medium,
  } satisfies TextStyle,
  secondary: { backgroundColor: colors.muted } satisfies ViewStyle,
  secondaryText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: font.medium,
  } satisfies TextStyle,
  outline: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  } satisfies ViewStyle,
  outlineText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: font.medium,
  } satisfies TextStyle,
  ghost: { backgroundColor: 'transparent' } satisfies ViewStyle,
  ghostText: {
    color: colors.mutedForeground,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: font.medium,
  } satisfies TextStyle,
  link: { backgroundColor: 'transparent' } satisfies ViewStyle,
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: font.medium,
    textDecorationLine: 'underline',
  } satisfies TextStyle,
  destructive: { backgroundColor: colors.destructive } satisfies ViewStyle,
  destructiveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', fontFamily: font.medium } satisfies TextStyle,
  tile: { height: buttonHeights.tile, flexDirection: 'column', gap: 4, paddingHorizontal: 12 } satisfies ViewStyle,
};

export const card = {
  container: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  } satisfies ViewStyle,
};

export const badge = {
  base: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: radius.full } satisfies ViewStyle,
  primary: { backgroundColor: colors.primary } satisfies ViewStyle,
  primaryText: { color: '#FFF', fontSize: 12, fontWeight: '600', fontFamily: font.medium } satisfies TextStyle,
  secondary: { backgroundColor: colors.muted } satisfies ViewStyle,
  secondaryText: { color: colors.foreground, fontSize: 12, fontFamily: font.regular } satisfies TextStyle,
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  } satisfies ViewStyle,
  outlineText: { color: colors.foreground, fontSize: 12, fontFamily: font.regular } satisfies TextStyle,
  warning: { backgroundColor: '#FFF4D6' } satisfies ViewStyle,
  warningText: { color: '#8A6D00', fontSize: 12, fontFamily: font.regular } satisfies TextStyle,
  destructive: { backgroundColor: '#FFE5E3' } satisfies ViewStyle,
  destructiveText: { color: '#B3261E', fontSize: 12, fontFamily: font.regular } satisfies TextStyle,
  success: { backgroundColor: '#E8F5E9' } satisfies ViewStyle,
  successText: { color: '#2E7D32', fontSize: 12, fontFamily: font.regular } satisfies TextStyle,
};

export const input = {
  container: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    fontSize: 14,
    color: colors.foreground,
    fontFamily: font.regular,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
    fontFamily: font.medium,
    marginBottom: 6,
  } satisfies TextStyle,
  helper: {
    fontSize: 12,
    color: colors.secondaryForeground,
    fontFamily: font.regular,
    marginTop: 4,
  } satisfies TextStyle,
  error: {
    fontSize: 12,
    color: colors.destructive,
    fontFamily: font.regular,
    marginTop: 4,
  } satisfies TextStyle,
  focused: {
    borderWidth: 2,
    borderColor: colors.primary,
  } satisfies ViewStyle,
};

export const iconButton = {
  size: 40,
  borderRadius: radius.full,
};

export const pageHeader = {
  backgroundColor: colors.primary,
  padding: 16,
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primaryForeground,
    fontFamily: font.bold,
  } satisfies TextStyle,
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: font.regular,
    marginTop: 4,
  } satisfies TextStyle,
};
