import { useEffect, useState } from 'react';
import { View, Image } from 'react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { Screen, LoadingSpinner } from '@/components/ui';
import { radius, spacing } from '@/theme';

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
      <Screen scroll>
        {loading ? (
          <LoadingSpinner label="Loading photos" />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {photos.map((p) =>
              p.selfie_url ? (
                <Image
                  key={p.id}
                  source={{ uri: p.selfie_url }}
                  style={{ width: 96, height: 96, borderRadius: radius.lg }}
                />
              ) : null,
            )}
          </View>
        )}
      </Screen>
    </ComponentGate>
  );
}
