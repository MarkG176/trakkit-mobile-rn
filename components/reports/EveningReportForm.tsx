import { useState } from 'react';
import { AppText, Button, Card } from '@/components/ui';
import { spacing } from '@/theme';
import { reportAlert } from './shared';

// NOTE: Web EveningReportDialog is an intentional stub — no fields or DB writes yet.

export function EveningReportForm() {
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      reportAlert(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
      <AppText variant="h3" style={{ fontWeight: '700', marginBottom: spacing.sm }}>
        Evening Report
      </AppText>
      <AppText variant="secondary" style={{ marginBottom: spacing.lg }}>
        End-of-day report. Submit to complete your day.
      </AppText>
      <Button onPress={submit} loading={loading}>
        Submit Report
      </Button>
    </Card>
  );
}
