import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ColorValue } from 'react-native';
import { colors } from '@/theme';
import { getTabBarStyle, TAB_BAR_HEIGHT } from '@/components/AppShell';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: IoniconName;
  color: ColorValue;
  size?: number;
}

export function TabIcon({ name, color, size = 20 }: TabIconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}

export function tabBarIcon(name: IoniconName) {
  return ({ color }: { color: ColorValue }) => <TabIcon name={name} color={color} />;
}

export function getTabScreenOptions(bottomInset = 0) {
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.secondaryForeground,
    tabBarStyle: getTabBarStyle(bottomInset),
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '500' as const,
      fontFamily: 'Roboto_500Medium',
    },
  };
}

export const tabScreenOptions = getTabScreenOptions();

export { TAB_BAR_HEIGHT };
