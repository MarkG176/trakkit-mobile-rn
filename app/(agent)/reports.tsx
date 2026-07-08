import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { workspaceService } from '@/services/workspaceService';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { FormField } from '@/components/forms/FormField';
import { useProjectComponents } from '@/hooks/useProjectComponents';

function ReportForm({ title, table, onDone }: { title: string; table: string; onDone: () => void }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const payload = workspaceService.ensureWorkspaceContext({
        agent_id: user.id,
        user_id: user.id,
        notes,
        report_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
      });
      const { synced } = await writeWithOfflineQueue(table, payload);
      Alert.alert(synced ? 'Report submitted' : 'Saved offline');
      onDone();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
      <Text className="mb-3 font-semibold text-slate-900">{title}</Text>
      <FormField label="Notes / summary" value={notes} onChangeText={setNotes} multiline />
      <TouchableOpacity className="rounded-xl bg-blue-600 py-3" onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-center font-semibold text-white">Submit</Text>}
      </TouchableOpacity>
    </View>
  );
}

export default function ReportsScreen() {
  const { currentWorkspaceLabel } = useWorkspace();
  const { isEnabled } = useProjectComponents();
  const teamType = currentWorkspaceLabel?.toLowerCase() ?? '';

  const reports = [
    { code: 'CRM-0019', title: 'Evening Report', table: 'daily_stock_reports', show: isEnabled('CRM-0019') && !teamType.includes('instore') && !teamType.includes('seeding') && !teamType.includes('survey') },
    { code: 'CRM-0020', title: 'In-store Closing Report', table: 'daily_stock_reports', show: isEnabled('CRM-0020') && (teamType.includes('instore') || workspaceService.isCurrentWorkspaceInStoreMode()) },
    { code: 'CRM-0021', title: 'Morning Stock Count', table: 'daily_stock_reports', show: isEnabled('CRM-0021') && (teamType.includes('instore') || workspaceService.isCurrentWorkspaceInStoreMode()) },
    { code: 'CRM-0022', title: 'Stock Report', table: 'daily_stock_reports', show: isEnabled('CRM-0022') },
    { code: 'CRM-0023', title: 'Survey Closing Report', table: 'daily_stock_reports', show: isEnabled('CRM-0023') && teamType.includes('survey') },
    { code: 'CRM-0024', title: 'Seeding Evening Report', table: 'daily_stock_reports', show: isEnabled('CRM-0024') && teamType.includes('seeding') },
    { code: 'CRM-0025', title: 'Price Report', table: 'store_price_reports', show: isEnabled('CRM-0025') },
  ].filter((r) => r.show);

  return (
    <ComponentGate code="CRM-0099" redirectTo="/(agent)">
      <ScrollView className="flex-1 bg-slate-50 px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Reports</Text>
        {reports.length === 0 ? (
          <Text className="text-slate-600">No reports enabled for this project.</Text>
        ) : (
          reports.map((r) => (
            <ReportForm key={r.code} title={r.title} table={r.table} onDone={() => {}} />
          ))
        )}
      </ScrollView>
    </ComponentGate>
  );
}
