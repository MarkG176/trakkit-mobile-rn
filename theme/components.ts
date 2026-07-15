import { ViewStyle, TextStyle } from 'react-native';
import { colors, radius } from './tokens';
import { font } from './typography';

export const button = {
  base: {
    height: 44,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
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
  ghost: { backgroundColor: 'transparent' } satisfies ViewStyle,
  ghostText: {
    color: colors.secondaryForeground,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: font.medium,
  } satisfies TextStyle,
  destructive: { backgroundColor: colors.destructive } satisfies ViewStyle,
  destructiveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', fontFamily: font.medium } satisfies TextStyle,
  tile: { height: 56, flexDirection: 'column', gap: 4 } satisfies ViewStyle,
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
    elevation: 1,
  } satisfies ViewStyle,
};

export const badge = {
  base: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full } satisfies ViewStyle,
  primary: { backgroundColor: colors.primary } satisfies ViewStyle,
  primaryText: { color: '#FFF', fontSize: 12, fontFamily: font.medium } satisfies TextStyle,
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
};

export const input = {
  container: {
    height: 44,
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
