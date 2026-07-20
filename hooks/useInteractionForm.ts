import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { workspaceService } from '@/services/workspaceService';

export interface InteractionFormData {
  interactionType: string;
  customerName: string;
  customerPhone?: string;
  notes: string;
  sentiment: number;
  recordingUrl?: string;
  productVariantId?: string;
  quantity?: number;
  imageUrl?: string;
}

export const useInteractionForm = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const submitInteraction = async (formData: InteractionFormData) => {
    if (!user) {
      Alert.alert('Authentication Error', 'Please log in to submit interactions');
      return false;
    }

    try {
      setLoading(true);

      const { data: currentTask } = await supabase
        .from('agent_tasks')
        .select('id')
        .eq('agent_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      const isGiveaway = formData.interactionType === 'giveaway';

      const { error } = await supabase.from('interactions').insert({
        task_id: currentTask?.id || null,
        agent_id: user.id,
        interaction_type: isGiveaway ? 'giveaway' : 'other',
        customer_name: formData.customerName || 'Walk-in Customer',
        customer_phone: formData.customerPhone || null,
        outcome: 'completed',
        quantity_sold: formData.quantity ?? 0,
        product_variant_id: formData.productVariantId || null,
        workspace_id: workspaceService.getCurrentWorkspaceId(),
        image_url: formData.imageUrl || null,
        metadata: {
          interaction_type: formData.interactionType,
          notes: formData.notes,
          sentiment: formData.sentiment,
          recording_url: formData.recordingUrl,
        },
      });

      if (error) throw error;

      if (isGiveaway && formData.productVariantId && formData.quantity) {
        await supabase.from('inventory_transactions').insert(
          workspaceService.ensureWorkspaceContext({
            agent_id: user.id,
            product_id: formData.productVariantId,
            qty: -formData.quantity,
            type: 'giveaway',
            reference: `Giveaway to ${formData.customerName || 'Customer'}`,
          }),
        );
      }

      await supabase.from('agent_actions').insert(
        workspaceService.ensureWorkspaceContext({
          agent_id: user.id,
          action_type: isGiveaway ? 'giveaway_recorded' : 'interaction_logged',
          points_earned: isGiveaway ? 15 : 10,
          action_data: {
            interaction_type: formData.interactionType,
            customer_name: formData.customerName,
            project: workspaceService.getCurrentWorkspaceLabel(),
          },
        }),
      );

      return true;
    } catch (error) {
      console.error('Error submitting interaction:', error);
      Alert.alert('Error', 'Failed to log interaction. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { submitInteraction, loading };
};
