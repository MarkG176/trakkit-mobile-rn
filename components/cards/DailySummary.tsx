// [CRM-0063] Daily Summary — per-day summary of agent totals
import { View } from 'react-native';
import { AppText } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

export type DailySummaryProps = {
  dateLabel: string;
  salesCount?: number;
  revenue?: number | null;
  giveaways?: number;
  checkIns?: number;
  currencyCode?: string;
};

export function DailySummary({
  dateLabel,
  salesCount = 0,
  revenue,
  giveaways = 0,
  checkIns = 0,
  currencyCode = '',
}: DailySummaryProps) {
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
      <AppText style={{ fontWeight: '700', color: colors.foreground }}>{dateLabel}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        <Metric label="Sales" value={String(salesCount)} />
        <Metric
          label="Revenue"
          value={revenue != null ? `${currencyCode} ${revenue.toFixed(0)}` : '—'}
        />
        <Metric label="Giveaways" value={String(giveaways)} />
        <Metric label="Check-ins" value={String(checkIns)} />
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
