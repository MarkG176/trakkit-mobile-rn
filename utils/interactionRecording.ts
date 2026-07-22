import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';

function decode(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function inferAudioMeta(uri: string): { ext: string; contentType: string } {
  const lower = uri.toLowerCase();
  if (lower.includes('.webm')) return { ext: 'webm', contentType: 'audio/webm' };
  if (lower.includes('.3gp')) return { ext: '3gp', contentType: 'audio/3gpp' };
  if (lower.includes('.mp4')) return { ext: 'mp4', contentType: 'audio/mp4' };
  if (lower.includes('.m4a')) return { ext: 'm4a', contentType: 'audio/mp4' };
  if (lower.includes('.caf')) return { ext: 'caf', contentType: 'audio/x-caf' };
  // expo-audio HIGH_QUALITY defaults to .m4a on native
  return { ext: 'm4a', contentType: 'audio/mp4' };
}

async function readRecordingBytes(uri: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(uri);
    if (response.ok) {
      return await response.arrayBuffer();
    }
  } catch {
    // Fall through to FileSystem.
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return decode(base64);
}

export async function uploadInteractionRecording(
  uri: string,
  userId: string,
): Promise<{ url: string | null; error: string | null }> {
  try {
    if (!uri) {
      return { url: null, error: 'No recording file was produced.' };
    }

    const { ext, contentType } = inferAudioMeta(uri);
    const bytes = await readRecordingBytes(uri);
    if (!bytes || bytes.byteLength === 0) {
      return { url: null, error: 'Recording file is empty.' };
    }

    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('sale-recordings').upload(path, bytes, {
      contentType,
      upsert: false,
    });

    if (error) {
      console.error('sale-recordings upload error:', error);
      return { url: null, error: error.message };
    }

    const { data } = supabase.storage.from('sale-recordings').getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (e) {
    console.error('sale-recordings upload exception:', e);
    return {
      url: null,
      error: e instanceof Error ? e.message : 'Unknown upload error',
    };
  }
}
