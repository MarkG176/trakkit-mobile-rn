import type { InventoryItem } from '@/hooks/useInventory';

export type GiveawayLine = {
  product_variant_id: string;
  name: string;
  quantity: number;
  amount_issued: number;
};

export function cartItemCount(cart: GiveawayLine[]): number {
  return cart.reduce((sum, line) => sum + line.quantity, 0);
}

export function totalItems(cart: GiveawayLine[]): number {
  return cartItemCount(cart);
}

/** Ensure product is in cart at qty 1; if already present, leave qty unchanged. */
export function ensureLineInCart(cart: GiveawayLine[], item: InventoryItem): GiveawayLine[] {
  const existing = cart.find((line) => line.product_variant_id === item.product_variant_id);
  if (existing) {
    return cart.map((line) =>
      line.product_variant_id === item.product_variant_id
        ? { ...line, amount_issued: item.amount_issued }
        : line,
    );
  }

  return [
    ...cart,
    {
      product_variant_id: item.product_variant_id,
      name: item.name,
      quantity: 1,
      amount_issued: item.amount_issued,
    },
  ];
}

export function updateLineQuantity(
  cart: GiveawayLine[],
  productVariantId: string,
  quantity: number,
): GiveawayLine[] {
  const qty = Math.max(1, Math.floor(quantity) || 1);
  return cart.map((line) => {
    if (line.product_variant_id !== productVariantId) return line;
    const capped = Math.min(qty, Math.max(line.amount_issued, 1));
    return { ...line, quantity: capped };
  });
}

export function removeLine(cart: GiveawayLine[], productVariantId: string): GiveawayLine[] {
  return cart.filter((line) => line.product_variant_id !== productVariantId);
}
