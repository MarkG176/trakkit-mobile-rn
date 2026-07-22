/**
 * Stock-level picker — compact inline expand (safe inside ReportDialogShell).
 * Horizontal product row: name + SKU left, select trigger right.
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
  compact?: boolean;
};

export const StockLevelSelect = memo(function StockLevelSelect({
  value,
  onChange,
  expanded,
  onExpandedChange,
  compact = false,
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
    <View
      style={
        compact
          ? { width: 188, flexShrink: 0 }
          : { minWidth: 200, flexShrink: 0 }
      }
    >
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
          backgroundColor: pressed ? colors.muted : colors.muted,
          paddingHorizontal: spacing.sm + 4,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
        })}
      >
        {selected ? (
          <Ionicons name={selected.icon} size={16} color={selected.color} />
        ) : null}
        <AppText
          numberOfLines={1}
          style={{
            flex: 1,
            fontSize: compact ? 13 : typography.body.fontSize,
            fontWeight: selected ? '500' : '400',
            color: selected ? colors.foreground : colors.secondaryForeground,
            flexShrink: 1,
          }}
        >
          {selected?.label ?? 'Select stock level'}
        </AppText>
        <Ionicons
          name={expanded ? 'caret-up' : 'caret-down'}
          size={14}
          color={colors.secondaryForeground}
        />
      </Pressable>

      {expanded ? (
        <View
          style={{
            marginTop: spacing.xs,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            backgroundColor: colors.card,
            overflow: 'hidden',
            zIndex: 10,
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
                  minHeight: 44,
                  paddingHorizontal: spacing.sm + 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                  backgroundColor: active
                    ? colors.primaryLight
                    : pressed
                      ? colors.muted
                      : colors.card,
                })}
              >
                <Ionicons name={opt.icon} size={18} color={opt.color} />
                <AppText
                  numberOfLines={1}
                  style={{
                    fontSize: 14,
                    fontWeight: active ? '600' : '400',
                    color: colors.foreground,
                    flexShrink: 1,
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
  sku?: string | null;
  value: StockLevelValue | '';
  expanded: boolean;
  onExpandedChange: (productVariantId: string | null) => void;
  onChange: (productVariantId: string, value: StockLevelValue) => void;
};

/** Horizontal product row: identity left, compact stock select right. */
export const StockProductRow = memo(function StockProductRow({
  productVariantId,
  name,
  sku,
  value,
  expanded,
  onExpandedChange,
  onChange,
}: StockProductRowProps) {
  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xs,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        <View style={{ flex: 1, flexShrink: 1, minWidth: 0 }}>
          <AppText
            style={{
              fontSize: typography.body.fontSize,
              fontWeight: '600',
              color: colors.foreground,
              flexShrink: 1,
              lineHeight: 22,
            }}
            numberOfLines={2}
          >
            {name}
          </AppText>
          {sku ? (
            <AppText
              style={{
                fontSize: 12,
                color: colors.secondaryForeground,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {`SKU: ${sku}`}
            </AppText>
          ) : null}
        </View>
        <StockLevelSelect
          value={value}
          compact
          expanded={expanded}
          onExpandedChange={(next) => onExpandedChange(next ? productVariantId : null)}
          onChange={(next) => onChange(productVariantId, next)}
        />
      </View>
    </View>
  );
});
