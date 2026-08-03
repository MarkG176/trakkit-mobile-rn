/**
 * Stock-level product row — name + grey caret | large ≥40% tinted availability bar.
 * Status text on the same line as the product name; menu opens in a transparent Modal
 * so it always paints above the ReportDialogShell Submit footer and sibling rows.
 */
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  View,
  type LayoutRectangle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { colors, hitSlop, radius, spacing, typography } from '@/theme';
import { STOCK_LEVEL_OPTIONS, type StockLevelValue } from './shared';

/** Saturated fills (readable with dark status-coloured labels). */
const OPTION_TINT: Record<StockLevelValue, string> = {
  available: '#4ADE80',
  low_stock: '#FACC15',
  unavailable: '#F87171',
  not_sold: '#9CA3AF',
};

const OPTION_LABEL: Record<StockLevelValue, string> = {
  available: '#14532D',
  low_stock: '#713F12',
  unavailable: '#7F1D1D',
  not_sold: '#1F2937',
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

/** Same-line name + caret | large colour-coded availability bar (≥40%). */
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
  const barRef = useRef<View>(null);
  const [menuAnchor, setMenuAnchor] = useState<LayoutRectangle | null>(null);

  useEffect(() => {
    if (!expanded) setMenuAnchor(null);
  }, [expanded]);

  const close = useCallback(() => {
    onExpandedChange(null);
    setMenuAnchor(null);
  }, [onExpandedChange]);

  const openMenu = useCallback(() => {
    barRef.current?.measureInWindow((x, y, width, height) => {
      setMenuAnchor({ x, y, width, height });
      onExpandedChange(productVariantId);
    });
  }, [onExpandedChange, productVariantId]);

  const toggle = useCallback(() => {
    if (expanded) {
      close();
      return;
    }
    openMenu();
  }, [close, expanded, openMenu]);

  const pick = useCallback(
    (next: StockLevelValue) => {
      onChange(productVariantId, next);
      close();
    },
    [close, onChange, productVariantId],
  );

  const menuWidth = menuAnchor ? Math.max(menuAnchor.width, 160) : 160;
  const menuLeft = menuAnchor
    ? menuAnchor.x + menuAnchor.width - menuWidth
    : 0;
  const menuTop = menuAnchor
    ? menuAnchor.y + menuAnchor.height + spacing.xs
    : 0;

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xs,
        backgroundColor: colors.card,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          minHeight: 56,
        }}
      >
        {/* Name + grey caret at right of name column */}
        <View
          style={{
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: 0,
            minWidth: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
          }}
        >
          <AppText
            style={{
              flexShrink: 1,
              flexGrow: 1,
              fontSize: typography.body.fontSize,
              fontWeight: '600',
              color: '#000000',
              lineHeight: 22,
            }}
          >
            {displayName}
          </AppText>
          <Pressable
            onPress={toggle}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={expanded ? 'Collapse stock level' : 'Expand stock level'}
            style={{
              minWidth: 44,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Ionicons
              name={expanded ? 'caret-up' : 'caret-down'}
              size={16}
              color="#9CA3AF"
            />
          </Pressable>
        </View>

        {/* Large tinted availability bar — status label only, ≥40% */}
        <View
          ref={barRef}
          collapsable={false}
          style={{
            flexBasis: '40%',
            flexGrow: 0,
            flexShrink: 0,
            minWidth: '40%',
          }}
        >
          <Pressable
            onPress={toggle}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={`Stock level ${selected.label}`}
            style={({ pressed }) => ({
              minHeight: 56,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.md,
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: selected.color,
              backgroundColor: pressed ? colors.muted : OPTION_TINT[currentValue],
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <AppText
              numberOfLines={1}
              style={{
                fontSize: typography.body.fontSize,
                fontWeight: '700',
                color: OPTION_LABEL[currentValue],
                textAlign: 'center',
              }}
            >
              {selected.label}
            </AppText>
          </Pressable>
        </View>
      </View>

      {/* Own Modal layer — always above Submit Report and list siblings. */}
      <Modal
        visible={expanded && menuAnchor != null}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={close}
      >
        <View style={{ flex: 1 }}>
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={close}
            accessibilityLabel="Dismiss stock level menu"
          />
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              top: menuTop,
              left: Math.max(spacing.sm, menuLeft),
              width: menuWidth,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.md,
              backgroundColor: '#FFFFFF',
              overflow: 'hidden',
              ...Platform.select({
                android: { elevation: 24 },
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
                    minHeight: 68,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.md,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginHorizontal: spacing.xs,
                    marginTop: index === 0 ? spacing.sm : spacing.sm,
                    marginBottom:
                      index === STOCK_LEVEL_OPTIONS.length - 1 ? spacing.sm : 0,
                    borderWidth: 1.5,
                    borderColor: opt.color,
                    borderRadius: radius.sm,
                    backgroundColor: pressed ? '#E5E7EB' : OPTION_TINT[opt.value],
                  })}
                >
                  <AppText
                    numberOfLines={1}
                    style={{
                      fontSize: typography.body.fontSize,
                      fontWeight: active ? '700' : '600',
                      color: OPTION_LABEL[opt.value],
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
        </View>
      </Modal>
    </View>
  );
});
