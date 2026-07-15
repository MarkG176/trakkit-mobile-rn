import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { workspaceService } from '@/services/workspaceService';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { FormField } from '@/components/forms/FormField';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { Screen, PageHeader, Button, Card, AppText, EmptyMessage } from '@/components/ui';
import { spacing } from '@/theme';

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
    <Card style={{ marginBottom: spacing.lg }}>
      <AppText style={{ fontWeight: '600', marginBottom: spacing.md }}>{title}</AppText>
      <FormField label="Notes / summary" value={notes} onChangeText={setNotes} multiline />
      <Button onPress={submit} loading={loading}>
        Submit
      </Button>
    </Card>
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
      <Screen scroll>
        <PageHeader title="Reports" />
        {reports.length === 0 ? (
          <EmptyMessage>No reports enabled for this project.</EmptyMessage>
        ) : (
          reports.map((r) => (
            <ReportForm key={r.code} title={r.title} table={r.table} onDone={() => {}} />
          ))
        )}
      </Screen>
    </ComponentGate>
  );
}
