// [CRM-0096] Log Interaction — free-text notes with optional expo-av audio
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { Mic, Square, Trash2 } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { Screen, AppText, Button, Input } from '@/components/ui';
import { useInteractionForm } from '@/hooks/useInteractionForm';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { colors, hitSlop, radius, spacing } from '@/theme';

type AvRecording = {
  stopAndUnloadAsync(): Promise<void>;
  getURI(): string | null;
};

async function loadExpoAv() {
  if (Platform.OS === 'web') return null;
  try {
    return await import('expo-av');
  } catch (error) {
    console.warn('expo-av unavailable:', error);
    return null;
  }
}

function decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export default function LogInteractionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { submitInteraction, loading } = useInteractionForm();

  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const recordingRef = useRef<AvRecording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isRecording) {
      pulse.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.35,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [isRecording, pulse]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      void recordingRef.current?.stopAndUnloadAsync().catch(() => undefined);
    };
  }, []);

  const startRecording = async () => {
    try {
      const av = await loadExpoAv();
      if (!av) {
        Alert.alert('Unavailable', 'Audio recording is not available on this device.');
        return;
      }
      const permission = await av.Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone denied', 'Allow mic access to record audio.');
        return;
      }
      await av.Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new av.Audio.Recording();
      await recording.prepareToRecordAsync(av.Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setDuration(0);
      setRecordingUri(null);
      setRecordingUrl(null);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (e) {
      console.error('Recording start failed', e);
      Alert.alert('Recording error', 'Could not start audio recording.');
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const recording = recordingRef.current;
      if (!recording) return null;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      setRecordingUri(uri);
      return uri;
    } catch (e) {
      console.error('Recording stop failed', e);
      setIsRecording(false);
      return null;
    }
  };

  const uploadRecording = async (uri: string): Promise<string | null> => {
    if (!user) return null;
    setUploading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const path = `${user.id}/${Date.now()}.m4a`;
      const { error } = await supabase.storage
        .from('sale-recordings')
        .upload(path, decode(base64), {
          contentType: 'audio/m4a',
          upsert: false,
        });
      if (error) throw error;
      const { data } = supabase.storage.from('sale-recordings').getPublicUrl(path);
      setRecordingUrl(data.publicUrl);
      return data.publicUrl;
    } catch (e) {
      console.error('Audio upload failed', e);
      Alert.alert('Upload failed', 'Could not upload recording.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const resetRecording = () => {
    setRecordingUri(null);
    setRecordingUrl(null);
    setDuration(0);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const submit = async () => {
    if (!notes.trim() && !customerName.trim()) {
      Alert.alert('Missing details', 'Add notes or a customer name.');
      return;
    }

    let url = recordingUrl;
    if (isRecording) {
      const uri = await stopRecording();
      if (uri) url = await uploadRecording(uri);
    } else if (recordingUri && !recordingUrl) {
      url = await uploadRecording(recordingUri);
    }

    const ok = await submitInteraction({
      interactionType: 'other',
      customerName: customerName.trim() || 'Walk-in Customer',
      notes: notes.trim(),
      sentiment: 0,
      recordingUrl: url || undefined,
    });

    if (ok) {
      Alert.alert('Interaction logged', 'Saved successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  return (
    <ComponentGate code="CRM-0096" redirectTo="/(agent)">
      <Screen scroll showBack>
        <Input
          label="Customer name"
          value={customerName}
          onChangeText={setCustomerName}
          placeholder="Enter customer name"
        />
        <Input
          label="Interaction notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Add details about the interaction…"
          multiline
          numberOfLines={4}
          style={styles.notes}
        />

        <AppText style={styles.section}>Recording</AppText>
        <View style={styles.recordCard}>
          {isRecording ? (
            <View style={styles.waveform}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.bar,
                    {
                      height: 12 + i * 6,
                      transform: [{ scaleY: pulse }],
                    },
                  ]}
                />
              ))}
              <AppText style={styles.duration}>{formatDuration(duration)}</AppText>
            </View>
          ) : null}

          <Pressable
            onPress={isRecording ? () => void stopRecording() : () => void startRecording()}
            disabled={uploading}
            hitSlop={hitSlop}
            style={[styles.micBtn, isRecording && styles.micBtnActive]}
          >
            {isRecording ? (
              <Square size={22} color={colors.primaryForeground} fill={colors.primaryForeground} />
            ) : (
              <Mic size={22} color={colors.primaryForeground} />
            )}
            <AppText style={styles.micLabel}>
              {uploading
                ? 'Uploading…'
                : isRecording
                  ? 'Stop recording'
                  : 'Start recording audio'}
            </AppText>
          </Pressable>

          {recordingUri && !isRecording ? (
            <View style={styles.savedRow}>
              <AppText variant="secondary">Recording saved ✓</AppText>
              <Pressable onPress={resetRecording} hitSlop={hitSlop}>
                <Trash2 size={18} color={colors.destructive} />
              </Pressable>
            </View>
          ) : null}
        </View>

        <Button onPress={submit} loading={loading || uploading} style={{ marginTop: spacing.lg }}>
          Save interaction
        </Button>
      </Screen>
    </ComponentGate>
  );
}

const styles = StyleSheet.create({
  notes: { minHeight: 100, textAlignVertical: 'top' },
  section: { fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.sm },
  recordCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    gap: spacing.md,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    minHeight: 48,
  },
  bar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  duration: {
    marginLeft: spacing.md,
    fontWeight: '600',
    color: colors.primary,
    alignSelf: 'center',
  },
  micBtn: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  micBtnActive: { backgroundColor: colors.destructive },
  micLabel: { color: colors.primaryForeground, fontWeight: '600', fontSize: 16 },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
