import { useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '@/components/forms/FormField';
import {
  AppText,
  Button,
  Card,
  IconChip,
  ProgressBar,
} from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { colors, hitSlop, radius, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';
import { uploadReportImages } from '@/utils/reportImages';
import { reportAlert, submitNoteRow } from './shared';

export type ReportTileItem = {
  key: string;
  title: string;
  icon: IoniconName;
  primary?: boolean;
  onPress: () => void;
};

function CardTitle({
  icon,
  title,
  iconBackgroundColor = colors.muted,
  iconColor = colors.secondaryForeground,
}: {
  icon: IoniconName;
  title: string;
  iconBackgroundColor?: string;
  iconColor?: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm + 4,
        marginBottom: spacing.md,
      }}
    >
      <IconChip name={icon} backgroundColor={iconBackgroundColor} color={iconColor} />
      <AppText
        variant="h3"
        style={{ fontWeight: '600', color: colors.foreground, flex: 1, flexShrink: 1 }}
      >
        {title}
      </AppText>
    </View>
  );
}

const TILE_SIZE = 56;
const GRID_COLS = 3;
const TILE_ROW_GAP = spacing.lg;

function chunkTiles<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

/** Force two-line labels: "Morning Report" → "Morning\nReport". */
function twoLineLabel(title: string): string {
  const trimmed = title.trim();
  const idx = trimmed.indexOf(' ');
  if (idx <= 0) return trimmed;
  return `${trimmed.slice(0, idx)}\n${trimmed.slice(idx + 1)}`;
}

function ReportSquareTile({ title, icon, onPress }: Omit<ReportTileItem, 'key' | 'primary'>) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: TILE_SIZE,
          height: TILE_SIZE,
          borderRadius: radius.md,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
        }}
      >
        <Ionicons name={icon} size={28} color={colors.primaryForeground} />
      </View>
      <AppText
        style={{
          width: '100%',
          fontSize: 12,
          fontWeight: '500',
          color: colors.foreground,
          textAlign: 'center',
          lineHeight: 16,
          minHeight: 32,
        }}
        numberOfLines={2}
      >
        {twoLineLabel(title)}
      </AppText>
    </Pressable>
  );
}

/**
 * Reports card — flat grid of square icon launchers (no nested sections).
 */
export function StockReportsLauncher({
  morning,
  evening,
  price,
  moreTiles = [],
}: {
  morning?: ReportTileItem | null;
  evening?: ReportTileItem | null;
  price?: ReportTileItem | null;
  moreTiles?: ReportTileItem[];
}) {
  const tiles: ReportTileItem[] = [];
  if (morning) tiles.push(morning);
  if (evening) tiles.push(evening);
  if (price) tiles.push(price);
  tiles.push(...moreTiles);

  if (tiles.length === 0) return null;

  const rows = chunkTiles(tiles, GRID_COLS);

  return (
    <Card style={{ marginBottom: spacing.md }}>
      <CardTitle icon="clipboard-outline" title="Reports" />
      <View style={{ gap: TILE_ROW_GAP }}>
        {rows.map((row) => (
          <View
            key={row.map((t) => t.key).join('-')}
            style={{ flexDirection: 'row', alignItems: 'flex-start' }}
          >
            {row.map((tile) => (
              <ReportSquareTile
                key={tile.key}
                title={tile.title}
                icon={tile.icon}
                onPress={tile.onPress}
              />
            ))}
            {Array.from({ length: GRID_COLS - row.length }, (_, i) => (
              <View key={`pad-${i}`} style={{ flex: 1 }} />
            ))}
          </View>
        ))}
      </View>
    </Card>
  );
}

export function ReportLaunchCard({
  title,
  description,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  icon: IoniconName;
  onPress: () => void;
}) {
  return (
    <Card style={{ marginBottom: spacing.md }}>
      <CardTitle icon={icon} title={title} />
      <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
        {description}
      </AppText>
      <Button onPress={onPress}>{title}</Button>
    </Card>
  );
}

export function ReportsNotesCard() {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user) return;
    const trimmed = notes.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      const { synced } = await submitNoteRow({
        agent_id: user.id,
        content: trimmed,
      });
      reportAlert(synced);
      setNotes('');
    } catch {
      Alert.alert('Could not save notes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ marginBottom: spacing.md }}>
      <CardTitle icon="create-outline" title="Notes" />
      <FormField
        label=""
        value={notes}
        onChangeText={setNotes}
        placeholder="Add your notes here..."
        multiline
        numberOfLines={6}
        style={{
          height: undefined,
          minHeight: 140,
          textAlignVertical: 'top',
          paddingVertical: spacing.sm,
          fontSize: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: spacing.md,
        }}
      />
      <Button
        variant="outline"
        onPress={save}
        loading={saving}
        disabled={!notes.trim()}
        style={{ gap: spacing.sm }}
      >
        <Ionicons name="save-outline" size={18} color={colors.foreground} />
        <AppText style={{ fontSize: 16, fontWeight: '500', color: colors.foreground }}>
          Save Notes
        </AppText>
      </Button>
    </Card>
  );
}

export function ReportsImagesCard() {
  const { user } = useAuth();
  const [stagedUris, setStagedUris] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cameraUploading, setCameraUploading] = useState(false);

  const browse = async () => {
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
      setStagedUris((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const capture = async () => {
    if (!user) return;

    const camPerm = await ImagePicker.requestCameraPermissionsAsync();
    if (camPerm.status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take a photo.');
      return;
    }

    const locPerm = await Location.requestForegroundPermissionsAsync();
    let lat: number | null = null;
    let lng: number | null = null;
    if (locPerm.status === 'granted') {
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch {
        // Continue without location if unavailable.
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    setCameraUploading(true);
    try {
      const metadata: Record<string, string> = {};
      if (lat != null && lng != null) {
        metadata.lat = String(lat);
        metadata.lng = String(lng);
        metadata.location = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }

      const { uploaded, total } = await uploadReportImages(
        user.id,
        [result.assets[0].uri],
        metadata,
      );

      if (uploaded === total) {
        Alert.alert(
          'Photo uploaded',
          lat != null && lng != null
            ? `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
            : 'Photo saved.',
        );
      } else {
        Alert.alert('Upload failed', 'Could not upload the captured photo.');
      }
    } finally {
      setCameraUploading(false);
    }
  };

  const uploadStaged = async () => {
    if (!user || stagedUris.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      const { uploaded, total } = await uploadReportImages(
        user.id,
        stagedUris,
        undefined,
        (done, count) => setUploadProgress(count > 0 ? done / count : 0),
      );

      if (uploaded === total) {
        reportAlert(true);
        setStagedUris([]);
      } else {
        Alert.alert('Upload incomplete', `${uploaded} of ${total} images uploaded.`);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const THUMB = 72;

  return (
    <Card style={{ marginBottom: spacing.md, position: 'relative', overflow: 'visible' }}>
      <Pressable
        onPress={capture}
        disabled={cameraUploading}
        hitSlop={hitSlop}
        accessibilityLabel="Take photo"
        style={{
          position: 'absolute',
          top: spacing.md,
          right: spacing.md,
          zIndex: 2,
          width: 48,
          height: 48,
          borderRadius: radius.full,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: cameraUploading ? 0.6 : 1,
        }}
      >
        <Ionicons name="camera" size={22} color={colors.primaryForeground} />
      </Pressable>

      <View style={{ paddingRight: 56 }}>
        <CardTitle icon="image-outline" title="Attach Images" />
      </View>

      <AppText
        style={{
          fontSize: 14,
          fontWeight: '500',
          color: colors.foreground,
          marginBottom: spacing.sm,
        }}
      >
        Select images to upload
      </AppText>

      <Pressable
        onPress={browse}
        hitSlop={hitSlop}
        style={({ pressed }) => ({
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.border,
          borderRadius: radius.md,
          backgroundColor: pressed ? colors.muted : colors.card,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          marginBottom: spacing.md,
        })}
      >
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.sm,
            backgroundColor: colors.card,
            paddingVertical: spacing.sm + 2,
            paddingHorizontal: spacing.md,
            minHeight: 48,
            justifyContent: 'center',
          }}
        >
          <AppText variant="secondary" style={{ fontSize: 14 }}>
            {stagedUris.length === 0
              ? 'Browse... No files selected'
              : `${stagedUris.length} file${stagedUris.length === 1 ? '' : 's'} selected`}
          </AppText>
        </View>
      </Pressable>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        {stagedUris.map((uri) => (
          <Image
            key={uri}
            source={{ uri }}
            style={{ width: THUMB, height: THUMB, borderRadius: radius.md }}
          />
        ))}
        <Pressable
          onPress={browse}
          hitSlop={hitSlop}
          accessibilityLabel="Add images"
          style={({ pressed }) => ({
            width: THUMB,
            height: THUMB,
            borderRadius: radius.md,
            backgroundColor: pressed ? colors.border : colors.muted,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Ionicons name="add" size={28} color={colors.secondaryForeground} />
        </Pressable>
      </View>

      {uploading ? (
        <View style={{ marginBottom: spacing.md }}>
          <ProgressBar value={uploadProgress} />
          <AppText variant="secondary" style={{ textAlign: 'center', fontSize: 14 }}>
            {Math.round(uploadProgress * 100)}% uploaded
          </AppText>
        </View>
      ) : null}

      <Button
        variant="outline"
        onPress={uploadStaged}
        loading={uploading}
        disabled={stagedUris.length === 0}
        style={{ borderColor: colors.primary, gap: spacing.sm }}
      >
        <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
        <AppText style={{ fontSize: 16, fontWeight: '500', color: colors.primary }}>
          Upload Images
        </AppText>
      </Button>
    </Card>
  );
}
