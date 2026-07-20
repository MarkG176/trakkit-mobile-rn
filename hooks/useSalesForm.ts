import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { workspaceService } from '@/services/workspaceService';

interface SaleItem {
  productVariantId: string;
  quantity: number;
  price: number;
  lineTotal?: number;
}

const getSaleLineTotal = (item: SaleItem) => item.lineTotal ?? item.price * item.quantity;

export interface SaleFormData {
  items: SaleItem[];
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  engagementType: string;
  notes: string;
  sentiment: number;
  imageUrl?: string;
}

export const useSalesForm = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const submitSale = async (formData: SaleFormData) => {
    if (!user) {
      Alert.alert('Authentication Error', 'Please log in to record sales');
      return false;
    }

    const customerName = formData.customerName?.trim() || 'Walk-in Customer';

    try {
      setLoading(true);

      const { data: currentTask } = await supabase
        .from('agent_tasks')
        .select('id')
        .eq('agent_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      const totalValue = formData.items.reduce((sum, item) => sum + getSaleLineTotal(item), 0);

      for (const item of formData.items) {
        const { error: interactionError } = await supabase.from('interactions').insert({
          task_id: currentTask?.id || null,
          agent_id: user.id,
          interaction_type: 'sale',
          customer_name: customerName,
          customer_phone: formData.customerPhone || null,
          product_variant_id: item.productVariantId,
          quantity_sold: item.quantity,
          sale_value: getSaleLineTotal(item),
          outcome: 'sale',
          workspace_id: workspaceService.getCurrentWorkspaceId(),
          image_url: formData.imageUrl || null,
          image_metadata: formData.imageUrl
            ? {
                type: 'sale_photo',
                captured_at: new Date().toISOString(),
                team_label: workspaceService.getCurrentWorkspaceLabel() || null,
              }
            : null,
          metadata: {
            engagement_type: formData.engagementType,
            notes: formData.notes,
            sentiment: formData.sentiment,
            customer_email: formData.customerEmail,
          },
        });

        if (interactionError) throw interactionError;

        const { error: inventoryError } = await supabase.from('inventory_transactions').insert(
          workspaceService.ensureWorkspaceContext({
            agent_id: user.id,
            product_id: item.productVariantId,
            qty: -item.quantity,
            type: 'sale',
            reference: `Sale to ${customerName}`,
            metadata: {
              task_id: currentTask?.id || null,
              sale_value: getSaleLineTotal(item),
            },
          }),
        );

        if (inventoryError) throw inventoryError;
      }

      const pointsEarned = Math.floor(totalValue / 10) * 5;
      await supabase.from('agent_actions').insert(
        workspaceService.ensureWorkspaceContext({
          agent_id: user.id,
          action_type: 'sale_recorded',
          points_earned: Math.max(pointsEarned, 25),
          action_data: {
            total_value: totalValue,
            customer_name: customerName,
            items_count: formData.items.length,
            project: workspaceService.getCurrentWorkspaceLabel(),
          },
        }),
      );

      return true;
    } catch (error) {
      console.error('Error submitting sale:', error);
      Alert.alert('Error', 'Failed to record sale. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { submitSale, loading };
};
