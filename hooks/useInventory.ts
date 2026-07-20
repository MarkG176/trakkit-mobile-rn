import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';

export type InventoryItem = {
  id: string;
  name: string;
  product_variant_id: string;
  amount_issued: number;
  price: number;
  sku: string | null;
};

type InventoryRow = {
  id: string;
  name: string | null;
  product_variant_id: string;
  amount_issued: number;
  product_variants:
    | {
        id: string;
        name: string | null;
        sku: string | null;
        price: number | null;
        workspace_id: string | null;
      }
    | {
        id: string;
        name: string | null;
        sku: string | null;
        price: number | null;
        workspace_id: string | null;
      }[]
    | null;
};

function displayName(item: InventoryRow): string {
  const variant = Array.isArray(item.product_variants)
    ? item.product_variants[0]
    : item.product_variants;
  const name = item.name?.trim() || variant?.name?.trim() || 'Product';
  const sku = variant?.sku?.trim();
  return sku ? `${sku} - ${name}` : name;
}

export function useInventory() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = useCallback(async () => {
    if (!user || !currentWorkspaceId) {
      setInventory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_task_inventory')
        .select(
          `
          id,
          name,
          product_variant_id,
          amount_issued,
          product_variants!inner (
            id,
            name,
            sku,
            price,
            workspace_id
          ),
          agent_tasks!inner (
            workspace_id,
            is_deleted
          )
        `,
        )
        .eq('agent_id', user.id)
        .eq('is_deleted', false)
        .eq('product_variants.workspace_id', currentWorkspaceId)
        .eq('agent_tasks.workspace_id', currentWorkspaceId)
        .eq('agent_tasks.is_deleted', false);

      if (error) throw error;

      const deduped = new Map<string, InventoryItem>();

      for (const row of (data as InventoryRow[] | null) ?? []) {
        const variant = Array.isArray(row.product_variants)
          ? row.product_variants[0]
          : row.product_variants;
        const productVariantId = row.product_variant_id;
        if (!productVariantId) continue;

        const existing = deduped.get(productVariantId);
        if (existing) {
          existing.amount_issued += Number(row.amount_issued || 0);
          if (!existing.price && variant?.price) existing.price = Number(variant.price);
          if (!existing.sku && variant?.sku) existing.sku = variant.sku.trim() || null;
          continue;
        }

        deduped.set(productVariantId, {
          id: productVariantId,
          name: displayName(row),
          product_variant_id: productVariantId,
          amount_issued: Number(row.amount_issued || 0),
          price: Number(variant?.price || 0),
          sku: variant?.sku?.trim() || null,
        });
      }

      setInventory([...deduped.values()].sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  }, [user, currentWorkspaceId]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return { inventory, loading, refetch: fetchInventory };
}
