/**
 * Stock availability select — static bordered trigger; portaled popover (z~100).
 * Fade + zoom + slide-from-top (~4px), matching Radix SelectContent.
 */
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  View,
  type LayoutRectangle,
  type View as RNView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';
import {
  STOCK_LEVEL_OPTIONS,
  stockReport,
  stockReportBorder,
  type StockLevelValue,
} from './shared';

const TRIGGER_HEIGHT = 44;
const POPOVER_MS = 150;

type StockLevelSelectProps = {
  value: StockLevelValue | '';
  onChange: (value: StockLevelValue) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const StockLevelSelect = memo(function StockLevelSelect({
  value,
  onChange,
  open,
  onOpenChange,
}: StockLevelSelectProps) {
  const triggerRef = useRef<RNView>(null);
  const [localValue, setLocalValue] = useState(value);
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (open && anchor) {
      setMenuVisible(true);
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: POPOVER_MS,
        useNativeDriver: true,
      }).start();
      return;
    }
    if (!open) {
      Animated.timing(anim, {
        toValue: 0,
        duration: POPOVER_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMenuVisible(false);
      });
    }
  }, [open, anchor, anim]);

  const selected = STOCK_LEVEL_OPTIONS.find((o) => o.value === localValue);

  const openMenu = useCallback(() => {
    if (open) {
      onOpenChange(false);
      return;
    }
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      onOpenChange(true);
    });
  }, [open, onOpenChange]);

  const pick = useCallback(
    (next: StockLevelValue) => {
      setLocalValue(next);
      onOpenChange(false);
      onChange(next);
    },
    [onChange, onOpenChange],
  );

  const popoverOpacity = anim;
  const popoverScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });
  /** Radix slide-in-from-top-2 (~8px → 0 when menu opens below trigger). */
  const popoverTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 0],
  });

  return (
    <>
      <View ref={triggerRef} collapsable={false}>
        <Pressable
          onPress={openMenu}
          hitSlop={hitSlop}
          delayPressIn={0}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          style={({ pressed }) => ({
            height: TRIGGER_HEIGHT,
            ...stockReportBorder,
            borderRadius: radius.md,
            borderColor: open ? stockReport.primary : stockReport.border,
            backgroundColor: pressed ? stockReport.panel : colors.card,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.sm,
          })}
        >
          {selected ? (
            <AppText
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: '500',
                color: stockReport.heading,
                flexShrink: 1,
              }}
            >
              {selected.label}
            </AppText>
          ) : (
            <AppText
              numberOfLines={1}
              style={{ flex: 1, fontSize: 14, color: colors.secondaryForeground }}
            >
              Select stock level...
            </AppText>
          )}
          <Ionicons name="chevron-down" size={16} color={colors.secondaryForeground} />
        </Pressable>
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => onOpenChange(false)}
      >
        <View style={{ flex: 1 }} pointerEvents="box-none">
          <Pressable
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={() => onOpenChange(false)}
            accessibilityLabel="Dismiss stock level menu"
          />
          {anchor ? (
            <Animated.View
              pointerEvents="box-none"
              style={{
                position: 'absolute',
                top: anchor.y + anchor.height + 4,
                left: anchor.x,
                width: anchor.width,
                opacity: popoverOpacity,
                transform: [{ scale: popoverScale }, { translateY: popoverTranslateY }],
                zIndex: 100,
                elevation: 24,
              }}
            >
              <View
                style={{
                  ...stockReportBorder,
                  borderRadius: radius.md,
                  backgroundColor: colors.card,
                  ...stockReport.shadowSm,
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 24,
                  paddingVertical: 4,
                }}
              >
                {STOCK_LEVEL_OPTIONS.map((opt) => {
                  const active = localValue === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => pick(opt.value)}
                      delayPressIn={0}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      style={({ pressed }) => ({
                        height: 40,
                        marginHorizontal: 4,
                        marginVertical: 2,
                        paddingHorizontal: 12,
                        borderRadius: radius.sm,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        backgroundColor:
                          active || pressed ? stockReport.primaryLight : 'transparent',
                      })}
                    >
                      <Ionicons name={opt.icon} size={16} color={opt.color} />
                      <AppText
                        style={{
                          fontSize: 14,
                          fontWeight: '500',
                          color:
                            opt.value === 'not_sold'
                              ? colors.secondaryForeground
                              : stockReport.heading,
                          flexShrink: 1,
                        }}
                      >
                        {opt.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          ) : null}
        </View>
      </Modal>
    </>
  );
});

type StockProductRowProps = {
  productVariantId: string;
  name: string;
  value: StockLevelValue | '';
  open: boolean;
  onOpenChange: (productVariantId: string | null) => void;
  onChange: (productVariantId: string, value: StockLevelValue) => void;
};

/** Static product card — no expand/collapse; status icon beside name when set. */
export const StockProductRow = memo(function StockProductRow({
  productVariantId,
  name,
  value,
  open,
  onOpenChange,
  onChange,
}: StockProductRowProps) {
  const status = value ? STOCK_LEVEL_OPTIONS.find((o) => o.value === value) : undefined;

  return (
    <View
      style={{
        ...stockReportBorder,
        borderRadius: radius.md,
        backgroundColor: colors.card,
        padding: 12,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 8,
          marginBottom: 8,
        }}
      >
        {status ? (
          <Ionicons name={status.icon} size={16} color={status.color} style={{ marginTop: 2 }} />
        ) : null}
        <AppText
          style={{
            fontWeight: '500',
            fontSize: 14,
            color: stockReport.heading,
            flex: 1,
            flexShrink: 1,
          }}
        >
          {name}
        </AppText>
      </View>
      <StockLevelSelect
        value={value}
        open={open}
        onOpenChange={(next) => onOpenChange(next ? productVariantId : null)}
        onChange={(next) => onChange(productVariantId, next)}
      />
    </View>
  );
});
