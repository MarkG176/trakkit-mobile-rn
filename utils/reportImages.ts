import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '@/lib/supabase';

function decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1200 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

export async function uploadImageToStorage(
  bucket: string,
  path: string,
  uri: string,
  metadata?: Record<string, string>,
): Promise<boolean> {
  try {
    const compressed = await compressImage(uri);
    const base64 = await FileSystem.readAsStringAsync(compressed, { encoding: 'base64' });
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, decode(base64), {
        contentType: 'image/jpeg',
        upsert: true,
        metadata,
      });
    return !error;
  } catch {
    return false;
  }
}

export async function uploadReportImages(
  agentId: string,
  uris: string[],
  metadata?: Record<string, string>,
  onProgress?: (uploaded: number, total: number) => void,
): Promise<{ uploaded: number; total: number }> {
  const total = uris.length;
  let uploaded = 0;
  onProgress?.(uploaded, total);

  await Promise.all(
    uris.map(async (uri, index) => {
      const filename = `${Date.now()}-${index}.jpg`;
      const path = `${agentId}/reports/${filename}`;
      const ok = await uploadImageToStorage('store_images', path, uri, metadata);
      if (ok) {
        uploaded += 1;
        onProgress?.(uploaded, total);
      }
    }),
  );

  return { uploaded, total };
}

export async function uploadAgentSelfies(
  agentId: string,
  projectSlug: string,
  uris: string[],
  onProgress?: (uploaded: number, total: number) => void,
): Promise<{ uploaded: number; total: number }> {
  const total = uris.length;
  let uploaded = 0;
  onProgress?.(uploaded, total);

  await Promise.all(
    uris.map(async (uri, index) => {
      const filename = `${Date.now()}-${index}.jpg`;
      const path = `${agentId}/${projectSlug}/${filename}`;
      const ok = await uploadImageToStorage('agent-selfies', path, uri);
      if (ok) {
        uploaded += 1;
        onProgress?.(uploaded, total);
      }
    }),
  );

  return { uploaded, total };
}
