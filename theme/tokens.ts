export const colors = {
  primary: '#00A3AD',
  primaryForeground: '#FFFFFF',
  primaryLight: '#E0F4F5',

  success: '#4CAF50',
  warning: '#FFC107',
  destructive: '#F44336',

  background: '#FFFFFF',
  foreground: '#333333',
  secondaryForeground: '#666666',
  muted: '#F8F8F8',
  mutedForeground: '#666666',
  border: '#E2E8EB',
  canvas: '#F4F7F8',

  card: '#FFFFFF',
  accent: '#E0F4F5',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

/** Guide: xs 4, sm 8, md 16, lg 24, xl 32 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  /** @deprecated use md */
  '2xl': 24,
  /** @deprecated use xl */
  '3xl': 32,
} as const;

export const tabBar = {
  height: 64,
  activeTintColor: colors.primary,
  inactiveTintColor: colors.secondaryForeground,
  backgroundColor: colors.card,
  borderTopColor: colors.border,
  labelStyle: { fontSize: 12, fontWeight: '500' as const },
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '600' as const },
  h3: { fontSize: 20, fontWeight: '500' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '400' as const },
};
