// [CRM-0120] Supervisor Gallery — selfie grid via useGalleryImages
import { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { format } from 'date-fns';
import { Images, X } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { DateRangeChips } from '@/components/supervisor/DateRangeChips';
import {
  AppText,
  Badge,
  EmptyMessage,
  LoadingSpinner,
  Screen,
} from '@/components/ui';
import { useGalleryImages } from '@/hooks/useAgentActivity';
import { useDateRangeFilter } from '@/hooks/useDateRangeFilter';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { colors, hitSlop, radius, spacing } from '@/theme';

const GAP = spacing.sm;
const COLS = 2;
const TILE =
  (Dimensions.get('window').width - spacing.md * 2 - GAP * (COLS - 1)) / COLS;

type GalleryRow = {
  id: string;
  agent_display_name: string | null;
  selfie_url: string | null;
  timestamp: string;
  status: string;
};

export default function GalleryScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const { preset, setPreset, startISO, endISO } = useDateRangeFilter('today');
  const [selected, setSelected] = useState<GalleryRow | null>(null);

  const { data: photos = [], isLoading } = useGalleryImages(
    currentWorkspaceId,
    startISO,
    endISO,
  );

  const items = useMemo(
    () => (photos as GalleryRow[]).filter((p) => Boolean(p.selfie_url)),
    [photos],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: GalleryRow; index: number }) => {
      const taller = index % 3 === 0;
      return (
        <Pressable
          onPress={() => setSelected(item)}
          hitSlop={hitSlop}
          style={[styles.tile, { height: taller ? TILE * 1.25 : TILE }]}
        >
          <Image source={{ uri: item.selfie_url! }} style={styles.image} />
          <View style={styles.overlay}>
            <AppText style={styles.overlayText} numberOfLines={1}>
              {item.agent_display_name || 'Agent'}
            </AppText>
          </View>
        </Pressable>
      );
    },
    [],
  );

  return (
    <ComponentGate code="CRM-0120">
      <Screen showBack style={styles.screen}>
        <View style={styles.header}>
          <Images size={20} color={colors.primary} />
          <AppText style={styles.headerTitle}>Gallery</AppText>
          <Badge variant="secondary">{String(items.length)}</Badge>
        </View>
        <DateRangeChips preset={preset} onChange={setPreset} />

        {isLoading ? (
          <LoadingSpinner label="Loading photos" />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            numColumns={COLS}
            columnWrapperStyle={styles.row}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<EmptyMessage>No photos in this range.</EmptyMessage>}
          />
        )}

        <Modal
          visible={!!selected}
          animationType="fade"
          transparent
          onRequestClose={() => setSelected(null)}
        >
          <View style={styles.backdrop}>
            <Pressable style={styles.closeFab} onPress={() => setSelected(null)} hitSlop={hitSlop}>
              <X size={24} color={colors.primaryForeground} />
            </Pressable>
            {selected?.selfie_url ? (
              <Image
                source={{ uri: selected.selfie_url }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            ) : null}
            <View style={styles.caption}>
              <AppText style={styles.captionTitle}>
                {selected?.agent_display_name || 'Agent'}
              </AppText>
              {selected?.timestamp ? (
                <AppText style={styles.captionSub}>
                  {format(new Date(selected.timestamp), 'MMM d, yyyy · HH:mm')}
                </AppText>
              ) : null}
            </View>
          </View>
        </Modal>
      </Screen>
    </ComponentGate>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerTitle: { flex: 1, fontWeight: '600', fontSize: 16 },
  list: { paddingBottom: spacing.xl, flexGrow: 1 },
  row: { gap: GAP, marginBottom: GAP },
  tile: {
    width: TILE,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },
  image: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  overlayText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
  },
  closeFab: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.md,
    zIndex: 2,
    padding: spacing.sm,
  },
  fullImage: { width: '100%', height: '70%' },
  caption: { padding: spacing.lg, alignItems: 'center' },
  captionTitle: { color: '#fff', fontWeight: '600', fontSize: 16 },
  captionSub: { color: 'rgba(255,255,255,0.75)', marginTop: spacing.xs },
});
