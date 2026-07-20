// [CRM-0092] Activity Detail — single interaction details + notes edit
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { Pencil, Save, X } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { FormField } from '@/components/forms/FormField';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { formatProductName } from '@/utils/formatProductName';
import {
  AppText,
  Button,
  Card,
  EmptyMessage,
  LoadingSpinner,
  Screen,
} from '@/components/ui';
import { colors, spacing } from '@/theme';

type ActivityData = {
  id: string;
  created_at: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  sale_value: number | null;
  quantity_sold: number | null;
  interaction_type: string | null;
  outcome: string | null;
  image_url: string | null;
  product_name: string | null;
};

type NoteRow = {
  id: string;
  content: string;
  created_at: string | null;
};

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();

  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [noteContent, setNoteContent] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: interaction, error } = await supabase
        .from('interactions')
        .select('*, product_variants(name, sku)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (interaction) {
        const pv = (interaction as any).product_variants;
        setActivity({
          id: interaction.id,
          created_at: interaction.created_at,
          customer_name: interaction.customer_name,
          customer_phone: interaction.customer_phone,
          sale_value: interaction.sale_value,
          quantity_sold: interaction.quantity_sold,
          interaction_type: interaction.interaction_type,
          outcome: interaction.outcome,
          image_url: interaction.image_url,
          product_name: pv
            ? formatProductName(pv.name, pv.sku, 'Product')
            : null,
        });
      } else {
        setActivity(null);
      }

      const { data: notesData } = await supabase
        .from('notes')
        .select('id, content, created_at')
        .eq('interaction_id', id)
        .order('created_at', { ascending: false });

      setNotes(notesData ?? []);
      if (notesData?.[0]?.content) setNoteContent(notesData[0].content);
    } catch (err) {
      console.error('Failed to load activity', err);
      Alert.alert('Error', 'Failed to load activity details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveNote = async () => {
    if (!id || !noteContent.trim() || !user) return;
    setSaving(true);
    try {
      if (notes.length > 0) {
        const { error } = await supabase
          .from('notes')
          .update({ content: noteContent.trim() })
          .eq('id', notes[0].id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('notes')
          .insert({
            interaction_id: id,
            content: noteContent.trim(),
            customer_name: activity?.customer_name,
            agent_id: user.id,
            workspace_id: currentWorkspaceId,
          })
          .select('id, content, created_at')
          .single();
        if (error) throw error;
        if (data) setNotes([data]);
      }
      setEditing(false);
      Alert.alert('Saved', 'Note updated.');
    } catch (err) {
      console.error('Failed to save note', err);
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ComponentGate code="CRM-0092">
        <Screen showBack>
          <LoadingSpinner label="Loading details" />
        </Screen>
      </ComponentGate>
    );
  }

  if (!activity) {
    return (
      <ComponentGate code="CRM-0092">
        <Screen showBack onBack={() => router.back()}>
          <EmptyMessage>Activity not found.</EmptyMessage>
        </Screen>
      </ComponentGate>
    );
  }

  const typeLabel = (activity.interaction_type ?? 'interaction').replace(/_/g, ' ');

  return (
    <ComponentGate code="CRM-0092">
      <Screen showBack>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Card style={{ marginBottom: spacing.md }}>
            <AppText
              variant="secondary"
              style={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 12 }}
            >
              {typeLabel}
            </AppText>
            <AppText variant="h3" style={{ marginTop: spacing.xs, fontWeight: '700' }}>
              {activity.customer_name || 'Customer'}
            </AppText>
            {activity.created_at ? (
              <AppText variant="secondary" style={{ marginTop: 4 }}>
                {format(parseISO(activity.created_at), 'MMM d, yyyy · HH:mm')}
              </AppText>
            ) : null}
          </Card>

          <Card style={{ marginBottom: spacing.md }}>
            {activity.product_name ? (
              <DetailLine label="Product" value={activity.product_name} />
            ) : null}
            {activity.quantity_sold != null ? (
              <DetailLine label="Quantity" value={String(activity.quantity_sold)} />
            ) : null}
            {activity.sale_value != null ? (
              <DetailLine label="Value" value={String(activity.sale_value)} />
            ) : null}
            {activity.customer_phone ? (
              <DetailLine label="Phone" value={activity.customer_phone} />
            ) : null}
            {activity.outcome ? (
              <DetailLine label="Outcome" value={activity.outcome} />
            ) : null}
          </Card>

          {activity.image_url ? (
            <Card style={{ marginBottom: spacing.md, padding: 0, overflow: 'hidden' }}>
              <Image
                source={{ uri: activity.image_url }}
                style={{ width: '100%', height: 220 }}
                resizeMode="cover"
              />
            </Card>
          ) : null}

          <Card style={{ marginBottom: spacing.md }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing.sm,
              }}
            >
              <AppText style={{ fontWeight: '700' }}>Notes</AppText>
              {!editing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setEditing(true)}
                  icon={<Pencil size={16} color={colors.primary} />}
                >
                  Edit
                </Button>
              ) : (
                <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      setEditing(false);
                      setNoteContent(notes[0]?.content ?? '');
                    }}
                    icon={<X size={16} color={colors.mutedForeground} />}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={saving}
                    onPress={saveNote}
                    icon={<Save size={16} color={colors.primary} />}
                  >
                    Save
                  </Button>
                </View>
              )}
            </View>

            {editing ? (
              <FormField
                label=""
                value={noteContent}
                onChangeText={setNoteContent}
                multiline
                numberOfLines={4}
                placeholder="Add a note…"
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />
            ) : (
              <AppText variant="secondary">
                {noteContent.trim() || 'No notes yet. Tap Edit to add one.'}
              </AppText>
            )}
          </Card>
        </ScrollView>
      </Screen>
    </ComponentGate>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <AppText variant="secondary">{label}</AppText>
      <AppText style={{ fontWeight: '500', flexShrink: 1, textAlign: 'right', marginLeft: spacing.md }}>
        {value}
      </AppText>
    </View>
  );
}
