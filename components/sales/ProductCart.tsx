// [CRM-0034] ProductCart — shared multi-item cart for sale and giveaway flows
import { useCallback, useMemo } from 'react';
import type { ReactElement } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  ListRenderItem,
} from 'react-native';
import { Minus, Plus, ShoppingCart } from 'lucide-react-native';
import { AppText, Button } from '@/components/ui';
import { formatProductName } from '@/utils/formatProductName';
import { colors, hitSlop, radius, spacing } from '@/theme';

export type ProductCartMode = 'sale' | 'giveaway';

export interface CartProduct {
  productVariantId: string;
  name: string | null;
  sku?: string | null;
  price?: number;
  maxQuantity?: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  productVariantId: string;
  lineTotal?: number;
  maxQuantity?: number;
}

export const getCartLineTotal = (item: CartItem) =>
  item.lineTotal ?? item.price * item.quantity;

export const getCartTotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + getCartLineTotal(item), 0);

export const getCartItemCount = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.quantity, 0);

export function addProductToCart(
  cart: CartItem[],
  product: CartProduct,
  options?: { price?: number; maxQuantity?: number },
): CartItem[] {
  const price = options?.price ?? product.price ?? 0;
  const maxQuantity = options?.maxQuantity ?? product.maxQuantity;
  const existing = cart.find((item) => item.productVariantId === product.productVariantId);

  if (existing) {
    const nextQty = existing.quantity + 1;
    if (maxQuantity != null && nextQty > maxQuantity) return cart;
    return cart.map((item) =>
      item.productVariantId === product.productVariantId
        ? { ...item, quantity: nextQty, lineTotal: undefined }
        : item,
    );
  }

  return [
    ...cart,
    {
      id: product.productVariantId,
      productVariantId: product.productVariantId,
      name: formatProductName(product.name, product.sku),
      price,
      quantity: 1,
      maxQuantity,
    },
  ];
}

export function updateCartQuantity(
  cart: CartItem[],
  productVariantId: string,
  quantity: number,
): CartItem[] {
  if (quantity <= 0) {
    return cart.filter((item) => item.productVariantId !== productVariantId);
  }
  return cart.map((item) => {
    if (item.productVariantId !== productVariantId) return item;
    const capped =
      item.maxQuantity != null ? Math.min(quantity, item.maxQuantity) : quantity;
    return { ...item, quantity: capped, lineTotal: undefined };
  });
}

export function updateCartPrice(
  cart: CartItem[],
  productVariantId: string,
  price: number,
): CartItem[] {
  return cart.map((item) =>
    item.productVariantId === productVariantId
      ? { ...item, price: Math.max(0, price), lineTotal: undefined }
      : item,
  );
}

export function setCartLineTotal(
  cart: CartItem[],
  productVariantId: string,
  lineTotal: number,
): CartItem[] {
  return cart.map((item) =>
    item.productVariantId === productVariantId
      ? { ...item, lineTotal: Math.max(0, lineTotal) }
      : item,
  );
}

interface ProductCartProps {
  mode: ProductCartMode;
  products: CartProduct[];
  cartItems: CartItem[];
  onCartChange: (items: CartItem[]) => void;
  currencyCode?: string;
  allowPriceOverride?: boolean;
  hideInventoryCounts?: boolean;
  searchTerm?: string;
  emptyMessage?: string;
  onCheckoutPress?: () => void;
  checkoutLabel?: string;
  loading?: boolean;
  ListHeaderComponent?: ReactElement | null;
}

export function ProductCart({
  mode,
  products,
  cartItems,
  onCartChange,
  currencyCode = 'KES',
  allowPriceOverride = false,
  hideInventoryCounts = false,
  searchTerm = '',
  emptyMessage = 'No products available',
  onCheckoutPress,
  checkoutLabel,
  loading = false,
  ListHeaderComponent,
}: ProductCartProps) {
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) => {
      const label = formatProductName(p.name, p.sku).toLowerCase();
      return label.includes(term) || p.productVariantId.toLowerCase().includes(term);
    });
  }, [products, searchTerm]);

  const total = getCartTotal(cartItems);
  const count = getCartItemCount(cartItems);

  const getQty = useCallback(
    (productVariantId: string) =>
      cartItems.find((item) => item.productVariantId === productVariantId)?.quantity ?? 0,
    [cartItems],
  );

  const handleAdd = useCallback(
    (product: CartProduct) => {
      onCartChange(
        addProductToCart(cartItems, product, {
          price: product.price,
          maxQuantity: mode === 'giveaway' ? product.maxQuantity : undefined,
        }),
      );
    },
    [cartItems, mode, onCartChange],
  );

  const handleDecrement = useCallback(
    (productVariantId: string) => {
      const qty = getQty(productVariantId);
      onCartChange(updateCartQuantity(cartItems, productVariantId, qty - 1));
    },
    [cartItems, getQty, onCartChange],
  );

  const handlePriceChange = useCallback(
    (productVariantId: string, raw: string) => {
      const price = parseFloat(raw);
      if (Number.isNaN(price)) return;
      onCartChange(updateCartPrice(cartItems, productVariantId, price));
    },
    [cartItems, onCartChange],
  );

  const renderItem: ListRenderItem<CartProduct> = useCallback(
    ({ item }) => {
      const qty = getQty(item.productVariantId);
      const cartLine = cartItems.find((c) => c.productVariantId === item.productVariantId);
      const label = formatProductName(item.name, item.sku);
      const atMax =
        mode === 'giveaway' &&
        item.maxQuantity != null &&
        qty >= item.maxQuantity;

      return (
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <ShoppingCart size={16} color={colors.mutedForeground} />
          </View>
          <View style={styles.rowBody}>
            <AppText style={styles.productName}>{label}</AppText>
            {!hideInventoryCounts && item.maxQuantity != null ? (
              <AppText variant="secondary" style={styles.meta}>
                Available: {item.maxQuantity}
              </AppText>
            ) : null}
            {mode === 'sale' && (item.price ?? 0) > 0 ? (
              <AppText style={styles.price}>
                {currencyCode} {(cartLine?.price ?? item.price ?? 0).toFixed(2)}
              </AppText>
            ) : null}
            {mode === 'sale' && allowPriceOverride && qty > 0 ? (
              <View style={styles.priceEdit}>
                <AppText variant="secondary" style={styles.meta}>
                  {currencyCode}
                </AppText>
                <TextInput
                  style={styles.priceInput}
                  keyboardType="decimal-pad"
                  defaultValue={String(cartLine?.price ?? item.price ?? 0)}
                  onEndEditing={(e) =>
                    handlePriceChange(item.productVariantId, e.nativeEvent.text)
                  }
                />
              </View>
            ) : null}
          </View>
          <View style={styles.qtyControls}>
            <Pressable
              onPress={() => handleDecrement(item.productVariantId)}
              disabled={qty === 0}
              hitSlop={hitSlop}
              style={[styles.qtyBtn, qty === 0 && styles.qtyBtnDisabled]}
            >
              <Minus size={16} color={colors.foreground} />
            </Pressable>
            <AppText style={styles.qtyText}>{qty}</AppText>
            <Pressable
              onPress={() => handleAdd(item)}
              disabled={atMax}
              hitSlop={hitSlop}
              style={[styles.qtyBtn, atMax && styles.qtyBtnDisabled]}
            >
              <Plus size={16} color={colors.foreground} />
            </Pressable>
          </View>
        </View>
      );
    },
    [
      allowPriceOverride,
      cartItems,
      currencyCode,
      getQty,
      handleAdd,
      handleDecrement,
      handlePriceChange,
      hideInventoryCounts,
      mode,
    ],
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.productVariantId}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <AppText variant="secondary" style={styles.empty}>
            {emptyMessage}
          </AppText>
        }
      />
      {count > 0 ? (
        <View style={styles.stickyBar}>
          <View>
            <AppText variant="secondary" style={styles.meta}>
              {count} item{count === 1 ? '' : 's'}
            </AppText>
            {mode === 'sale' ? (
              <AppText style={styles.total}>
                {currencyCode} {total.toFixed(2)}
              </AppText>
            ) : (
              <AppText style={styles.total}>Giveaway cart</AppText>
            )}
          </View>
          {onCheckoutPress ? (
            <Button
              onPress={onCheckoutPress}
              loading={loading}
              style={styles.checkoutBtn}
            >
              {checkoutLabel ??
                (mode === 'sale'
                  ? `Review · ${currencyCode} ${total.toFixed(2)}`
                  : 'Review giveaway')}
            </Button>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: { paddingBottom: spacing.xl, gap: spacing.sm },
  empty: { textAlign: 'center', marginTop: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, minWidth: 0 },
  productName: { fontWeight: '500', fontSize: 14, lineHeight: 20 },
  meta: { fontSize: 12, marginTop: 2 },
  price: { fontSize: 12, fontWeight: '600', color: colors.primary, marginTop: 2 },
  priceEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  priceInput: {
    minWidth: 72,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  qtyBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyText: { minWidth: 24, textAlign: 'center', fontWeight: '600' },
  stickyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  total: { fontSize: 16, fontWeight: '700', color: colors.foreground },
  checkoutBtn: { flexShrink: 1, minWidth: 140 },
});
