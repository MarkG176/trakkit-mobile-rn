import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { ImageLightbox } from '@/components/shared/CatalogCards';
import { EmptyMessage, LoadingSpinner, Screen, SectionHeader } from '@/components/ui';
import { AppText } from '@/components/ui';
import { radius, spacing } from '@/theme';

type GalleryPhoto = {
  id: string;
  selfie_url: string | null;
  agent_display_name: string | null;
  timestamp: string;
};

export default function GalleryScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['supervisor-gallery', currentWorkspaceId],
    queryFn: async (): Promise<GalleryPhoto[]> => {
      const { data, error } = await supabase
        .from('agent_status_log')
        .select('id, selfie_url, agent_display_name, timestamp')
        .eq('workspace_id', currentWorkspaceId!)
        .not('selfie_url', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentWorkspaceId,
  });

  return (
    <ComponentGate code="CRM-0120">
      <Screen scroll showBack>
        <SectionHeader title="Check-in gallery" />
        {isLoading ? (
          <LoadingSpinner label="Loading photos" />
        ) : photos.length === 0 ? (
          <EmptyMessage>No check-in photos yet.</EmptyMessage>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {photos.map((p) =>
              p.selfie_url ? (
                <Pressable
                  key={p.id}
                  onPress={() => setSelected(p)}
                  style={{ width: '31%', aspectRatio: 1 }}
                >
                  <View style={{ flex: 1, borderRadius: radius.md, overflow: 'hidden' }}>
                    <Image source={{ uri: p.selfie_url }} style={{ width: '100%', height: '100%' }} />
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        paddingHorizontal: 4,
                        paddingVertical: 2,
                      }}
                    >
                      <AppText numberOfLines={1} style={{ color: '#fff', fontSize: 11 }}>
                        {p.agent_display_name || 'Agent'}
                      </AppText>
                    </View>
                  </View>
                </Pressable>
              ) : null,
            )}
          </View>
        )}

        <ImageLightbox
          uri={selected?.selfie_url ?? null}
          caption={
            selected
              ? `${selected.agent_display_name || 'Agent'} • ${format(new Date(selected.timestamp), 'MMM d, h:mm a')}`
              : null
          }
          onClose={() => setSelected(null)}
        />
      </Screen>
    </ComponentGate>
  );
}
