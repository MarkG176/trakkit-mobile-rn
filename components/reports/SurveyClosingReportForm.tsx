import { useState } from 'react';
import { Alert } from 'react-native';
import { FormField } from '@/components/forms/FormField';
import { AppText, Button, Card } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { spacing } from '@/theme';
import {
  parseCount,
  reportAlert,
  submitStockRows,
  todayWorkDate,
  useReportSkus,
} from './shared';

export function SurveyClosingReportForm() {
  const { user } = useAuth();
  const { skus } = useReportSkus();
  const [surveysCompleted, setSurveysCompleted] = useState('');
  const [refusals, setRefusals] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) return;
    const completed = parseCount(surveysCompleted);
    if (completed == null) {
      Alert.alert('Missing fields', 'Enter how many surveys were completed today.');
      return;
    }

    const productVariantId = skus[0]?.productVariantId;
    if (!productVariantId) {
      Alert.alert('No products', 'Assign inventory products before submitting this report.');
      return;
    }

    setLoading(true);
    try {
      const { synced } = await submitStockRows([
        {
          agent_id: user.id,
          product_variant_id: productVariantId,
          report_type: 'survey_closing',
          work_date: todayWorkDate(),
          quantity_sold: completed,
          opening_stock: parseCount(refusals),
          notes: notes.trim() || null,
          reported_at: new Date().toISOString(),
        },
      ]);
      reportAlert(synced);
      setSurveysCompleted('');
      setRefusals('');
      setNotes('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
      <AppText variant="h3" style={{ fontWeight: '700', marginBottom: spacing.sm }}>
        Survey Closing Report
      </AppText>
      <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
        End-of-day totals for survey-only projects.
      </AppText>

      <FormField
        label="Surveys completed"
        value={surveysCompleted}
        onChangeText={setSurveysCompleted}
        keyboardType="number-pad"
      />
      <FormField
        label="Refusals / incomplete"
        value={refusals}
        onChangeText={setRefusals}
        keyboardType="number-pad"
      />
      <FormField label="Notes" value={notes} onChangeText={setNotes} multiline />
      <Button onPress={submit} loading={loading}>
        Submit survey closing report
      </Button>
    </Card>
  );
}
