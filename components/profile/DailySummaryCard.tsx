import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { formatCurrencyAmount, getCurrencyCodeFromCountry } from '@/utils/currency';
import { AppText, Card } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

interface DailySummaryCardProps {
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

function MetricTile({
  icon,
  value,
  label,
  sublabel,
  tint,
}: {
  icon: IoniconName;
  value: string | number;
  label: string;
  sublabel?: string;
  tint: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: '45%',
        borderRadius: 12,
        backgroundColor: colors.muted,
        padding: spacing.md,
        alignItems: 'center',
      }}
    >
      <Ionicons name={icon} size={24} color={tint} />
      <AppText variant="h2" style={{ color: tint, marginTop: spacing.xs }}>
        {value}
      </AppText>
      <AppText variant="secondary" style={{ textAlign: 'center', flexShrink: 1 }}>
        {label}
      </AppText>
      {sublabel ? (
        <AppText variant="secondary" style={{ color: tint, marginTop: 2, textAlign: 'center', flexShrink: 1 }}>
          {sublabel}
        </AppText>
      ) : null}
    </View>
  );
}

export function DailySummaryCard({
  storesAdded,
  sales,
  revenue,
  surveys,
  giveaways,
  giveawayItems,
  workMinutes,
}: DailySummaryCardProps) {
  const { currentProjectCountry } = useWorkspace();
  const currency = getCurrencyCodeFromCountry(currentProjectCountry);

  return (
    <Card style={{ marginBottom: spacing.md }}>
      <AppText variant="h3" style={{ textAlign: 'center', marginBottom: spacing.md, flexShrink: 1 }}>
        Today&apos;s Summary
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
        <MetricTile icon="storefront" value={storesAdded} label="Stores Added" tint={colors.primary} />
        <MetricTile
          icon="trending-up"
          value={sales}
          label="Sales Made"
          sublabel={formatCurrencyAmount(revenue, currency)}
          tint={colors.success}
        />
        <MetricTile icon="clipboard" value={surveys} label="Surveys Done" tint={colors.foreground} />
        <MetricTile
          icon="gift"
          value={giveaways}
          label="Giveaways"
          sublabel={`${giveawayItems} items`}
          tint={colors.warning}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          borderRadius: 12,
          backgroundColor: colors.muted,
          padding: spacing.md,
        }}
      >
        <Ionicons name="time-outline" size={22} color={colors.secondaryForeground} />
        <AppText style={{ fontWeight: '600' }}>{formatWorkTime(workMinutes)}</AppText>
        <AppText variant="secondary">worked today</AppText>
      </View>
    </Card>
  );
}
