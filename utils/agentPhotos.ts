import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';

function decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function uploadCheckInPhoto(uri: string, userId: string): Promise<string | null> {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const path = `check-ins/${userId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from('agent-photos')
      .upload(path, decode(base64), { contentType: 'image/jpeg', upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from('agent-photos').getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}

export async function getLastCheckInPhotoUrl(
  userId: string,
  workspaceId?: string | null,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('agent-photos')
      .list(`check-ins/${userId}`, {
        limit: 1,
        offset: 0,
        sortBy: { column: 'name', order: 'desc' },
      });

    if (!error && data?.length) {
      const { data: urlData } = supabase.storage
        .from('agent-photos')
        .getPublicUrl(`check-ins/${userId}/${data[0].name}`);
      return urlData.publicUrl;
    }
  } catch {
    // Fall through to status log lookup.
  }

  let query = supabase
    .from('agent_status_log')
    .select('selfie_url')
    .eq('agent_id', userId)
    .eq('status', 'checked_in')
    .not('selfie_url', 'is', null)
    .order('timestamp', { ascending: false })
    .limit(1);

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data: log } = await query.maybeSingle();

  return log?.selfie_url ?? null;
}
