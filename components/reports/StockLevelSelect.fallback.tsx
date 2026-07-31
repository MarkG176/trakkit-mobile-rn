/**
 * Stock-level product row — wrapped "variant - product" title + ≥40% availability bar.
 * Colour-coded option menu anchors under the trigger. Safe inside ReportDialogShell.
 *
 * FALLBACK SNAPSHOT — reference-only; not imported by active Stock Report UI.
 * Active implementation: StockLevelSelect.tsx
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

/** Left: full wrapping title. Right: ≥40% colour-coded availability dropdown. */
export const StockProductRow = memo(function StockProductRow({
  productVariantId,
  name,
  value,
  expanded,
  onExpandedChange,
  onChange,
}: StockProductRowProps) {
  const displayName = name?.trim() || 'Product';
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
      <View
        style={{
          position: 'relative',
          zIndex: expanded ? 20 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          minHeight: 56,
        }}
      >
        {/* Product identity — wraps fully; ≤60% of row */}
        <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 }}>
          <AppText
            style={{
              fontSize: typography.body.fontSize,
              fontWeight: '600',
              color: '#000000',
              lineHeight: 22,
            }}
          >
            {displayName}
          </AppText>
        </View>

        {/* Colour-coded availability — ≥40% of row width */}
        <Pressable
          onPress={() => onExpandedChange(expanded ? null : productVariantId)}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={`Stock level ${selected.label}`}
          style={({ pressed }) => ({
            flexBasis: '40%',
            flexGrow: 0,
            flexShrink: 0,
            minWidth: '40%',
            minHeight: 48,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.sm,
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: pressed ? colors.muted : OPTION_TINT[currentValue],
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.xs,
          })}
        >
          <AppText
            numberOfLines={1}
            style={{
              flexShrink: 1,
              fontSize: typography.body.fontSize,
              fontWeight: '600',
              color: '#000000',
            }}
          >
            {selected.label}
          </AppText>
          <Ionicons
            name={expanded ? 'caret-up' : 'caret-down'}
            size={14}
            color="#9CA3AF"
          />
        </Pressable>

        {expanded ? (
          <View
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              width: '40%',
              minWidth: '40%',
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
                    minHeight: 48,
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.sm,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: spacing.xs,
                    marginTop: index === 0 ? spacing.xs : 2,
                    marginBottom:
                      index === STOCK_LEVEL_OPTIONS.length - 1 ? spacing.xs : 0,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.sm,
                    backgroundColor: pressed ? '#E5E7EB' : OPTION_TINT[opt.value],
                  })}
                >
                  <AppText
                    numberOfLines={1}
                    style={{
                      fontSize: typography.body.fontSize,
                      fontWeight: active ? '700' : '500',
                      color: '#000000',
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
