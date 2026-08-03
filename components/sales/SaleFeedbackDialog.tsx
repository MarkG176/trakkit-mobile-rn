import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { FormField } from '@/components/forms/FormField';
import { SentimentStars } from '@/components/interactions/SentimentStars';
import { ReportDialogShell } from '@/components/reports/ReportDialogShell';
import { AppText, Button, ChipSelect } from '@/components/ui';
import { formatCurrencySimple } from '@/utils/currency';
import { spacing } from '@/theme';

export type SaleFeedbackData = {
  engagementType: string;
  notes: string;
  sentiment: number;
};

type SaleFeedbackDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feedback: SaleFeedbackData) => void | Promise<void>;
  onSkip: () => void;
  totalAmount: number;
  itemCount: number;
  currency: string;
  customerName?: string;
};

const ENGAGEMENT_OPTIONS = [
  { value: 'direct', label: 'Direct Sale' },
  { value: 'referral', label: 'Referral' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'event', label: 'Event' },
];

export function SaleFeedbackDialog({
  open,
  onOpenChange,
  onSubmit,
  onSkip,
  totalAmount,
  itemCount,
  currency,
  customerName,
}: SaleFeedbackDialogProps) {
  const [engagementType, setEngagementType] = useState('direct');
  const [notes, setNotes] = useState('');
  const [sentiment, setSentiment] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEngagementType('direct');
    setNotes('');
    setSentiment(0);
  }, [open]);

  const reset = () => {
    setEngagementType('direct');
    setNotes('');
    setSentiment(0);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ engagementType, notes, sentiment });
      reset();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    reset();
    onSkip();
    onOpenChange(false);
  };

  const subtitle = [
    `${formatCurrencySimple(totalAmount, currency)}`,
    `${itemCount} item${itemCount === 1 ? '' : 's'}`,
    customerName || null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <ReportDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Sale Recorded!"
      subtitle={subtitle}
      icon="checkmark-circle"
      footer={
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button variant="outline" onPress={handleSkip} disabled={submitting} style={{ flex: 1 }}>
            Skip
          </Button>
          <Button onPress={() => void handleSubmit()} loading={submitting} style={{ flex: 1 }}>
            Save Feedback
          </Button>
        </View>
      }
    >
      <ChipSelect
        label="Engagement Type"
        options={ENGAGEMENT_OPTIONS}
        value={engagementType}
        onChange={setEngagementType}
      />
      <AppText style={{ fontWeight: '500', marginBottom: spacing.sm }}>Customer Sentiment</AppText>
      <SentimentStars value={sentiment} onChange={setSentiment} />
      <View style={{ height: spacing.md }} />
      <FormField
        label="Engagement Notes (Optional)"
        value={notes}
        onChangeText={setNotes}
        placeholder="Add any notes about this sale..."
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        style={{ minHeight: 80, height: undefined, paddingVertical: spacing.sm }}
        containerStyle={{ marginBottom: spacing.sm }}
      />
    </ReportDialogShell>
  );
}
