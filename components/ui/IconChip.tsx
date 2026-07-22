import { View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

type IconChipProps = {
  name: IoniconName;
  size?: number;
  iconSize?: number;
  backgroundColor?: string;
  color?: string;
  style?: ViewStyle;
};

/** Circular icon backdrop for card headers (Stitch-style, existing palette). */
export function IconChip({
  name,
  size = 40,
  iconSize = 20,
  backgroundColor = colors.muted,
  color = colors.foreground,
  style,
}: IconChipProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius.full,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Ionicons name={name} size={iconSize} color={color} />
    </View>
  );
}
