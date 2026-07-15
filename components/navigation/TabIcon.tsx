import type { LucideIcon } from 'lucide-react-native';
import { ColorValue } from 'react-native';
import { colors } from '@/theme';

interface TabIconProps {
  Icon: LucideIcon;
  color: ColorValue;
  size?: number;
}

export function TabIcon({ Icon, color, size = 20 }: TabIconProps) {
  return <Icon size={size} color={color} />;
}

export function tabBarIcon(Icon: LucideIcon) {
  return ({ color }: { color: ColorValue }) => <TabIcon Icon={Icon} color={color} />;
}

export const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.secondaryForeground,
  tabBarStyle: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 64,
  },
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '500' as const,
    fontFamily: 'Roboto_500Medium',
  },
};
