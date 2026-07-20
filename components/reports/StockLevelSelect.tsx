/**
 * Stock-level picker — Material-style exposed dropdown (inline expand).
 * No nested Modal (safe inside ReportDialogShell). No status icons — text hierarchy only.
 *
 * Android / M3 cues:
 * - Outlined field shows current selection + trailing chevron
 * - Menu opens below field, elevated, single-line items
 * - Selected item via weight + fill (not icon clutter)
 */
import { memo, useCallback } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { colors, hitSlop, radius, spacing, typography } from '@/theme';
import { STOCK_LEVEL_OPTIONS, type StockLevelValue } from './shared';

type StockLevelSelectProps = {
  value: StockLevelValue | '';
  onChange: (value: StockLevelValue) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
};

export const StockLevelSelect = memo(function StockLevelSelect({
  value,
  onChange,
  expanded,
  onExpandedChange,
}: StockLevelSelectProps) {
  const selected = STOCK_LEVEL_OPTIONS.find((o) => o.value === value);

  const pick = useCallback(
    (next: StockLevelValue) => {
      onChange(next);
      onExpandedChange(false);
    },
    [onChange, onExpandedChange],
  );

  return (
    <View>
      <AppText
        style={{
          ...typography.caption,
          color: colors.secondaryForeground,
          marginBottom: spacing.xs,
          fontWeight: '500',
        }}
      >
        Stock level
      </AppText>

      {/* Exposed dropdown anchor — outlined field */}
      <Pressable
        onPress={() => onExpandedChange(!expanded)}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={
          selected ? `Stock level ${selected.label}` : 'Select stock level'
        }
        style={({ pressed }) => ({
          minHeight: 48,
          borderWidth: 1,
          borderColor: expanded ? colors.primary : colors.border,
          borderRadius: radius.md,
          backgroundColor: pressed ? colors.muted : colors.card,
          paddingHorizontal: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        })}
      >
        <AppText
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: typography.body.fontSize,
            fontWeight: selected ? '500' : '400',
            color: selected ? colors.foreground : colors.secondaryForeground,
            flexShrink: 1,
          }}
        >
          {selected?.label ?? 'Select stock level...'}
        </AppText>
        <Ionicons
          name={expanded ? 'caret-up' : 'caret-down'}
          size={16}
          color={colors.secondaryForeground}
        />
      </Pressable>

      {/* Menu surface — below field, elevated (Android exposed menu) */}
      {expanded ? (
        <View
          style={{
            marginTop: spacing.xs,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            backgroundColor: colors.card,
            overflow: 'hidden',
            ...Platform.select({
              android: { elevation: 4 },
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 6,
              },
              default: {},
            }),
          }}
        >
          {STOCK_LEVEL_OPTIONS.map((opt, index) => {
            const active = value === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => pick(opt.value)}
                hitSlop={hitSlop}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => ({
                  minHeight: 48,
                  paddingHorizontal: spacing.md,
                  justifyContent: 'center',
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                  backgroundColor: active
                    ? colors.primaryLight
                    : pressed
                      ? colors.muted
                      : colors.card,
                })}
              >
                <AppText
                  numberOfLines={1}
                  style={{
                    fontSize: typography.body.fontSize,
                    fontWeight: active ? '600' : '400',
                    color: colors.foreground,
                  }}
                >
                  {opt.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
});

type StockProductRowProps = {
  productVariantId: string;
  name: string;
  value: StockLevelValue | '';
  expanded: boolean;
  onExpandedChange: (productVariantId: string | null) => void;
  onChange: (productVariantId: string, value: StockLevelValue) => void;
};

/** Bordered product card with exposed stock-level dropdown. */
export const StockProductRow = memo(function StockProductRow({
  productVariantId,
  name,
  value,
  expanded,
  onExpandedChange,
  onChange,
}: StockProductRowProps) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        backgroundColor: colors.card,
        padding: spacing.md,
        marginBottom: spacing.sm,
      }}
    >
      <AppText
        style={{
          fontSize: typography.body.fontSize,
          fontWeight: '600',
          color: colors.foreground,
          marginBottom: spacing.md,
          flexShrink: 1,
          lineHeight: 22,
        }}
      >
        {name}
      </AppText>
      <StockLevelSelect
        value={value}
        expanded={expanded}
        onExpandedChange={(next) => onExpandedChange(next ? productVariantId : null)}
        onChange={(next) => onChange(productVariantId, next)}
      />
    </View>
  );
});
