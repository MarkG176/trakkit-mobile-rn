// [CRM-0010] CheckInOutModal — start/stop store visit with GPS + selfie
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Camera, LogIn, LogOut, MapPin, RefreshCw, Store } from 'lucide-react-native';
import { AppText, Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { uploadCheckInPhoto } from '@/utils/agentPhotos';
import { colors, hitSlop, radius, spacing } from '@/theme';

type VisitStore = {
  id: string;
  name: string;
  county?: string | null;
  visitId?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
};

type RetryStep = 'idle' | 'location' | 'overlay' | 'upload' | 'save';

interface CheckInOutModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

async function captureLocationBalanced(): Promise<{
  latitude: number;
  longitude: number;
}> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied. Enable location to check in.');
  }

  const position = await Promise.race([
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Location request timed out after 10s. Please retry.')),
        10000,
      ),
    ),
  ]);

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

export function CheckInOutModal({
  visible,
  onClose,
  onComplete,
}: CheckInOutModalProps) {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [stores, setStores] = useState<VisitStore[]>([]);
  const [selected, setSelected] = useState<VisitStore | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedStep, setFailedStep] = useState<RetryStep>('idle');

  const today = new Date().toISOString().split('T')[0];

  const loadStores = useCallback(async () => {
    if (!user || !currentWorkspaceId) return;
    setLoadingList(true);
    try {
      const { data: visits } = await supabase
        .from('store_visits')
        .select(
          `
          id,
          store_id,
          check_in_time,
          check_out_time,
          stores:store_id ( id, store_name, county )
        `,
        )
        .eq('agent_id', user.id)
        .eq('planned_date', today)
        .eq('workspace_id', currentWorkspaceId)
        .order('visit_order', { ascending: true });

      if (visits?.length) {
        const mapped: VisitStore[] = visits.map((v: any) => {
          const store = Array.isArray(v.stores) ? v.stores[0] : v.stores;
          return {
            id: store?.id ?? v.store_id,
            name: store?.store_name ?? 'Store',
            county: store?.county,
            visitId: v.id,
            checkInTime: v.check_in_time,
            checkOutTime: v.check_out_time,
          };
        });
        setStores(mapped);
        const active = mapped.find((s) => s.checkInTime && !s.checkOutTime);
        setSelected(active ?? mapped[0] ?? null);
        return;
      }

      const { data: storeRows } = await supabase
        .from('stores')
        .select('id, store_name, county')
        .eq('workspace_id', currentWorkspaceId)
        .or('is_deleted.eq.false,is_deleted.is.null')
        .order('store_name')
        .limit(50);

      const mapped: VisitStore[] = (storeRows ?? []).map((s) => ({
        id: s.id,
        name: s.store_name,
        county: s.county,
      }));
      setStores(mapped);
      setSelected(mapped[0] ?? null);
    } catch (e) {
      console.error('Failed to load visit stores', e);
      setError('Could not load stores for check-in.');
    } finally {
      setLoadingList(false);
    }
  }, [user, currentWorkspaceId, today]);

  useEffect(() => {
    if (visible) {
      setSelfieUri(null);
      setError(null);
      setFailedStep('idle');
      loadStores();
    }
  }, [visible, loadStores]);

  const isCheckedIn = Boolean(selected?.checkInTime && !selected?.checkOutTime);
  const actionLabel = isCheckedIn ? 'Check Out' : 'Check In';

  const takeSelfie = async () => {
    setError(null);
    setFailedStep('idle');
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Camera overlay permission denied. Allow camera access to continue.');
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
        cameraType: ImagePicker.CameraType.front,
      });
      if (result.canceled || !result.assets[0]) {
        throw new Error('Camera overlay cancelled. Retake your selfie to continue.');
      }
      setSelfieUri(result.assets[0].uri);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Camera overlay failed. Please retry taking a selfie.';
      setError(message.includes('overlay') ? message : `Camera overlay error: ${message}`);
      setFailedStep('overlay');
    }
  };

  const persistVisit = async (
    location: { latitude: number; longitude: number },
    selfieUrl: string | null,
  ) => {
    if (!user || !currentWorkspaceId || !selected) {
      throw new Error('Missing user or store for visit save.');
    }

    const now = new Date().toISOString();

    if (isCheckedIn && selected.visitId) {
      const { error: updateError } = await supabase
        .from('store_visits')
        .update({
          check_out_time: now,
          status: 'completed',
          updated_at: now,
        })
        .eq('id', selected.visitId);
      if (updateError) throw updateError;
      return;
    }

    if (selected.visitId) {
      const { error: updateError } = await supabase
        .from('store_visits')
        .update({
          check_in_time: now,
          check_in_lat: location.latitude,
          check_in_lng: location.longitude,
          check_in_selfie_url: selfieUrl,
          status: 'in_progress',
          updated_at: now,
        })
        .eq('id', selected.visitId);
      if (updateError) throw updateError;
      return;
    }

    const { error: insertError } = await supabase.from('store_visits').insert({
      agent_id: user.id,
      store_id: selected.id,
      planned_date: today,
      check_in_time: now,
      check_in_lat: location.latitude,
      check_in_lng: location.longitude,
      check_in_selfie_url: selfieUrl,
      status: 'in_progress',
      workspace_id: currentWorkspaceId,
    });
    if (insertError) throw insertError;
  };

  const submit = async () => {
    if (!user || !selected) {
      setError('Select a store before checking in.');
      return;
    }
    if (!isCheckedIn && !selfieUri) {
      setError('Take a selfie via the camera overlay before checking in.');
      setFailedStep('overlay');
      return;
    }

    setSubmitting(true);
    setError(null);
    setFailedStep('idle');

    let location: { latitude: number; longitude: number } | null = null;
    let selfieUrl: string | null = null;

    try {
      try {
        location = await captureLocationBalanced();
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to read location. Please retry.';
        setError(message.includes('location') || message.includes('Location')
          ? message
          : `Location error: ${message}`);
        setFailedStep('location');
        return;
      }

      if (!isCheckedIn && selfieUri) {
        try {
          selfieUrl = await uploadCheckInPhoto(selfieUri, user.id);
          if (!selfieUrl) {
            throw new Error('Selfie upload failed. Please retry the upload.');
          }
        } catch (e) {
          const message =
            e instanceof Error ? e.message : 'Selfie upload failed. Please retry.';
          setError(message.includes('upload') ? message : `Upload error: ${message}`);
          setFailedStep('upload');
          return;
        }
      }

      try {
        await persistVisit(location, selfieUrl);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to save store visit.';
        setError(message);
        setFailedStep('save');
        return;
      }

      setSelfieUri(null);
      onComplete?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const retry = async () => {
    if (failedStep === 'overlay') {
      await takeSelfie();
      return;
    }
    await submit();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <AppText style={styles.title}>
            {isCheckedIn ? 'Store Check Out' : 'Store Check In'}
          </AppText>
          <AppText variant="secondary">
            Capture location and selfie to start or stop a store visit.
          </AppText>
        </View>

        {loadingList ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
            <AppText variant="secondary" style={{ marginTop: spacing.sm }}>
              Loading stores…
            </AppText>
          </View>
        ) : (
          <FlatList
            data={stores}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <AppText variant="secondary" style={styles.empty}>
                No stores available for today.
              </AppText>
            }
            renderItem={({ item }) => {
              const active = selected?.id === item.id;
              const checkedIn = Boolean(item.checkInTime && !item.checkOutTime);
              return (
                <Pressable
                  onPress={() => setSelected(item)}
                  hitSlop={hitSlop}
                  style={[styles.storeRow, active && styles.storeRowActive]}
                >
                  <Store size={20} color={active ? colors.primary : colors.mutedForeground} />
                  <View style={{ flex: 1 }}>
                    <AppText style={styles.storeName}>{item.name}</AppText>
                    {item.county ? (
                      <AppText variant="secondary" style={styles.meta}>
                        {item.county}
                      </AppText>
                    ) : null}
                  </View>
                  {checkedIn ? (
                    <View style={styles.badge}>
                      <AppText style={styles.badgeText}>IN</AppText>
                    </View>
                  ) : null}
                </Pressable>
              );
            }}
          />
        )}

        <View style={styles.footer}>
          {!isCheckedIn ? (
            <View style={styles.selfieBlock}>
              {selfieUri ? (
                <Image source={{ uri: selfieUri }} style={styles.selfie} />
              ) : (
                <View style={styles.selfiePlaceholder}>
                  <Camera size={28} color={colors.mutedForeground} />
                </View>
              )}
              <Button variant="outline" onPress={takeSelfie} icon={<Camera size={18} color={colors.primary} />}>
                {selfieUri ? 'Retake selfie' : 'Take selfie'}
              </Button>
            </View>
          ) : (
            <View style={styles.checkoutHint}>
              <MapPin size={18} color={colors.primary} />
              <AppText variant="secondary" style={{ flex: 1 }}>
                Checking out of {selected?.name ?? 'store'} — location will be captured.
              </AppText>
            </View>
          )}

          {error ? (
            <View style={styles.errorBox}>
              <AppText style={styles.errorText}>{error}</AppText>
              {failedStep !== 'idle' ? (
                <Button
                  variant="secondary"
                  onPress={retry}
                  icon={<RefreshCw size={16} color={colors.primary} />}
                >
                  Retry
                </Button>
              ) : null}
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button variant="outline" style={{ flex: 1 }} onPress={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              style={{ flex: 1 }}
              onPress={submit}
              loading={submitting}
              disabled={!selected || (!isCheckedIn && !selfieUri)}
              icon={
                isCheckedIn ? (
                  <LogOut size={18} color={colors.primaryForeground} />
                ) : (
                  <LogIn size={18} color={colors.primaryForeground} />
                )
              }
            >
              {actionLabel}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: spacing.xs },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  empty: { textAlign: 'center', marginTop: spacing.xl },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
  },
  storeRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  storeName: { fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 2 },
  badge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  footer: {
    padding: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  selfieBlock: { alignItems: 'center', gap: spacing.sm },
  selfie: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
  },
  selfiePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
  },
  errorBox: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#FDE8E8',
  },
  errorText: { color: colors.destructive, fontSize: 14 },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
