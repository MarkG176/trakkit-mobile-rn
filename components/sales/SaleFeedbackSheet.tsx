// [CRM-0054] SaleFeedbackSheet — post-sale engagement, notes, and sentiment
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { CheckCircle2, Star } from 'lucide-react-native';
import { AppText, Button, Input } from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';

export interface SaleFeedbackData {
  engagementType: string;
  notes: string;
  sentiment: number;
}

const ENGAGEMENT_OPTIONS = [
  { value: 'direct', label: 'Direct Sale' },
  { value: 'referral', label: 'Referral' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'event', label: 'Event' },
] as const;

const SENTIMENT_LABELS = [
  'Tap to rate customer experience',
  'Very Dissatisfied',
  'Dissatisfied',
  'Neutral',
  'Satisfied',
  'Very Satisfied',
] as const;

interface SaleFeedbackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feedback: SaleFeedbackData) => void | Promise<void>;
  onSkip: () => void | Promise<void>;
  totalAmount: number;
  itemCount: number;
  customerName?: string;
  currencyCode?: string;
}

export function SaleFeedbackSheet({
  open,
  onOpenChange,
  onSubmit,
  onSkip,
  totalAmount,
  itemCount,
  customerName,
  currencyCode = 'KES',
}: SaleFeedbackSheetProps) {
  const [engagementType, setEngagementType] = useState('direct');
  const [notes, setNotes] = useState('');
  const [sentiment, setSentiment] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setEngagementType('direct');
    setNotes('');
    setSentiment(0);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({ engagementType, notes, sentiment });
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    await onSkip();
    reset();
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={() => onOpenChange(false)}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <CheckCircle2 size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.title}>Sale Recorded!</AppText>
                <AppText variant="secondary" style={styles.subtitle}>
                  {currencyCode} {totalAmount.toFixed(2)} • {itemCount} item
                  {itemCount > 1 ? 's' : ''}
                  {customerName ? ` • ${customerName}` : ''}
                </AppText>
              </View>
            </View>

            <AppText style={styles.label}>Engagement Type</AppText>
            <View style={styles.chips}>
              {ENGAGEMENT_OPTIONS.map((opt) => {
                const selected = engagementType === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setEngagementType(opt.value)}
                    hitSlop={hitSlop}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <AppText
                      style={[styles.chipText, selected && styles.chipTextSelected]}
                    >
                      {opt.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <AppText style={styles.label}>Customer Sentiment</AppText>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setSentiment(star)}
                  hitSlop={hitSlop}
                  style={styles.starBtn}
                >
                  <Star
                    size={28}
                    color={star <= sentiment ? '#FBBF24' : colors.mutedForeground}
                    fill={star <= sentiment ? '#FBBF24' : 'transparent'}
                  />
                </Pressable>
              ))}
            </View>
            <AppText variant="secondary" style={styles.sentimentHint}>
              {SENTIMENT_LABELS[sentiment] ?? SENTIMENT_LABELS[0]}
            </AppText>

            <Input
              label="Engagement Notes (Optional)"
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about this sale or customer interaction..."
              multiline
              numberOfLines={3}
              style={styles.notes}
            />
          </ScrollView>

          <View style={styles.actions}>
            <Button
              variant="outline"
              style={styles.actionBtn}
              onPress={handleSkip}
              disabled={isSubmitting}
            >
              Skip
            </Button>
            <Button
              style={styles.actionBtn}
              onPress={handleSubmit}
              loading={isSubmitting}
            >
              Save Feedback
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  content: { padding: spacing.md, paddingBottom: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  subtitle: { marginTop: 2 },
  label: { fontWeight: '500', marginBottom: spacing.sm, fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '500', color: colors.foreground },
  chipTextSelected: { color: colors.primaryForeground },
  stars: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  starBtn: { padding: spacing.xs },
  sentimentHint: { fontSize: 12, marginBottom: spacing.lg },
  notes: { minHeight: 80, textAlignVertical: 'top' },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: { flex: 1 },
});
