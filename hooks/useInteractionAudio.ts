import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useAuth } from '@/providers/AuthProvider';
import { uploadInteractionRecording } from '@/utils/interactionRecording';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function useInteractionAudio() {
  const { user } = useAuth();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 500);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Microphone access denied',
          'Please allow microphone access to record audio.',
        );
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      setDuration(0);
      setAudioUrl(null);
      clearTimer();
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Recording failed', 'Could not start audio recording.');
      setIsRecording(false);
      clearTimer();
    }
  }, [recorder]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    clearTimer();
    try {
      await recorder.stop();
      setIsRecording(false);

      // Allow native file flush before reading URI.
      await new Promise((resolve) => setTimeout(resolve, 150));

      const uri = recorder.uri ?? recorderState.url ?? null;
      if (!uri) {
        Alert.alert('Upload failed', 'No recording file was found after stopping.');
        return null;
      }
      if (!user) {
        Alert.alert('Upload failed', 'You must be signed in to upload recordings.');
        return null;
      }

      setUploading(true);
      const { url, error } = await uploadInteractionRecording(uri, user.id);
      if (!url) {
        Alert.alert('Upload failed', error ?? 'Could not upload the recording. Please try again.');
        return null;
      }
      setAudioUrl(url);
      return url;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert(
        'Recording failed',
        error instanceof Error ? error.message : 'Could not finish the recording.',
      );
      setIsRecording(false);
      return null;
    } finally {
      setUploading(false);
      try {
        await setAudioModeAsync({ allowsRecording: false });
      } catch {
        // ignore
      }
    }
  }, [recorder, recorderState.url, user]);

  const resetRecording = useCallback(() => {
    clearTimer();
    if (isRecording || recorderState.isRecording) {
      void recorder.stop().catch(() => undefined);
    }
    setIsRecording(false);
    setDuration(0);
    setAudioUrl(null);
  }, [isRecording, recorder, recorderState.isRecording]);

  return {
    isRecording: isRecording || recorderState.isRecording,
    duration,
    durationLabel: formatDuration(duration),
    audioUrl,
    uploading,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
