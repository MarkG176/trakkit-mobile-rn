import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '@/components/forms/FormField';
import { AppText, Button, Card } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { uploadReportImage } from '@/utils/uploadStoreImage';
import { colors, hitSlop, radius, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';
import { stockReport } from './shared';

const NOTES_KEY = 'trakkit_report_notes_draft';

export type ReportTileItem = {
  key: string;
  title: string;
  icon: IoniconName;
  primary?: boolean;
  onPress: () => void;
};

/** Tall vertical CTA matching trakkit-mobile StockReportsSection Morning/Evening buttons. */
function StockLaunchButton({
  title,
  icon,
  variant,
  onPress,
}: {
  title: string;
  icon: IoniconName;
  variant: 'primary' | 'secondary';
  onPress: () => void;
}) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={({ pressed }) => ({
        minHeight: 88,
        borderRadius: radius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.sm,
        backgroundColor: isPrimary
          ? pressed
            ? '#009199'
            : stockReport.primary
          : pressed
            ? colors.muted
            : colors.muted,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
      })}
    >
      <Ionicons
        name={icon}
        size={24}
        color={isPrimary ? colors.primaryForeground : colors.foreground}
      />
      <AppText
        style={{
          fontWeight: '500',
          fontSize: stockReport.labelSize,
          textAlign: 'center',
          color: isPrimary ? colors.primaryForeground : stockReport.heading,
        }}
      >
        {title}
      </AppText>
    </Pressable>
  );
}

function MoreReportTile({ title, icon, onPress }: Omit<ReportTileItem, 'key' | 'primary'>) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={({ pressed }) => ({
        flexGrow: 1,
        flexBasis: '47%',
        maxWidth: '48%',
        minHeight: 72,
        borderWidth: 1,
        borderColor: stockReport.border,
        borderRadius: radius.md,
        padding: spacing.md,
        backgroundColor: pressed ? stockReport.panel : colors.card,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      })}
    >
      <Ionicons name={icon} size={22} color={stockReport.primary} />
      <AppText
        style={{
          fontWeight: '500',
          fontSize: stockReport.labelSize,
          color: stockReport.heading,
          flex: 1,
          flexShrink: 1,
        }}
      >
        {title}
      </AppText>
    </Pressable>
  );
}

/**
 * Mirrors trakkit-mobile StockReportsSection:
 * Card "Stock Reports" + Morning/Evening tall CTAs in muted panels.
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

  const bothColumns = Boolean(morning && evening);

  return (
    <>
      {morning || evening ? (
        <Card style={{ marginBottom: spacing.md, padding: spacing.lg }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: spacing.lg,
            }}
          >
            <Ionicons name="cube-outline" size={22} color={stockReport.heading} />
            <AppText
              variant="h3"
              style={{ fontWeight: '700', color: stockReport.heading, flexShrink: 1 }}
            >
              Stock Reports
            </AppText>
          </View>

          <View
            style={{
              flexDirection: 'row',
              gap: spacing.md,
            }}
          >
            {morning ? (
              <View
                style={{
                  flex: bothColumns ? 1 : undefined,
                  width: bothColumns ? undefined : '100%',
                  borderWidth: 1,
                  borderColor: stockReport.border,
                  borderRadius: radius.md,
                  backgroundColor: stockReport.panel,
                  padding: spacing.md,
                  gap: spacing.sm,
                }}
              >
                <AppText
                  style={{
                    fontWeight: '500',
                    fontSize: stockReport.labelSize,
                    color: stockReport.heading,
                    marginBottom: spacing.xs,
                  }}
                >
                  Morning
                </AppText>
                <StockLaunchButton
                  title={morning.title}
                  icon="sunny-outline"
                  variant="primary"
                  onPress={morning.onPress}
                />
              </View>
            ) : null}

            {evening ? (
              <View
                style={{
                  flex: bothColumns ? 1 : undefined,
                  width: bothColumns ? undefined : '100%',
                  borderWidth: 1,
                  borderColor: stockReport.border,
                  borderRadius: radius.md,
                  backgroundColor: stockReport.panel,
                  padding: spacing.md,
                  gap: spacing.sm,
                }}
              >
                <AppText
                  style={{
                    fontWeight: '500',
                    fontSize: stockReport.labelSize,
                    color: stockReport.heading,
                    marginBottom: spacing.xs,
                  }}
                >
                  Evening
                </AppText>
                <StockLaunchButton
                  title={evening.title}
                  icon="moon-outline"
                  variant="secondary"
                  onPress={evening.onPress}
                />
              </View>
            ) : null}
          </View>
        </Card>
      ) : null}

      {moreTiles.length > 0 ? (
        <Card style={{ marginBottom: spacing.md, padding: spacing.lg }}>
          <AppText
            variant="h3"
            style={{
              fontWeight: '700',
              color: stockReport.heading,
              marginBottom: spacing.md,
              flexShrink: 1,
            }}
          >
            More Reports
          </AppText>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.sm,
              justifyContent: 'space-between',
            }}
          >
            {moreTiles.map((tile) => (
              <MoreReportTile
                key={tile.key}
                title={tile.title}
                icon={tile.icon}
                onPress={tile.onPress}
              />
            ))}
          </View>
        </Card>
      ) : null}
    </>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
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
  const { currentWorkspaceId } = useWorkspace();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(NOTES_KEY)
      .then((stored) => {
        if (stored) setNotes(stored);
      })
      .catch(() => undefined);
  }, []);

  const save = async () => {
    if (!notes.trim()) {
      Alert.alert('Please enter some notes');
      return;
    }
    if (!user || !currentWorkspaceId) {
      Alert.alert('No workspace selected');
      return;
    }

    setSaving(true);
    try {
      await AsyncStorage.setItem(NOTES_KEY, notes);
      const { error } = await supabase.from('notes').insert({
        agent_id: user.id,
        workspace_id: currentWorkspaceId,
        content: notes.trim(),
      });
      if (error) throw error;
      Alert.alert('Notes saved');
      setNotes('');
      await AsyncStorage.removeItem(NOTES_KEY);
    } catch (err) {
      console.error('Could not save notes', err);
      Alert.alert('Could not save notes', 'Draft kept on device.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={{ marginBottom: spacing.md, padding: spacing.lg }}>
      <AppText
        variant="h3"
        style={{ fontWeight: '700', color: stockReport.heading, marginBottom: spacing.md }}
      >
        Notes
      </AppText>
      <FormField
        label=""
        value={notes}
        onChangeText={setNotes}
        placeholder="Add your notes here..."
        multiline
        numberOfLines={4}
        style={{ height: undefined, minHeight: 100, textAlignVertical: 'top', paddingVertical: spacing.sm }}
      />
      <Button
        variant="outline"
        onPress={save}
        loading={saving}
        icon={<Ionicons name="document-text-outline" size={18} color={colors.foreground} />}
      >
        Save Notes
      </Button>
    </Card>
  );
}

export function ReportsImagesCard() {
  const { user } = useAuth();
  const [uris, setUris] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

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
      setUris((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const capture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setUris((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const upload = async () => {
    if (!user || uris.length === 0) {
      Alert.alert('Please select images to upload');
      return;
    }
    setUploading(true);
    try {
      const results = await Promise.all(uris.map((uri) => uploadReportImage(uri, user.id)));
      const failed = results.filter((url) => !url).length;
      if (failed === results.length) {
        Alert.alert('Upload failed', 'Could not upload images to storage.');
      } else if (failed > 0) {
        Alert.alert('Partial upload', `${results.length - failed} uploaded, ${failed} failed.`);
        setUris([]);
      } else {
        Alert.alert('Images uploaded');
        setUris([]);
      }
    } catch (err) {
      console.error('Upload error', err);
      Alert.alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card style={{ marginBottom: spacing.md, padding: spacing.lg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        }}
      >
        <AppText
          variant="h3"
          style={{ fontWeight: '700', color: stockReport.heading, flexShrink: 1 }}
        >
          Attach Images
        </AppText>
        <Pressable
          onPress={capture}
          hitSlop={hitSlop}
          accessibilityLabel="Take photo"
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.full,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="camera" size={22} color={colors.primaryForeground} />
        </Pressable>
      </View>

      <AppText variant="secondary" style={{ marginBottom: spacing.sm }}>
        Select images to upload
      </AppText>

      <Pressable
        onPress={browse}
        hitSlop={hitSlop}
        style={{
          minHeight: 48,
          borderWidth: 1,
          borderColor: stockReport.border,
          borderRadius: radius.lg,
          paddingHorizontal: spacing.md,
          justifyContent: 'center',
          backgroundColor: stockReport.panel,
        }}
      >
        <AppText variant="secondary" style={{ fontSize: stockReport.labelSize }}>
          {uris.length === 0
            ? 'Browse... No files selected'
            : `${uris.length} file${uris.length === 1 ? '' : 's'} selected`}
        </AppText>
      </Pressable>

      {uris.length > 0 ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
            {uris.map((uri) => (
              <Image
                key={uri}
                source={{ uri }}
                style={{ width: 72, height: 72, borderRadius: radius.md }}
              />
            ))}
          </View>
          <Button
            variant="outline"
            onPress={upload}
            loading={uploading}
            style={{ marginTop: spacing.md }}
            icon={<Ionicons name="cloud-upload-outline" size={18} color={colors.foreground} />}
          >
            Upload Images
          </Button>
        </>
      ) : null}
    </Card>
  );
}
