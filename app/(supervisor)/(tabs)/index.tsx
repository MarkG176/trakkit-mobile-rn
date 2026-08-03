import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import {
  useAgentActivities,
  useGalleryImages,
  useMostRecentActivityDate,
  useWorkspaceTeams,
  type AgentActivity,
} from '@/hooks/useAgentActivity';
import { AgentStatusItem, ImageLightbox } from '@/components/shared/CatalogCards';
import { UserDetailSheet } from '@/components/supervisor/UserDetailSheet';
import {
  AppText,
  Badge,
  Button,
  EmptyMessage,
  Input,
  LoadingSpinner,
  SectionHeader,
} from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';

type TabKey = 'feed' | 'gallery';

export default function SupervisorDashboard() {
  const { currentWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const { data: mostRecentDate } = useMostRecentActivityDate(currentWorkspaceId);
  const { data: teams = [] } = useWorkspaceTeams(currentWorkspaceId);

  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [filterTeamId, setFilterTeamId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<TabKey>('feed');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCaption, setSelectedCaption] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedAgentName, setSelectedAgentName] = useState<string | null>(null);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (mostRecentDate && !filterDate) setFilterDate(mostRecentDate);
  }, [mostRecentDate, filterDate]);

  const { data: activitiesResult, isLoading } = useAgentActivities(
    currentWorkspaceId,
    page,
    filterDate,
    searchQuery,
    filterTeamId,
  );
  const activities = activitiesResult?.data ?? [];
  const totalCount = activitiesResult?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 50));

  const { data: galleryImages = [] } = useGalleryImages(currentWorkspaceId, filterDate);

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = filterDate === todayStr;

  const invalidateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!currentWorkspaceId || !isToday) return;

    const scheduleInvalidate = () => {
      if (invalidateTimerRef.current) clearTimeout(invalidateTimerRef.current);
      invalidateTimerRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['agent-activities'] });
        queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
      }, 1500);
    };

    const channel = supabase
      .channel(`supervisor-status-${currentWorkspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_status_log',
          filter: `workspace_id=eq.${currentWorkspaceId}`,
        },
        () => scheduleInvalidate(),
      )
      .subscribe();

    return () => {
      if (invalidateTimerRef.current) clearTimeout(invalidateTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [currentWorkspaceId, isToday, queryClient]);

  const shiftDate = (delta: number) => {
    const base = filterDate ? new Date(`${filterDate}T12:00:00`) : new Date();
    base.setDate(base.getDate() + delta);
    setFilterDate(format(base, 'yyyy-MM-dd'));
    setPage(0);
  };

  const selectedTeamName =
    filterTeamId == null
      ? 'All Teams'
      : teams.find((t) => t.id === filterTeamId)?.name ?? 'All Teams';

  return (
    <ComponentGate code="CRM-0118" redirectTo={"/(agent)" as never}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Pressable
              onPress={() => setShowDatePicker((v) => !v)}
              hitSlop={hitSlop}
              style={{
                minHeight: 44,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
                paddingHorizontal: spacing.md,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.foreground} />
              <AppText style={{ fontWeight: '500' }}>
                {filterDate
                  ? format(new Date(`${filterDate}T12:00:00`), 'MMM d, yyyy')
                  : 'Pick date'}
              </AppText>
            </Pressable>
            <Button
              size="sm"
              variant={isToday ? 'primary' : 'outline'}
              onPress={() => {
                setFilterDate(todayStr);
                setPage(0);
              }}
            >
              Today
            </Button>
            <Badge variant="secondary">{`${totalCount} entries`}</Badge>
          </View>

          {showDatePicker ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing.sm,
              }}
            >
              <Button size="sm" variant="outline" onPress={() => shiftDate(-1)}>
                Previous day
              </Button>
              <Button size="sm" variant="outline" onPress={() => shiftDate(1)}>
                Next day
              </Button>
            </View>
          ) : null}

          {teams.length > 0 ? (
            <View>
              <Pressable
                onPress={() => setShowTeamPicker((v) => !v)}
                hitSlop={hitSlop}
                style={{
                  minHeight: 48,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  paddingHorizontal: spacing.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                }}
              >
                <Ionicons name="people-outline" size={18} color={colors.mutedForeground} />
                <AppText style={{ flex: 1 }}>{selectedTeamName}</AppText>
                <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
              </Pressable>
              {showTeamPicker ? (
                <View
                  style={{
                    marginTop: spacing.xs,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    backgroundColor: colors.card,
                    overflow: 'hidden',
                  }}
                >
                  <TeamOption
                    label="All Teams"
                    selected={filterTeamId == null}
                    onPress={() => {
                      setFilterTeamId(null);
                      setPage(0);
                      setShowTeamPicker(false);
                    }}
                  />
                  {teams.map((team) => (
                    <TeamOption
                      key={team.id}
                      label={team.name || 'Team'}
                      selected={filterTeamId === team.id}
                      onPress={() => {
                        setFilterTeamId(team.id);
                        setPage(0);
                        setShowTeamPicker(false);
                      }}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}

          <Input
            placeholder="Search by name, email or outlet..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setPage(0);
            }}
            containerStyle={{ marginBottom: 0 }}
          />

          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.muted,
              borderRadius: radius.md,
              padding: 4,
            }}
          >
            <TabButton active={tab === 'feed'} label="Activity Feed" onPress={() => setTab('feed')} />
            <TabButton
              active={tab === 'gallery'}
              label={`Selfies (${galleryImages.length})`}
              onPress={() => setTab('gallery')}
            />
          </View>

          {tab === 'feed' ? (
            <View>
              <SectionHeader title="Live agent activity" />
              {isLoading ? (
                <LoadingSpinner label="Loading activity" />
              ) : activities.length === 0 ? (
                <EmptyMessage>No activity found for this date.</EmptyMessage>
              ) : (
                <>
                  {activities.map((a: AgentActivity) => (
                    <AgentStatusItem
                      key={a.id}
                      agentName={a.agent_display_name || 'Unknown Agent'}
                      status={a.status}
                      timeLabel={format(new Date(a.timestamp), 'h:mm a')}
                      selfieUrl={a.selfie_url}
                      storeName={a.store_name}
                      inRange={a.in_range}
                      distanceFromAssigned={a.distance_from_assigned}
                      locationLat={a.location_lat}
                      locationLng={a.location_lng}
                      onPress={() => {
                        setSelectedAgentId(a.agent_id);
                        setSelectedAgentName(a.agent_display_name);
                      }}
                      onSelfiePress={(url) => {
                        setSelectedImage(url);
                        setSelectedCaption(a.agent_display_name);
                      }}
                    />
                  ))}
                  {totalPages > 1 ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: spacing.sm,
                      }}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page === 0}
                        onPress={() => setPage((p) => Math.max(0, p - 1))}
                      >
                        Previous
                      </Button>
                      <AppText variant="secondary">
                        Page {page + 1} of {totalPages}
                      </AppText>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={page >= totalPages - 1}
                        onPress={() => setPage((p) => p + 1)}
                      >
                        Next
                      </Button>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          ) : (
            <View>
              {galleryImages.length === 0 ? (
                <EmptyMessage>No selfies for this date.</EmptyMessage>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {galleryImages.map((img) => (
                    <Pressable
                      key={img.id}
                      onPress={() => {
                        if (!img.selfie_url) return;
                        setSelectedImage(img.selfie_url);
                        setSelectedCaption(img.agent_display_name);
                      }}
                      style={{ width: '31%', aspectRatio: 1 }}
                    >
                      <View style={{ flex: 1, borderRadius: radius.md, overflow: 'hidden' }}>
                        {img.selfie_url ? (
                          <Image
                            source={{ uri: img.selfie_url }}
                            style={{ width: '100%', height: '100%' }}
                          />
                        ) : null}
                        <View
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            paddingHorizontal: 4,
                            paddingVertical: 2,
                          }}
                        >
                          <AppText
                            numberOfLines={1}
                            style={{ color: '#fff', fontSize: 11 }}
                          >
                            {img.agent_display_name || 'Agent'}
                          </AppText>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <ImageLightbox
          uri={selectedImage}
          caption={selectedCaption}
          onClose={() => {
            setSelectedImage(null);
            setSelectedCaption(null);
          }}
        />

        {selectedAgentId ? (
          <UserDetailSheet
            open={!!selectedAgentId}
            onClose={() => {
              setSelectedAgentId(null);
              setSelectedAgentName(null);
            }}
            userId={selectedAgentId}
            displayName={selectedAgentName}
          />
        ) : null}
      </View>
    </ComponentGate>
  );
}

function TabButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={{
        flex: 1,
        minHeight: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.sm,
        backgroundColor: active ? colors.card : 'transparent',
      }}
    >
      <AppText style={{ fontWeight: active ? '700' : '500', fontSize: 13 }}>{label}</AppText>
    </Pressable>
  );
}

function TeamOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={{
        minHeight: 48,
        paddingHorizontal: spacing.md,
        justifyContent: 'center',
        backgroundColor: selected ? colors.primaryLight : colors.card,
      }}
    >
      <AppText style={{ fontWeight: selected ? '600' : '400' }}>{label}</AppText>
    </Pressable>
  );
}
