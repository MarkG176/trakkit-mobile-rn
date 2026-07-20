// [CRM-0091] Activity — agent activity timeline
import { FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ComponentGate } from '@/components/ComponentGate';
import { ActivityCard } from '@/components/cards';
import { useAgentActivity } from '@/hooks/useAgentActivity';
import { EmptyMessage, LoadingSpinner, Screen } from '@/components/ui';
import { hitSlop, spacing } from '@/theme';

export default function ActivityScreen() {
  const router = useRouter();
  const { data = [], isLoading, isRefetching, refetch } = useAgentActivity(50);

  return (
    <ComponentGate code="CRM-0091">
      <Screen>
        {isLoading ? (
          <LoadingSpinner label="Loading activity" />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
            }
            ListEmptyComponent={<EmptyMessage>No activity yet.</EmptyMessage>}
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  router.push(`/(agent)/activity-detail?id=${item.id}` as never)
                }
                hitSlop={hitSlop}
                style={{ marginBottom: spacing.sm }}
              >
                <ActivityCard
                  title={item.title}
                  subtitle={item.subtitle}
                  timestamp={item.timestamp}
                  thumbnailUrl={item.thumbnailUrl}
                  status={item.type}
                />
              </Pressable>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.lg, flexGrow: 1 }}
          />
        )}
      </Screen>
    </ComponentGate>
  );
}
