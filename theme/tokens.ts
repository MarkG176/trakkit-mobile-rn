export const colors = {
  // Brand
  primary: '#00A3AD',
  primaryForeground: '#FFFFFF',
  primaryLight: '#E0F4F5',

  // Status
  success: '#4CAF50',
  warning: '#FFC107',
  destructive: '#F44336',

  // Neutrals
  background: '#FFFFFF',
  foreground: '#333333',
  secondaryForeground: '#666666',
  muted: '#F8F8F8',
  mutedForeground: '#666666',
  border: '#CCCCCC',

  // Surfaces
  card: '#FFFFFF',
  accent: '#E0F4F5',
} as const;

export const radius = {
  sm: 4,
  md: 6,
  lg: 8,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
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
