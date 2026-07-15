// TODO: unused — confirm before deleting
import { ReactNode } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComponentGate } from '@/components/ComponentGate';
import { useDashboardData, type PerformanceData } from '@/hooks/useDashboardData';
import { AppText, Badge, Card, ProgressBar, SectionHeader } from '@/components/ui';
import { badge, colors, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

function MetricCard({
  icon,
  iconBg,
  iconColor,
  value,
  label,
  badgeLabel,
  badgeVariant,
  featured,
  children,
}: {
  icon: IoniconName;
  iconBg: string;
  iconColor: string;
  value: string | number;
  label: string;
  badgeLabel: string;
  badgeVariant: 'primary' | 'success' | 'warning' | 'outline';
  featured?: boolean;
  children?: ReactNode;
}) {
  return (
    <Card
      style={
        featured
          ? {
              borderColor: colors.primary,
              borderWidth: 2,
              paddingVertical: spacing.lg,
            }
          : undefined
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: children ? spacing.md : 0 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <AppText variant="h3">{value}</AppText>
            <Badge variant={badgeVariant}>{badgeLabel}</Badge>
          </View>
          <AppText variant="secondary" style={{ marginTop: 2 }}>
            {label}
          </AppText>
        </View>
      </View>
      {children}
    </Card>
  );
}

function PerformanceCardsContent({ data }: { data: PerformanceData }) {
  const salesProgress =
    data.salesTarget.target > 0 ? data.salesTarget.current / data.salesTarget.target : 0;

  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}>
      <SectionHeader title="Performance" />
      <View style={{ gap: spacing.md }}>
        <MetricCard
          icon="calendar"
          iconBg={colors.primaryLight}
          iconColor={colors.primary}
          value={data.tasksToday}
          label="Tasks for Today"
          badgeLabel="Today"
          badgeVariant="outline"
        />
        <MetricCard
          icon="checkmark-circle"
          iconBg={badge.success.backgroundColor as string}
          iconColor={colors.success}
          value={data.surveysCompleted}
          label="Surveys Completed"
          badgeLabel="Completed"
          badgeVariant="success"
        />
        <MetricCard
          icon="flag"
          iconBg={badge.warning.backgroundColor as string}
          iconColor={colors.warning}
          value={`${data.salesTarget.current} / ${data.salesTarget.target}`}
          label="Sales Target"
          badgeLabel={`${Math.round(salesProgress * 100)}%`}
          badgeVariant="warning"
          featured
        >
          <ProgressBar value={salesProgress} style={{ marginBottom: 0 }} />
        </MetricCard>
      </View>
    </View>
  );
}

export function PerformanceCards() {
  const { performanceData, loading } = useDashboardData();

  if (loading) {
    return (
      <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <PerformanceCardsContent data={performanceData} />;
}
