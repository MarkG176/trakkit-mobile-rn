// [CRM-0030] Engagement — quick demo / taste / pitch capture
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { FlaskConical, Megaphone, Sparkles } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { Screen, AppText, Button, Input } from '@/components/ui';
import { useInteractionForm } from '@/hooks/useInteractionForm';
import { colors, hitSlop, radius, spacing } from '@/theme';

const TILES = [
  {
    type: 'demo',
    label: 'Demo',
    description: 'Product demonstration',
    icon: Sparkles,
  },
  {
    type: 'taste',
    label: 'Taste',
    description: 'Sampling / tasting',
    icon: FlaskConical,
  },
  {
    type: 'pitch',
    label: 'Pitch',
    description: 'Sales pitch',
    icon: Megaphone,
  },
] as const;

export default function EngagementScreen() {
  const router = useRouter();
  const { submitInteraction, loading } = useInteractionForm();
  const [selected, setSelected] = useState<(typeof TILES)[number]['type'] | null>(null);
  const [notes, setNotes] = useState('');

  const submit = async () => {
    if (!selected) {
      Alert.alert('Select type', 'Choose demo, taste, or pitch.');
      return;
    }

    const ok = await submitInteraction({
      interactionType: selected,
      customerName: 'Walk-in Customer',
      notes,
      sentiment: 0,
    });

    if (ok) {
      Alert.alert('Engagement logged', `${selected} captured successfully.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
      setSelected(null);
      setNotes('');
    }
  };

  return (
    <ComponentGate code="CRM-0030" redirectTo="/(agent)">
      <Screen showBack>
        <View style={styles.sheet}>
          <AppText style={styles.title}>Log Engagement</AppText>
          <AppText variant="secondary" style={styles.subtitle}>
            Capture a quick customer engagement.
          </AppText>

          <View style={styles.tiles}>
            {TILES.map((tile) => {
              const Icon = tile.icon;
              const active = selected === tile.type;
              return (
                <Pressable
                  key={tile.type}
                  onPress={() => setSelected(tile.type)}
                  hitSlop={hitSlop}
                  style={[styles.tile, active && styles.tileActive]}
                >
                  <Icon size={28} color={active ? colors.primary : colors.mutedForeground} />
                  <AppText style={[styles.tileLabel, active && styles.tileLabelActive]}>
                    {tile.label}
                  </AppText>
                  <AppText variant="secondary" style={styles.tileDesc}>
                    {tile.description}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add details about the interaction…"
            multiline
            numberOfLines={3}
            style={styles.notes}
          />

          <View style={styles.actions}>
            <Button variant="outline" style={{ flex: 1 }} onPress={() => router.back()}>
              Cancel
            </Button>
            <Button
              style={{ flex: 1 }}
              onPress={submit}
              loading={loading}
              disabled={!selected}
            >
              Submit
            </Button>
          </View>
        </View>
      </Screen>
    </ComponentGate>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.lg },
  tiles: { gap: spacing.sm, marginBottom: spacing.lg },
  tile: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  tileActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  tileLabel: { fontSize: 16, fontWeight: '600', minWidth: 56 },
  tileLabelActive: { color: colors.primary },
  tileDesc: { flex: 1, fontSize: 14 },
  notes: { minHeight: 80, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
