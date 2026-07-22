import type { InventoryItem } from '@/hooks/useInventory';

export type SaleLine = {
  product_variant_id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  amount_issued: number;
  /** Deal override for the line total; cleared when qty/unit price change */
  lineTotal?: number;
};

export function getLineTotal(line: SaleLine): number {
  return line.lineTotal ?? line.unitPrice * line.quantity;
}

export function hasDeal(line: SaleLine): boolean {
  return (
    line.lineTotal !== undefined && line.lineTotal !== line.unitPrice * line.quantity
  );
}

export function cartTotal(cart: SaleLine[]): number {
  return cart.reduce((sum, line) => sum + getLineTotal(line), 0);
}

export function cartItemCount(cart: SaleLine[]): number {
  return cart.reduce((sum, line) => sum + line.quantity, 0);
}

/** Ensure product is in cart at qty 1; if already present, leave qty unchanged. */
export function ensureLineInCart(cart: SaleLine[], item: InventoryItem): SaleLine[] {
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
      unitPrice: item.price > 0 ? item.price : 0,
      quantity: 1,
      amount_issued: item.amount_issued,
    },
  ];
}

export function addOrIncrementLine(cart: SaleLine[], item: InventoryItem): SaleLine[] {
  const existing = cart.find((line) => line.product_variant_id === item.product_variant_id);
  if (existing) {
    const nextQty = Math.min(existing.quantity + 1, Math.max(item.amount_issued, 1));
    return cart.map((line) =>
      line.product_variant_id === item.product_variant_id
        ? {
            ...line,
            quantity: nextQty,
            amount_issued: item.amount_issued,
            lineTotal: undefined,
          }
        : line,
    );
  }

  return [
    ...cart,
    {
      product_variant_id: item.product_variant_id,
      name: item.name,
      unitPrice: item.price > 0 ? item.price : 0,
      quantity: 1,
      amount_issued: item.amount_issued,
    },
  ];
}

export function updateLineQuantity(
  cart: SaleLine[],
  productVariantId: string,
  quantity: number,
): SaleLine[] {
  const qty = Math.max(1, Math.floor(quantity) || 1);
  return cart.map((line) => {
    if (line.product_variant_id !== productVariantId) return line;
    const capped = Math.min(qty, Math.max(line.amount_issued, 1));
    return { ...line, quantity: capped, lineTotal: undefined };
  });
}

export function updateLinePrice(
  cart: SaleLine[],
  productVariantId: string,
  unitPrice: number,
): SaleLine[] {
  const price = Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : 0;
  return cart.map((line) =>
    line.product_variant_id === productVariantId
      ? { ...line, unitPrice: price, lineTotal: undefined }
      : line,
  );
}

export function setLineTotal(
  cart: SaleLine[],
  productVariantId: string,
  total: number,
): SaleLine[] {
  const value = Number.isFinite(total) && total >= 0 ? total : 0;
  return cart.map((line) =>
    line.product_variant_id === productVariantId ? { ...line, lineTotal: value } : line,
  );
}

export function removeLine(cart: SaleLine[], productVariantId: string): SaleLine[] {
  return cart.filter((line) => line.product_variant_id !== productVariantId);
}
