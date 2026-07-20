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
  ProgressBar,
  SectionHeader,
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

function MoreReportRow({ title, icon, onPress }: Omit<ReportTileItem, 'key' | 'primary'>) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={({ pressed }) => ({
        minHeight: 48,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        marginBottom: spacing.sm,
        backgroundColor: pressed ? colors.muted : colors.card,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      })}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
      <AppText
        style={{
          flex: 1,
          fontSize: 16,
          fontWeight: '500',
          color: colors.foreground,
          flexShrink: 1,
        }}
      >
        {title}
      </AppText>
      <Ionicons name="chevron-forward" size={18} color={colors.secondaryForeground} />
    </Pressable>
  );
}

/**
 * Stock / More report entry points — SectionHeader + stacked CTAs / list rows.
 */
export function StockReportsLauncher({
  morning,
  evening,
  moreTiles = [],
}: {
  morning?: ReportTileItem | null;
  evening?: ReportTileItem | null;
  moreTiles?: ReportTileItem[];
}) {
  if (!morning && !evening && moreTiles.length === 0) return null;

  return (
    <View style={{ marginBottom: spacing.md }}>
      {morning || evening ? (
        <View style={{ marginBottom: spacing.lg }}>
          <SectionHeader title="Stock Reports" />
          <View style={{ gap: spacing.sm }}>
            {morning ? (
              <Button
                variant="tile"
                onPress={morning.onPress}
                icon={<Ionicons name="sunny-outline" size={20} color={colors.primaryForeground} />}
              >
                {`Morning — ${morning.title}`}
              </Button>
            ) : null}
            {evening ? (
              <Button
                variant="outline"
                onPress={evening.onPress}
                icon={<Ionicons name="moon-outline" size={20} color={colors.foreground} />}
              >
                {`Evening — ${evening.title}`}
              </Button>
            ) : null}
          </View>
        </View>
      ) : null}

      {moreTiles.length > 0 ? (
        <View>
          <SectionHeader title="More Reports" />
          {moreTiles.map((tile) => (
            <MoreReportRow
              key={tile.key}
              title={tile.title}
              icon={tile.icon}
              onPress={tile.onPress}
            />
          ))}
        </View>
      ) : null}
    </View>
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
    <Card style={{ marginBottom: spacing.md, padding: spacing.lg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.sm,
        }}
      >
        <Ionicons name={icon} size={22} color={colors.foreground} />
        <AppText variant="h3" style={{ fontWeight: '700', flexShrink: 1 }}>
          {title}
        </AppText>
      </View>
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
    <Card style={{ marginBottom: spacing.md, padding: spacing.lg }}>
      <SectionHeader title="Notes" />
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
        }}
      />
      <Button
        variant="outline"
        onPress={save}
        loading={saving}
        disabled={!notes.trim()}
        icon={<Ionicons name="document-text-outline" size={18} color={colors.foreground} />}
      >
        Save Notes
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

  return (
    <Card style={{ marginBottom: spacing.md, padding: spacing.lg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md,
        }}
      >
        <AppText
          variant="h3"
          style={{ flex: 1, fontWeight: '500', color: colors.foreground, flexShrink: 1 }}
        >
          Attach Images
        </AppText>
        <Pressable
          onPress={capture}
          disabled={cameraUploading}
          hitSlop={hitSlop}
          accessibilityLabel="Take photo"
          style={{
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
      </View>

      <AppText variant="secondary" style={{ marginBottom: spacing.sm, fontSize: 14 }}>
        Select images to upload
      </AppText>

      <Pressable
        onPress={browse}
        hitSlop={hitSlop}
        style={{
          minHeight: 48,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          justifyContent: 'center',
          backgroundColor: colors.muted,
        }}
      >
        <AppText variant="secondary" style={{ fontSize: 16 }}>
          {stagedUris.length === 0
            ? 'Browse... No files selected'
            : `${stagedUris.length} file${stagedUris.length === 1 ? '' : 's'} selected`}
        </AppText>
      </Pressable>

      {stagedUris.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
            marginTop: spacing.md,
          }}
        >
          {stagedUris.map((uri) => (
            <Image
              key={uri}
              source={{ uri }}
              style={{ width: 72, height: 72, borderRadius: radius.md }}
            />
          ))}
        </View>
      ) : null}

      {uploading ? (
        <View style={{ marginTop: spacing.md }}>
          <ProgressBar value={uploadProgress} />
          <AppText variant="secondary" style={{ textAlign: 'center', fontSize: 14 }}>
            {Math.round(uploadProgress * 100)}% uploaded
          </AppText>
        </View>
      ) : null}

      {stagedUris.length > 0 ? (
        <Button
          onPress={uploadStaged}
          loading={uploading}
          style={{ marginTop: spacing.md }}
          icon={
            <Ionicons name="cloud-upload-outline" size={18} color={colors.primaryForeground} />
          }
        >
          Upload Images
        </Button>
      ) : null}
    </Card>
  );
}
