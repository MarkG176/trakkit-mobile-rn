// [CRM-0064] Weekly Summary — rolling weekly summary card
import { View } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export type WeeklySummaryProps = {
  weekLabel?: string;
  salesCount?: number;
  revenue?: number | null;
  giveaways?: number;
  points?: number | null;
  currencyCode?: string;
};

export function WeeklySummary({
  weekLabel = 'This Week',
  salesCount = 0,
  revenue,
  giveaways = 0,
  points,
  currencyCode = '',
}: WeeklySummaryProps) {
  return (
    <View
      style={{
        padding: spacing.md,
        backgroundColor: colors.card,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
      }}
    >
      <AppText style={{ fontWeight: '700', color: colors.foreground }}>{weekLabel}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <Metric label="Sales" value={String(salesCount)} />
        <Metric
          label="Revenue"
          value={revenue != null ? `${currencyCode} ${revenue.toFixed(0)}` : '—'}
        />
        <Metric label="Giveaways" value={String(giveaways)} />
        <Metric label="Points" value={points != null ? String(points) : '—'} />
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ minWidth: 72 }}>
      <AppText variant="secondary" style={{ fontSize: 11 }}>
        {label}
      </AppText>
      <AppText style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>{value}</AppText>
    </View>
  );
}
