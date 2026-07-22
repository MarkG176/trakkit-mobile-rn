/**
 * Stock-level product row — name + current option (defaults Available).
 * Coloured option overlay; safe inside ReportDialogShell (no nested Modal).
 */
import { memo, useCallback } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { colors, hitSlop, radius, spacing, typography } from '@/theme';
import { STOCK_LEVEL_OPTIONS, type StockLevelValue } from './shared';

const OPTION_TINT: Record<StockLevelValue, string> = {
  available: '#DCFCE7',
  low_stock: '#FEF9C3',
  unavailable: '#FEE2E2',
  not_sold: '#F3F4F6',
};

type StockProductRowProps = {
  productVariantId: string;
  name: string;
  sku?: string | null;
  value: StockLevelValue | '';
  expanded: boolean;
  onExpandedChange: (productVariantId: string | null) => void;
  onChange: (productVariantId: string, value: StockLevelValue) => void;
};

/** Name row shows product + current level (defaults Available); options overlay as coloured rows. */
export const StockProductRow = memo(function StockProductRow({
  productVariantId,
  name,
  sku,
  value,
  expanded,
  onExpandedChange,
  onChange,
}: StockProductRowProps) {
  const displayName = name?.trim() || sku?.trim() || 'Product';
  const currentValue: StockLevelValue = value || 'available';
  const selected = STOCK_LEVEL_OPTIONS.find((o) => o.value === currentValue)!;

  const pick = useCallback(
    (next: StockLevelValue) => {
      onChange(productVariantId, next);
      onExpandedChange(null);
    },
    [onChange, onExpandedChange, productVariantId],
  );

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xs,
        zIndex: expanded ? 20 : 0,
        elevation: expanded ? 8 : 0,
        overflow: 'visible',
        backgroundColor: colors.card,
      }}
    >
      <View style={{ position: 'relative', zIndex: expanded ? 20 : 1 }}>
        <Pressable
          onPress={() => onExpandedChange(expanded ? null : productVariantId)}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={`${displayName}, ${selected.label}`}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            minHeight: 56,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.sm,
            borderRadius: radius.md,
            backgroundColor: pressed ? colors.muted : OPTION_TINT[currentValue],
          })}
        >
          <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 }}>
            <AppText
              style={{
                fontSize: typography.body.fontSize,
                fontWeight: '600',
                color: colors.foreground,
                lineHeight: 22,
              }}
              numberOfLines={2}
            >
              {displayName}
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

          <View
            style={{
              flexShrink: 0,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs + 2,
              minHeight: 40,
              paddingVertical: spacing.xs,
              paddingLeft: spacing.sm,
              paddingRight: spacing.xs + 2,
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: '#FFFFFF',
            }}
          >
            <AppText
              numberOfLines={1}
              style={{
                fontSize: typography.body.fontSize,
                fontWeight: '600',
                color: selected.color,
              }}
            >
              {selected.label}
            </AppText>
            <Ionicons
              name={expanded ? 'caret-up' : 'caret-down'}
              size={16}
              color="#9CA3AF"
            />
          </View>
        </Pressable>

        {expanded ? (
          <View
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: spacing.xs,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.md,
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
              zIndex: 30,
              ...Platform.select({
                android: { elevation: 12 },
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.16,
                  shadowRadius: 8,
                },
                default: {},
              }),
            }}
          >
            {STOCK_LEVEL_OPTIONS.map((opt, index) => {
              const active = currentValue === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => pick(opt.value)}
                  hitSlop={hitSlop}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => ({
                    minHeight: 56,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colors.border,
                    backgroundColor: pressed
                      ? '#E5E7EB'
                      : active
                        ? OPTION_TINT[opt.value]
                        : OPTION_TINT[opt.value],
                  })}
                >
                  <AppText
                    numberOfLines={1}
                    style={{
                      fontSize: typography.body.fontSize,
                      fontWeight: active ? '700' : '500',
                      color: opt.color,
                      textAlign: 'center',
                      width: '100%',
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
    </View>
  );
});
