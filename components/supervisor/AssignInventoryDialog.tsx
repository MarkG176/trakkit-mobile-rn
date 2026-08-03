import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { AppText, Button, IconButton, LoadingSpinner } from '@/components/ui';
import { appAlert } from '@/components/ui/AppAlert';
import { colors, radius, spacing } from '@/theme';

type ProductVariant = {
  id: string;
  name: string;
  sku: string | null;
};

type AssignInventoryDialogProps = {
  open: boolean;
  onClose: () => void;
  agentId: string;
  agentLabel: string;
  workspaceId: string;
  onAssigned: () => void;
};

export function AssignInventoryDialog({
  open,
  onClose,
  agentId,
  agentLabel,
  workspaceId,
  onAssigned,
}: AssignInventoryDialogProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [assigning, setAssigning] = useState(false);

  const fetchVariants = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('product_variants')
      .select('id, name, sku')
      .eq('workspace_id', workspaceId)
      .eq('is_deleted', false)
      .order('name');
    setVariants(
      (data ?? []).map((v) => ({
        id: v.id,
        name: v.name ?? 'Unknown',
        sku: v.sku,
      })),
    );
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    if (!open) return;
    setQuantities({});
    void fetchVariants();
  }, [open, fetchVariants]);

  const setQty = (variantId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [variantId]: Math.max(0, qty) }));
  };

  const hasSelection = Object.values(quantities).some((q) => q > 0);

  const handleAssign = async () => {
    const items = Object.entries(quantities).filter(([, qty]) => qty > 0);
    if (items.length === 0) {
      Alert.alert('Select products', 'Select at least one product with a quantity.');
      return;
    }
    setAssigning(true);
    try {
      for (const [variantId, qty] of items) {
        const variant = variants.find((v) => v.id === variantId);
        const { data: task, error: taskError } = await supabase
          .from('agent_tasks')
          .insert({
            agent_id: agentId,
            individual_sales_target: qty,
            workspace_id: workspaceId,
            status: 'pending',
            assigned_product_variant_id: variantId,
          })
          .select('id')
          .single();
        if (taskError) throw taskError;

        const { error: invError } = await supabase.from('agent_task_inventory').insert({
          agent_id: agentId,
          task_id: task.id,
          product_variant_id: variantId,
          amount_issued: qty,
          name: variant?.name || 'Unknown',
        });
        if (invError) throw invError;
      }
      await appAlert(
        'Inventory assigned',
        `${items.length} product(s) assigned to ${agentLabel}.`,
      );
      setQuantities({});
      onClose();
      onAssigned();
    } catch (err) {
      Alert.alert('Failed to assign', err instanceof Error ? err.message : 'Could not assign inventory.');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            maxHeight: '85%',
            backgroundColor: colors.background,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: spacing.md,
            gap: spacing.sm,
          }}
        >
          <AppText style={{ fontWeight: '700', fontSize: 18 }}>
            Assign Inventory to {agentLabel}
          </AppText>

          {loading ? (
            <LoadingSpinner label="Loading products" />
          ) : variants.length === 0 ? (
            <AppText variant="secondary" style={{ textAlign: 'center', paddingVertical: spacing.lg }}>
              No products available in this workspace
            </AppText>
          ) : (
            <ScrollView
              style={{ maxHeight: 420 }}
              contentContainerStyle={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.sm,
                paddingBottom: spacing.sm,
              }}
              keyboardShouldPersistTaps="handled"
            >
              {variants.map((variant) => {
                const qty = quantities[variant.id] || 0;
                const selected = qty > 0;
                return (
                  <View
                    key={variant.id}
                    style={{
                      width: '48%',
                      flexGrow: 1,
                      maxWidth: '48%',
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected ? colors.primary + '14' : colors.background,
                      borderRadius: radius.md,
                      padding: spacing.sm,
                      alignItems: 'center',
                      gap: spacing.xs,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.muted,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="cube-outline" size={20} color={colors.mutedForeground} />
                    </View>
                    <AppText
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        textAlign: 'center',
                        lineHeight: 16,
                      }}
                      numberOfLines={3}
                    >
                      {variant.sku ? `${variant.sku} - ${variant.name}` : variant.name}
                    </AppText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      <IconButton
                        disabled={qty <= 0}
                        onPress={() => setQty(variant.id, qty - 1)}
                        style={{ width: 36, height: 36, opacity: qty <= 0 ? 0.4 : 1 }}
                      >
                        <Ionicons name="remove" size={16} color={colors.foreground} />
                      </IconButton>
                      <TextInput
                        value={String(qty)}
                        onChangeText={(text) => {
                          const n = parseInt(text.replace(/[^0-9]/g, ''), 10);
                          setQty(variant.id, Number.isFinite(n) ? n : 0);
                        }}
                        keyboardType="number-pad"
                        style={{
                          width: 40,
                          height: 36,
                          textAlign: 'center',
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: radius.sm,
                          color: colors.foreground,
                          fontSize: 14,
                          padding: 0,
                        }}
                      />
                      <IconButton
                        onPress={() => setQty(variant.id, qty + 1)}
                        style={{ width: 36, height: 36 }}
                      >
                        <Ionicons name="add" size={16} color={colors.foreground} />
                      </IconButton>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button variant="outline" onPress={onClose} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button
              loading={assigning}
              disabled={!hasSelection || assigning}
              onPress={() => void handleAssign()}
              style={{ flex: 1 }}
            >
              Assign
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
