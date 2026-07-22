import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button } from '@/components/ui';
import { formatCurrencySimple } from '@/utils/currency';
import { colors, hitSlop, radius, spacing } from '@/theme';
import { cartTotal, getLineTotal, hasDeal, type SaleLine } from './types';

type SaleCartSectionProps = {
  cart: SaleLine[];
  currency: string;
  onAddProducts: () => void;
  onUpdateQuantity: (productVariantId: string, quantity: number) => void;
  onUpdatePrice: (productVariantId: string, unitPrice: number) => void;
  onRemove: (productVariantId: string) => void;
};

function QtyStepper({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      <Pressable
        onPress={() => onChange(Math.max(1, value - 1))}
        hitSlop={hitSlop}
        disabled={value <= 1}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? colors.muted : colors.card,
          opacity: value <= 1 ? 0.4 : 1,
        })}
        accessibilityLabel="Decrease quantity"
      >
        <Ionicons name="remove" size={20} color={colors.foreground} />
      </Pressable>
      <TextInput
        value={String(value)}
        onChangeText={(text) => {
          const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
          if (!Number.isFinite(parsed)) return;
          onChange(Math.min(Math.max(1, parsed), Math.max(max, 1)));
        }}
        keyboardType="number-pad"
        style={{
          width: 48,
          minHeight: 44,
          textAlign: 'center',
          fontSize: 16,
          fontWeight: '600',
          color: colors.foreground,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          backgroundColor: colors.card,
        }}
      />
      <Pressable
        onPress={() => onChange(Math.min(value + 1, Math.max(max, 1)))}
        hitSlop={hitSlop}
        disabled={value >= max && max > 0}
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? colors.muted : colors.card,
          opacity: value >= max && max > 0 ? 0.4 : 1,
        })}
        accessibilityLabel="Increase quantity"
      >
        <Ionicons name="add" size={20} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

function CartLineRow({
  line,
  currency,
  onUpdateQuantity,
  onUpdatePrice,
  onRemove,
}: {
  line: SaleLine;
  currency: string;
  onUpdateQuantity: (productVariantId: string, quantity: number) => void;
  onUpdatePrice: (productVariantId: string, unitPrice: number) => void;
  onRemove: (productVariantId: string) => void;
}) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceDraft, setPriceDraft] = useState(String(line.unitPrice));

  const commitPrice = () => {
    const parsed = parseFloat(priceDraft);
    onUpdatePrice(line.product_variant_id, Number.isFinite(parsed) ? parsed : line.unitPrice);
    setEditingPrice(false);
  };

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        backgroundColor: colors.card,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.md,
            backgroundColor: colors.muted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="cart-outline" size={18} color={colors.secondaryForeground} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText style={{ fontWeight: '600' }} numberOfLines={2}>
            {line.name}
          </AppText>
          {editingPrice ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                marginTop: spacing.xs,
              }}
            >
              <TextInput
                value={priceDraft}
                onChangeText={setPriceDraft}
                keyboardType="decimal-pad"
                autoFocus
                onBlur={commitPrice}
                onSubmitEditing={commitPrice}
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.sm,
                  fontSize: 16,
                  color: colors.foreground,
                  backgroundColor: colors.card,
                }}
              />
              <Pressable onPress={commitPrice} hitSlop={hitSlop} accessibilityLabel="Save price">
                <Ionicons name="checkmark" size={22} color={colors.primary} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setPriceDraft(String(line.unitPrice));
                setEditingPrice(true);
              }}
              hitSlop={hitSlop}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                marginTop: 2,
                alignSelf: 'flex-start',
                minHeight: 44,
              }}
            >
              <View style={{ flexDirection: 'column', gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <AppText variant="secondary" style={{ fontSize: 14 }}>
                    {formatCurrencySimple(line.unitPrice, currency)}
                  </AppText>
                  <Ionicons name="pencil" size={14} color={colors.secondaryForeground} />
                </View>
                {hasDeal(line) ? (
                  <AppText style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
                    Line total: {formatCurrencySimple(getLineTotal(line), currency)}
                  </AppText>
                ) : null}
              </View>
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => onRemove(line.product_variant_id)}
          hitSlop={hitSlop}
          accessibilityLabel="Remove item"
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Ionicons name="remove-circle" size={24} color="#B3261E" />
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        }}
      >
        <QtyStepper
          value={line.quantity}
          max={Math.max(line.amount_issued, 1)}
          onChange={(qty) => onUpdateQuantity(line.product_variant_id, qty)}
        />
        <AppText style={{ fontWeight: '700' }}>
          {formatCurrencySimple(getLineTotal(line), currency)}
        </AppText>
      </View>
    </View>
  );
}

export function SaleCartSection({
  cart,
  currency,
  onAddProducts,
  onUpdateQuantity,
  onUpdatePrice,
  onRemove,
}: SaleCartSectionProps) {
  const total = cartTotal(cart);

  return (
    <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.sm,
        }}
      >
        <AppText style={{ fontWeight: '700', fontSize: 16 }}>Sale items</AppText>
        {cart.length > 0 ? (
          <AppText style={{ fontWeight: '700' }}>
            Total: {formatCurrencySimple(total, currency)}
          </AppText>
        ) : null}
      </View>

      {cart.length === 0 ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.lg,
            borderStyle: 'dashed',
            padding: spacing.lg,
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: colors.card,
          }}
        >
          <Ionicons name="cart-outline" size={28} color={colors.secondaryForeground} />
          <AppText variant="secondary" style={{ textAlign: 'center' }}>
            No items yet. Add products to this sale.
          </AppText>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {cart.map((line) => (
            <CartLineRow
              key={line.product_variant_id}
              line={line}
              currency={currency}
              onUpdateQuantity={onUpdateQuantity}
              onUpdatePrice={onUpdatePrice}
              onRemove={onRemove}
            />
          ))}
        </View>
      )}

      <Button variant="outline" onPress={onAddProducts}>
        + Add products
      </Button>
    </View>
  );
}
