import { View } from 'react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { AppText, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';

export type SummaryMetrics = {
  storesAdded: number;
  sales: number;
  revenue: number;
  surveys: number;
  giveaways: number;
  giveawayItems: number;
  workLabel: string;
  revenueLabel: string;
};

function MetricCell({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={{ width: '48%', marginBottom: spacing.sm }}>
      <AppText style={{ fontWeight: '700', fontSize: 20, color: colors.foreground }}>
        {value}
      </AppText>
      <AppText variant="secondary" style={{ fontSize: 13, marginTop: 2 }}>
        {label}
      </AppText>
    </View>
  );
}

export function DailySummaryCard({ metrics }: { metrics: SummaryMetrics }) {
  return (
    <ComponentGate code="CRM-0063">
      <Card style={{ marginBottom: spacing.md }}>
        <AppText style={{ fontWeight: '700', fontSize: 16, marginBottom: spacing.md }}>
          Today&apos;s Summary
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <MetricCell label="Sales" value={metrics.sales} />
          <MetricCell label="Revenue" value={metrics.revenueLabel} />
          <MetricCell label="Surveys" value={metrics.surveys} />
          <MetricCell label="Giveaways" value={metrics.giveaways} />
          <MetricCell label="Stores added" value={metrics.storesAdded} />
          <MetricCell label="Work time" value={metrics.workLabel} />
        </View>
      </Card>
    </ComponentGate>
  );
}

export function WeeklySummaryCard({ metrics }: { metrics: SummaryMetrics }) {
  return (
    <ComponentGate code="CRM-0064">
      <Card style={{ marginBottom: spacing.md }}>
        <AppText style={{ fontWeight: '700', fontSize: 16, marginBottom: spacing.md }}>
          This Week
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <MetricCell label="Sales" value={metrics.sales} />
          <MetricCell label="Revenue" value={metrics.revenueLabel} />
          <MetricCell label="Surveys" value={metrics.surveys} />
          <MetricCell label="Giveaways" value={metrics.giveaways} />
          <MetricCell label="Giveaway items" value={metrics.giveawayItems} />
          <MetricCell label="Work time" value={metrics.workLabel} />
        </View>
      </Card>
    </ComponentGate>
  );
}
