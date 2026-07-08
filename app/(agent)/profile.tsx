import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const router = useRouter();
  const [rank, setRank] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [salesToday, setSalesToday] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data: rankData } = await supabase
        .from('agent_ranks')
        .select('current_rank, total_points')
        .eq('agent_id', user.id)
        .maybeSingle();

      if (rankData) {
        setRank(rankData.current_rank);
        setPoints(rankData.total_points ?? 0);
      }

      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from('sale_items')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', user.id)
        .gte('created_at', startOfDay.toISOString());

      setSalesToday(count ?? 0);
    };
    load();
  }, [user?.id, currentWorkspaceId]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <ComponentGate code="CRM-0090" redirectTo="/(agent)">
      <ScrollView className="flex-1 bg-slate-50 px-4 py-6">
        <Text className="mb-1 text-2xl font-bold text-slate-900">{user?.email}</Text>
        <Text className="mb-6 text-slate-500">Agent profile</Text>

        <View className="mb-4 rounded-xl bg-white p-4">
          <Text className="text-sm text-slate-500">Today&apos;s sales</Text>
          <Text className="text-2xl font-bold text-blue-600">{salesToday}</Text>
        </View>

        <View className="mb-4 rounded-xl bg-white p-4">
          <Text className="text-sm text-slate-500">Rank</Text>
          <Text className="text-xl font-bold text-slate-900">{rank ?? 'Unranked'}</Text>
          <Text className="text-sm text-slate-600">{points} points</Text>
        </View>

        <TouchableOpacity className="mb-3 rounded-xl bg-white p-4" onPress={() => router.push('/(agent)/more')}>
          <Text className="font-medium text-slate-900">More</Text>
        </TouchableOpacity>
        <TouchableOpacity className="mb-3 rounded-xl bg-white p-4" onPress={() => router.push('/(agent)/activity')}>
          <Text className="font-medium text-slate-900">Activity feed</Text>
        </TouchableOpacity>
        <TouchableOpacity className="mb-3 rounded-xl bg-white p-4" onPress={() => router.push('/(agent)/settings')}>
          <Text className="font-medium text-slate-900">Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity className="rounded-xl bg-red-50 p-4" onPress={handleSignOut}>
          <Text className="font-medium text-red-700">Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </ComponentGate>
  );
}
