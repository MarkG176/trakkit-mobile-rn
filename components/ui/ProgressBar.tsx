import { View, ViewStyle } from 'react-native';
import { colors, radius } from '@/theme';

interface ProgressBarProps {
  value: number;
  style?: ViewStyle;
}

export function ProgressBar({ value, style }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, value));

  return (
    <View
      style={[
        {
          height: 8,
          borderRadius: radius.lg,
          backgroundColor: colors.muted,
          overflow: 'hidden',
          marginBottom: 16,
        },
        style,
      ]}
    >
      <View
        style={{
          height: '100%',
          width: `${clamped * 100}%`,
          backgroundColor: colors.primary,
          borderRadius: radius.lg,
        }}
      />
    </View>
  );
}
