import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';

export default function GalleryScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [photos, setPhotos] = useState<{ id: string; selfie_url: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentWorkspaceId) return;
      const { data } = await supabase
        .from('agent_status_log')
        .select('id, selfie_url')
        .eq('workspace_id', currentWorkspaceId)
        .not('selfie_url', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(30);
      setPhotos(data ?? []);
      setLoading(false);
    };
    load();
  }, [currentWorkspaceId]);

  return (
    <ComponentGate code="CRM-0120">
      <ScrollView className="flex-1 bg-white px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Gallery</Text>
        {loading ? (
          <ActivityIndicator color="#2563eb" />
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {photos.map((p) =>
              p.selfie_url ? (
                <Image key={p.id} source={{ uri: p.selfie_url }} className="h-24 w-24 rounded-lg" />
              ) : null,
            )}
          </View>
        )}
      </ScrollView>
    </ComponentGate>
  );
}
