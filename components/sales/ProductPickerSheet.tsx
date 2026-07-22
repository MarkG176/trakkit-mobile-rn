import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import type { TextInput as TextInputRef } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { InventoryItem } from '@/hooks/useInventory';
import { AppText, Button, EmptyMessage, LoadingSpinner } from '@/components/ui';
import { formatCurrencySimple } from '@/utils/currency';
import { colors, hitSlop, radius, spacing } from '@/theme';
import { getLineTotal, hasDeal, type SaleLine } from './types';

const DIALOG_MS = 200;

/** Minimal cart line shape shared by sale and giveaway pickers */
export type PickerCartLine = {
  product_variant_id: string;
  name: string;
  quantity: number;
  amount_issued: number;
  unitPrice?: number;
  lineTotal?: number;
};

type ProductPickerVariant = 'sale' | 'giveaway';

type ProductPickerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: InventoryItem[];
  inventoryLoading: boolean;
  cart: PickerCartLine[];
  currency?: string;
  variant?: ProductPickerVariant;
  onEnsureInCart: (item: InventoryItem) => void;
  onUpdateQuantity: (productVariantId: string, quantity: number) => void;
  onSetLineTotal?: (productVariantId: string, total: number) => void;
};

function ProductPickerRow({
  item,
  line,
  currency,
  variant,
  expanded,
  dealMode,
  onToggleExpand,
  onAddPress,
  onUpdateQuantity,
  onEnterDealMode,
  onExitDealMode,
  onSetLineTotal,
}: {
  item: InventoryItem;
  line: PickerCartLine | undefined;
  currency: string;
  variant: ProductPickerVariant;
  expanded: boolean;
  dealMode: boolean;
  onToggleExpand: () => void;
  onAddPress: () => void;
  onUpdateQuantity: (quantity: number) => void;
  onEnterDealMode: () => void;
  onExitDealMode: () => void;
  onSetLineTotal?: (total: number) => void;
}) {
  const isSale = variant === 'sale';
  const inCart = line?.quantity ?? 0;
  const low = item.amount_issued < 10;
  const maxQty = Math.max(item.amount_issued, 1);
  const [qtyDraft, setQtyDraft] = useState(String(line?.quantity ?? 1));
  const [dealDraft, setDealDraft] = useState('');

  const saleLine = line as SaleLine | undefined;

  useEffect(() => {
    if (line) setQtyDraft(String(line.quantity));
  }, [line?.quantity, line?.product_variant_id]);

  useEffect(() => {
    if (dealMode && isSale && saleLine) {
      setDealDraft(getLineTotal(saleLine).toFixed(2));
    }
  }, [dealMode, isSale, saleLine]);

  const commitQty = (raw: string) => {
    const parsed = parseInt(raw.replace(/[^0-9]/g, ''), 10);
    if (!Number.isFinite(parsed)) {
      setQtyDraft(String(line?.quantity ?? 1));
      return;
    }
    const capped = Math.min(Math.max(1, parsed), maxQty);
    setQtyDraft(String(capped));
    onUpdateQuantity(capped);
  };

  const commitDeal = () => {
    if (!onSetLineTotal) return;
    const parsed = parseFloat(dealDraft);
    onSetLineTotal(Number.isFinite(parsed) && parsed >= 0 ? parsed : 0);
    onExitDealMode();
  };

  return (
    <View
      style={{
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: inCart > 0 || expanded ? colors.primary : colors.border,
        backgroundColor: colors.canvas,
        overflow: 'hidden',
      }}
    >
      <Pressable
        onPress={expanded ? onToggleExpand : undefined}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.md,
          minHeight: 72,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.md,
            backgroundColor: colors.muted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={isSale ? 'cart-outline' : 'gift-outline'}
            size={22}
            color={colors.secondaryForeground}
          />
        </View>

        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <AppText style={{ fontWeight: '600' }} numberOfLines={2}>
            {item.name}
          </AppText>
          <AppText variant="secondary" style={{ fontSize: 14 }}>
            Available: {item.amount_issued}
            {low ? ' · Low stock' : ''}
          </AppText>
          {isSale && item.price > 0 ? (
            <AppText style={{ fontWeight: '700', color: colors.primary, fontSize: 14 }}>
              {formatCurrencySimple(item.price, currency)}
            </AppText>
          ) : null}
          {isSale && saleLine && hasDeal(saleLine) ? (
            <AppText style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
              Line total: {formatCurrencySimple(getLineTotal(saleLine), currency)}
            </AppText>
          ) : null}
        </View>

        <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
          {inCart > 0 && !expanded ? (
            <AppText variant="secondary" style={{ fontSize: 12, fontWeight: '600' }}>
              ×{inCart}
            </AppText>
          ) : null}
          {!expanded ? (
            <Button
              size="sm"
              onPress={onAddPress}
              style={{ minWidth: 72, paddingHorizontal: spacing.md }}
            >
              + Add
            </Button>
          ) : (
            <Ionicons name="chevron-up" size={20} color={colors.secondaryForeground} />
          )}
        </View>
      </Pressable>

      {expanded && line ? (
        <View
          style={{
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.md,
            gap: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          {isSale && dealMode ? (
            <>
              <AppText variant="secondary" style={{ fontSize: 14, marginTop: spacing.sm }}>
                Qty: {line.quantity}
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <AppText variant="secondary" style={{ fontSize: 14 }}>
                  Total
                </AppText>
                <AppText variant="secondary" style={{ fontSize: 14 }}>
                  {currency}
                </AppText>
                <TextInput
                  value={dealDraft}
                  onChangeText={setDealDraft}
                  keyboardType="decimal-pad"
                  autoFocus
                  onSubmitEditing={commitDeal}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    borderRadius: radius.md,
                    paddingHorizontal: spacing.md,
                    fontSize: 16,
                    color: colors.foreground,
                    backgroundColor: colors.card,
                  }}
                />
                <Pressable
                  onPress={commitDeal}
                  hitSlop={hitSlop}
                  accessibilityLabel="Apply deal"
                  style={({ pressed }) => ({
                    width: 48,
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Ionicons name="checkmark" size={24} color={colors.primary} />
                </Pressable>
              </View>
              <Button variant="ghost" onPress={onExitDealMode}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginTop: spacing.sm,
                }}
              >
                <AppText style={{ fontWeight: '500', fontSize: 14, width: 72 }}>Amount</AppText>
                <TextInput
                  value={qtyDraft}
                  onChangeText={setQtyDraft}
                  onBlur={() => commitQty(qtyDraft)}
                  onSubmitEditing={() => commitQty(qtyDraft)}
                  keyboardType="number-pad"
                  style={{
                    flex: 1,
                    minHeight: 48,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    paddingHorizontal: spacing.md,
                    fontSize: 16,
                    color: colors.foreground,
                    backgroundColor: colors.card,
                  }}
                />
              </View>
              {isSale ? (
                <Button variant="ghost" onPress={onEnterDealMode}>
                  Deals
                </Button>
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

export function ProductPickerSheet({
  open,
  onOpenChange,
  inventory,
  inventoryLoading,
  cart,
  currency = '',
  variant = 'sale',
  onEnsureInCart,
  onUpdateQuantity,
  onSetLineTotal,
}: ProductPickerSheetProps) {
  const { height: windowH } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dealModeId, setDealModeId] = useState<string | null>(null);
  const searchInputRef = useRef<TextInputRef>(null);
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(0)).current;
  const closingRef = useRef(false);
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  const dismissKeyboard = () => {
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return inventory;
    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.sku?.toLowerCase().includes(term) ?? false),
    );
  }, [inventory, search]);

  const lineById = useMemo(() => {
    const map = new Map<string, PickerCartLine>();
    for (const line of cart) map.set(line.product_variant_id, line);
    return map;
  }, [cart]);

  useEffect(() => {
    if (open) {
      closingRef.current = false;
      setMounted(true);
      overlayAnim.setValue(0);
      panelAnim.setValue(0);
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: DIALOG_MS,
          useNativeDriver: true,
        }),
        Animated.timing(panelAnim, {
          toValue: 1,
          duration: DIALOG_MS,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          searchInputRef.current?.blur();
          Keyboard.dismiss();
        }
      });
      return;
    }

    if (!mounted || closingRef.current) return;
    closingRef.current = true;
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: DIALOG_MS,
        useNativeDriver: true,
      }),
      Animated.timing(panelAnim, {
        toValue: 0,
        duration: DIALOG_MS,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
        closingRef.current = false;
        setSearch('');
        setExpandedId(null);
        setDealModeId(null);
      }
    });
  }, [open, mounted, overlayAnim, panelAnim]);

  const close = () => onOpenChange(false);

  const panelScale = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });
  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  if (!mounted) return null;

  const maxPanelH = Math.min(windowH * 0.72, 560);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            opacity: overlayAnim,
          }}
        />

        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={close}
          accessibilityLabel="Close product picker"
        />

        <Animated.View
          style={{
            width: '92%',
            maxWidth: 448,
            height: maxPanelH,
            opacity: panelAnim,
            transform: [{ scale: panelScale }, { translateY: panelTranslateY }],
            zIndex: 1,
            elevation: 16,
          }}
        >
          <Pressable
            onPress={dismissKeyboard}
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.lg,
                paddingBottom: spacing.md,
                gap: spacing.sm,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <AppText variant="h3" style={{ fontWeight: '700' }}>
                  Add products
                </AppText>
                {itemCount > 0 ? (
                  <AppText variant="secondary" style={{ fontSize: 14 }}>
                    {itemCount} in cart
                  </AppText>
                ) : null}
              </View>
              <Pressable
                onPress={() => {
                  dismissKeyboard();
                  close();
                }}
                hitSlop={hitSlop}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={22} color={colors.secondaryForeground} />
              </Pressable>
            </View>

            <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  backgroundColor: colors.canvas,
                  minHeight: 48,
                }}
              >
                <Ionicons name="search" size={18} color={colors.secondaryForeground} />
                <TextInput
                  ref={searchInputRef}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search products..."
                  placeholderTextColor={colors.secondaryForeground}
                  autoFocus={false}
                  blurOnSubmit
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: colors.foreground,
                    paddingVertical: spacing.sm,
                  }}
                />
              </View>
            </View>

            <View style={{ flex: 1, minHeight: 0 }}>
              {inventoryLoading ? (
                <LoadingSpinner label="Loading products" />
              ) : filtered.length === 0 ? (
                <EmptyMessage>
                  {inventory.length === 0
                    ? 'No products in your inventory.'
                    : 'No products match your search.'}
                </EmptyMessage>
              ) : (
                <FlatList
                  data={filtered}
                  keyExtractor={(item) => item.product_variant_id}
                  contentContainerStyle={{
                    paddingHorizontal: spacing.lg,
                    paddingBottom: spacing.sm,
                    gap: spacing.sm,
                  }}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  onScrollBeginDrag={dismissKeyboard}
                  nestedScrollEnabled
                  renderItem={({ item }) => {
                    const id = item.product_variant_id;
                    const line = lineById.get(id);
                    const expanded = expandedId === id;
                    return (
                      <ProductPickerRow
                        item={item}
                        line={line}
                        currency={currency}
                        variant={variant}
                        expanded={expanded}
                        dealMode={dealModeId === id}
                        onToggleExpand={() => {
                          dismissKeyboard();
                          setExpandedId((prev) => (prev === id ? null : id));
                          setDealModeId(null);
                        }}
                        onAddPress={() => {
                          dismissKeyboard();
                          onEnsureInCart(item);
                          setExpandedId(id);
                          setDealModeId(null);
                        }}
                        onUpdateQuantity={(qty) => onUpdateQuantity(id, qty)}
                        onEnterDealMode={() => {
                          dismissKeyboard();
                          setDealModeId(id);
                        }}
                        onExitDealMode={() => setDealModeId(null)}
                        onSetLineTotal={
                          onSetLineTotal ? (total) => onSetLineTotal(id, total) : undefined
                        }
                      />
                    );
                  }}
                />
              )}
            </View>

            <View
              style={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: colors.muted,
              }}
            >
              <Button
                variant="outline"
                onPress={() => {
                  dismissKeyboard();
                  close();
                }}
              >
                Done
              </Button>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
