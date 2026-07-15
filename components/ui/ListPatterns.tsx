import { ReactNode } from 'react';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { Card } from './Card';
import { colors, spacing } from '@/theme';

interface ListItemCardProps {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function ListItemCard({ title, subtitle, trailing, onPress, style }: ListItemCardProps) {
  const card = (
    <Card style={[{ marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, style]}>
      <View style={{ flex: 1 }}>
        <AppText style={{ fontWeight: '500' }}>{title}</AppText>
        {subtitle ? <AppText variant="secondary" style={{ marginTop: spacing.xs }}>{subtitle}</AppText> : null}
      </View>
      {trailing}
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {card}
      </TouchableOpacity>
    );
  }

  return card;
}

interface ChipOption {
  value: string;
  label: string;
}

interface ChipSelectProps {
  label?: string;
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
}

export function ChipSelect({ label, options, value, onChange }: ChipSelectProps) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      {label ? <AppText style={{ fontWeight: '500', marginBottom: spacing.sm }}>{label}</AppText> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={{
                borderRadius: 9999,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                backgroundColor: selected ? colors.primary : colors.muted,
              }}
            >
              <AppText
                style={{
                  fontSize: 12,
                  textTransform: 'capitalize',
                  color: selected ? colors.primaryForeground : colors.foreground,
                  fontWeight: '500',
                }}
              >
                {opt.label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

interface SelectCardProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function SelectCard({ label, selected, onPress }: SelectCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card
        style={{
          marginBottom: spacing.sm,
          borderColor: selected ? colors.primary : colors.border,
          backgroundColor: selected ? colors.accent : colors.card,
        }}
      >
        <AppText>{label}</AppText>
      </Card>
    </TouchableOpacity>
  );
}
