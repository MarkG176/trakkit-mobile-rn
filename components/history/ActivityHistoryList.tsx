import { ReactNode, useMemo } from 'react';
import { Pressable, SectionList, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { format, parseISO } from 'date-fns';
import { AppText, Badge, EmptyMessage, LoadingSpinner } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { usePagination } from '@/hooks/usePagination';
import { groupItemsByDate } from '@/utils/groupByDate';
import { colors, hitSlop, radius, spacing } from '@/theme';

export type HistoryRow = {
  id: string;
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  timestamp: string;
  badge?: string | null;
  badgeVariant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
  leading?: ReactNode;
};

type Props = {
  items: HistoryRow[];
  loading?: boolean;
  emptyLabel?: string;
  onPressItem?: (item: HistoryRow) => void;
  itemsPerPage?: number;
};

function HistoryCard({
  item,
  onPress,
}: {
  item: HistoryRow;
  onPress?: (item: HistoryRow) => void;
}) {
  const timeLabel = (() => {
    try {
      return format(parseISO(item.timestamp), 'HH:mm');
    } catch {
      return '';
    }
  })();

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.md,
        minHeight: 72,
      }}
    >
      {item.leading ? (
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.sm,
            backgroundColor: colors.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {item.leading}
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <AppText style={{ fontWeight: '600', flex: 1 }} numberOfLines={1}>
            {item.title}
          </AppText>
          {item.badge ? (
            <Badge variant={item.badgeVariant ?? 'secondary'}>{item.badge}</Badge>
          ) : null}
        </View>
        {item.subtitle ? (
          <AppText variant="secondary" style={{ marginTop: 2 }} numberOfLines={1}>
            {item.subtitle}
          </AppText>
        ) : null}
        <AppText variant="secondary" style={{ fontSize: 12, marginTop: 4 }}>
          {[timeLabel, item.meta].filter(Boolean).join(' · ')}
        </AppText>
      </View>
      {onPress ? <ChevronRight size={18} color={colors.mutedForeground} /> : null}
    </View>
  );

  if (!onPress) return <View style={{ marginBottom: spacing.sm }}>{content}</View>;

  return (
    <Pressable
      onPress={() => onPress(item)}
      hitSlop={hitSlop}
      style={{ marginBottom: spacing.sm }}
    >
      {content}
    </Pressable>
  );
}

export function ActivityHistoryList({
  items,
  loading,
  emptyLabel = 'No records yet.',
  onPressItem,
  itemsPerPage = 15,
}: Props) {
  const {
    paginatedItems,
    totalPages,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex,
    totalItems,
  } = usePagination({ items, itemsPerPage });

  const sections = useMemo(
    () => groupItemsByDate(paginatedItems, (item) => item.timestamp),
    [paginatedItems],
  );

  if (loading) {
    return <LoadingSpinner label="Loading" />;
  }

  if (items.length === 0) {
    return <EmptyMessage>{emptyLabel}</EmptyMessage>;
  }

  return (
    <View style={{ flex: 1 }}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <AppText
            variant="secondary"
            style={{
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontSize: 12,
              fontWeight: '600',
              marginBottom: spacing.sm,
              marginTop: spacing.sm,
            }}
          >
            {section.title}
          </AppText>
        )}
        renderItem={({ item }) => <HistoryCard item={item} onPress={onPressItem} />}
        ListFooterComponent={
          totalPages > 1 ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: spacing.md,
                gap: spacing.sm,
              }}
            >
              <Button variant="outline" size="sm" disabled={!hasPrevPage} onPress={prevPage}>
                Prev
              </Button>
              <AppText variant="secondary" style={{ fontSize: 12 }}>
                {startIndex}–{endIndex} of {totalItems}
              </AppText>
              <Button variant="outline" size="sm" disabled={!hasNextPage} onPress={nextPage}>
                Next
              </Button>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: spacing.lg }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
