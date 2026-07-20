import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Card, LoadingSpinner, ProgressBar } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { workspaceService } from '@/services/workspaceService';
import { uploadAgentSelfies } from '@/utils/reportImages';
import { colors, hitSlop, radius, spacing } from '@/theme';
import { reportAlert, todayWorkDate } from './shared';

type SalesRow = {
  key: string;
  name: string;
  quantity: number;
  value: number;
};

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function SeedingEveningReportForm() {
  const { user } = useAuth();
  const { currentWorkspaceId, currentProjectId } = useWorkspace();
  const [rows, setRows] = useState<SalesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const currency = workspaceService.getProjectCurrencyCode();
  const workDate = todayWorkDate();

  useEffect(() => {
    if (!user || !currentWorkspaceId) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [trackingRes, purchasesRes] = await Promise.all([
        supabase
          .from('daily_sales_tracking')
          .select('product_variant_id, product_name, quantity_sold, total_value')
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('work_date', workDate),
        supabase
          .from('customer_purchases')
          .select('product_variant_id, quantity, total_value, product_variants(name, sku)')
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .gte('purchase_date', workDate)
          .lte('purchase_date', `${workDate}T23:59:59`),
      ]);

      if (cancelled) return;

      const merged = new Map<string, SalesRow>();

      for (const row of trackingRes.data ?? []) {
        if (!row.product_variant_id) continue;
        const existing = merged.get(row.product_variant_id);
        const qty = row.quantity_sold ?? 0;
        const val = row.total_value ?? 0;
        merged.set(row.product_variant_id, {
          key: row.product_variant_id,
          name: row.product_name ?? existing?.name ?? 'Product',
          quantity: (existing?.quantity ?? 0) + qty,
          value: (existing?.value ?? 0) + val,
        });
      }

      for (const row of purchasesRes.data ?? []) {
        if (!row.product_variant_id) continue;
        const variant = row.product_variants as { name?: string; sku?: string } | null;
        const existing = merged.get(row.product_variant_id);
        const qty = row.quantity ?? 0;
        const val = row.total_value ?? 0;
        merged.set(row.product_variant_id, {
          key: row.product_variant_id,
          name: variant?.name ?? existing?.name ?? 'Product',
          quantity: (existing?.quantity ?? 0) + qty,
          value: (existing?.value ?? 0) + val,
        });
      }

      setRows([...merged.values()].sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, currentWorkspaceId, workDate]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          quantity: acc.quantity + row.quantity,
          value: acc.value + row.value,
        }),
        { quantity: 0, value: 0 },
      ),
    [rows],
  );

  const pickPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to attach images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets.length) {
      setPhotoUris((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const removePhoto = (uri: string) => {
    setPhotoUris((prev) => prev.filter((item) => item !== uri));
  };

  const submit = async () => {
    if (!user) return;

    if (photoUris.length === 0) {
      Alert.alert('Photos required', 'Add at least one photo before submitting.');
      return;
    }

    const projectSlug = currentProjectId ?? 'default';
    setUploading(true);
    setUploadProgress(0);

    try {
      const { uploaded, total } = await uploadAgentSelfies(
        user.id,
        projectSlug,
        photoUris,
        (done, count) => setUploadProgress(count > 0 ? done / count : 0),
      );

      if (uploaded === total) {
        reportAlert(true);
        setPhotoUris([]);
      } else {
        Alert.alert('Upload incomplete', `${uploaded} of ${total} photos uploaded.`);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
      <AppText variant="h3" style={{ fontWeight: '700', marginBottom: spacing.sm }}>
        Seeding Evening Report
      </AppText>
      <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
        Review today&apos;s sales summary and upload evening photos.
      </AppText>

      {loading ? (
        <LoadingSpinner label="Loading sales" />
      ) : rows.length === 0 ? (
        <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
          No sales recorded today.
        </AppText>
      ) : (
        <View style={{ marginBottom: spacing.md }}>
          {rows.map((row) => (
            <View
              key={row.key}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <AppText style={{ flex: 1, flexShrink: 1, fontWeight: '500' }}>{row.name}</AppText>
              <AppText style={{ marginRight: spacing.md }}>{row.quantity}</AppText>
              <AppText>{formatCurrency(row.value, currency)}</AppText>
            </View>
          ))}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: spacing.md,
              marginTop: spacing.sm,
            }}
          >
            <AppText style={{ fontWeight: '700', flex: 1 }}>Total</AppText>
            <AppText style={{ fontWeight: '700', marginRight: spacing.md }}>{totals.quantity}</AppText>
            <AppText style={{ fontWeight: '700' }}>{formatCurrency(totals.value, currency)}</AppText>
          </View>
        </View>
      )}

      <AppText style={{ fontWeight: '600', marginBottom: spacing.sm }}>Photos</AppText>
      <Button variant="outline" onPress={pickPhotos} style={{ marginBottom: spacing.md }}>
        Add photos
      </Button>

      {photoUris.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
            marginBottom: spacing.md,
          }}
        >
          {photoUris.map((uri) => (
            <View key={uri} style={{ width: '23%', aspectRatio: 1 }}>
              <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: radius.md }} />
              <Pressable
                onPress={() => removePhoto(uri)}
                hitSlop={hitSlop}
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 22,
                  height: 22,
                  borderRadius: radius.full,
                  backgroundColor: colors.destructive,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {uploading ? (
        <View style={{ marginBottom: spacing.md }}>
          <ProgressBar value={uploadProgress} />
          <AppText variant="secondary" style={{ textAlign: 'center' }}>
            {Math.round(uploadProgress * 100)}% uploaded
          </AppText>
        </View>
      ) : null}

      <Button onPress={submit} loading={uploading} disabled={photoUris.length === 0}>
        Submit seeding report
      </Button>
    </Card>
  );
}
