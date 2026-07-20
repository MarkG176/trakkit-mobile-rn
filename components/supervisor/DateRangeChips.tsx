import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui';
import type { DatePreset } from '@/hooks/useDateRangeFilter';
import { colors, hitSlop, radius, spacing } from '@/theme';

const PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'all', label: 'All' },
];

interface DateRangeChipsProps {
  preset: DatePreset;
  onChange: (preset: DatePreset) => void;
}

/** Shared today / week / month / all chips for supervisor list pages. */
export function DateRangeChips({ preset, onChange }: DateRangeChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {PRESET_OPTIONS.map((opt) => {
        const selected = preset === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            hitSlop={hitSlop}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            <AppText style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
              {opt.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  chip: {
    borderRadius: radius.full,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.foreground,
    fontWeight: '500',
  },
  chipLabelSelected: {
    color: colors.primaryForeground,
  },
});
