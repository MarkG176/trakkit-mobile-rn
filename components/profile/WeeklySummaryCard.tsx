import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { formatCurrencyAmount, getCurrencyCodeFromCountry } from '@/utils/currency';
import { AppText, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

interface WeeklySummaryCardProps {
  storesAdded: number;
  sales: number;
  revenue: number;
  surveys: number;
  giveaways: number;
  giveawayItems: number;
  workMinutes: number;
}

function formatWorkTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function WeekMetric({ icon, value, label }: { icon: IoniconName; value: number; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', minWidth: 70 }}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <AppText variant="h3" style={{ marginTop: 4 }}>
        {value}
      </AppText>
      <AppText variant="secondary" style={{ textAlign: 'center', flexShrink: 1 }}>
        {label}
      </AppText>
    </View>
  );
}

export function WeeklySummaryCard({
  storesAdded,
  sales,
  revenue,
  surveys,
  giveaways,
  workMinutes,
}: WeeklySummaryCardProps) {
  const { currentProjectCountry } = useWorkspace();
  const currency = getCurrencyCodeFromCountry(currentProjectCountry);

  return (
    <Card style={{ marginBottom: spacing.md }}>
      <AppText variant="h3" style={{ textAlign: 'center', marginBottom: spacing.md, flexShrink: 1 }}>
        This Week
      </AppText>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
        <WeekMetric icon="storefront" value={storesAdded} label="Stores" />
        <WeekMetric icon="trending-up" value={sales} label="Sales" />
        <WeekMetric icon="clipboard" value={surveys} label="Surveys" />
        <WeekMetric icon="gift" value={giveaways} label="Giveaways" />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 }}>
          <Ionicons name="time-outline" size={16} color={colors.secondaryForeground} />
          <AppText variant="secondary">{formatWorkTime(workMinutes)}</AppText>
        </View>
        <AppText style={{ color: colors.success, fontWeight: '600', flexShrink: 1 }}>
          {formatCurrencyAmount(revenue, currency)}
        </AppText>
      </View>
    </Card>
  );
}
