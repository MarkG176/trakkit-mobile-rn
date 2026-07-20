import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';

function decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Upload a local image URI to the store_images bucket (reports folder). */
export async function uploadReportImage(uri: string, userId: string): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const path = `${userId}/reports/${fileName}`;
    const { error } = await supabase.storage
      .from('store_images')
      .upload(path, decode(base64), { contentType: 'image/jpeg', upsert: false });
    if (error) return null;
    const { data } = supabase.storage.from('store_images').getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}
