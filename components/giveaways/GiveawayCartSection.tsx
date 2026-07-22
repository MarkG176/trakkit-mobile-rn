import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button } from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';
import { totalItems, type GiveawayLine } from './types';

type GiveawayCartSectionProps = {
  cart: GiveawayLine[];
  onAddProducts: () => void;
  onUpdateQuantity: (productVariantId: string, quantity: number) => void;
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
  onUpdateQuantity,
  onRemove,
}: {
  line: GiveawayLine;
  onUpdateQuantity: (productVariantId: string, quantity: number) => void;
  onRemove: (productVariantId: string) => void;
}) {
  const low = line.amount_issued < 10;

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
          <Ionicons name="gift-outline" size={18} color={colors.secondaryForeground} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppText style={{ fontWeight: '600' }} numberOfLines={2}>
            {line.name}
          </AppText>
          <AppText variant="secondary" style={{ fontSize: 14, marginTop: 2 }}>
            Available: {line.amount_issued}
            {low ? ' · Low stock' : ''}
          </AppText>
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
        <AppText style={{ fontWeight: '700' }}>×{line.quantity}</AppText>
      </View>
    </View>
  );
}

export function GiveawayCartSection({
  cart,
  onAddProducts,
  onUpdateQuantity,
  onRemove,
}: GiveawayCartSectionProps) {
  const items = totalItems(cart);

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
        <AppText style={{ fontWeight: '700', fontSize: 16 }}>Giveaway items</AppText>
        {cart.length > 0 ? (
          <AppText style={{ fontWeight: '700' }}>Items: {items}</AppText>
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
          <Ionicons name="gift-outline" size={28} color={colors.secondaryForeground} />
          <AppText variant="secondary" style={{ textAlign: 'center' }}>
            No items yet. Add products to this giveaway.
          </AppText>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {cart.map((line) => (
            <CartLineRow
              key={line.product_variant_id}
              line={line}
              onUpdateQuantity={onUpdateQuantity}
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
