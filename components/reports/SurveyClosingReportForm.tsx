import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '@/components/forms/FormField';
import { AppText, Button, Card, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { colors, radius, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';
import { formatWorkMinutes, reportAlert, submitNoteRow } from './shared';

function StatTile({
  icon,
  value,
  caption,
}: {
  icon: IoniconName;
  value: string;
  caption: string;
}) {
  return (
    <Card
      style={{
        flex: 1,
        padding: spacing.md,
        backgroundColor: colors.muted,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: radius.md,
          backgroundColor: colors.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.sm,
        }}
      >
        <Ionicons name={icon} size={18} color={colors.foreground} />
      </View>
      <AppText style={{ fontWeight: '700', fontSize: 24, marginBottom: spacing.xs }}>{value}</AppText>
      <AppText variant="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
        {caption}
      </AppText>
    </Card>
  );
}

export function SurveyClosingReportForm() {
  const { user } = useAuth();
  const { currentWorkspaceId } = useWorkspace();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [surveysDone, setSurveysDone] = useState(0);
  const [timeWorked, setTimeWorked] = useState('0h 0m');

  useEffect(() => {
    if (!user || !currentWorkspaceId) return;

    let cancelled = false;
    const todayIso = new Date().toISOString().split('T')[0];

    const load = async () => {
      setStatsLoading(true);
      const [surveysRes, segmentsRes] = await Promise.all([
        supabase
          .from('survey_responses')
          .select('id', { count: 'exact', head: true })
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('is_completed', true)
          .not('is_deleted', 'is', true)
          .or(`completed_at.gte.${todayIso}T00:00:00,and(completed_at.is.null,created_at.gte.${todayIso}T00:00:00)`),
        supabase
          .from('agent_work_segments')
          .select('segment_type, duration_minutes')
          .eq('agent_id', user.id)
          .eq('workspace_id', currentWorkspaceId)
          .eq('work_date', todayIso),
      ]);

      if (cancelled) return;

      setSurveysDone(surveysRes.count ?? 0);

      let workMinutes = 0;
      let lunchMinutes = 0;
      for (const seg of segmentsRes.data ?? []) {
        const mins = seg.duration_minutes ?? 0;
        if (seg.segment_type === 'work') workMinutes += mins;
        if (seg.segment_type === 'lunch') lunchMinutes += mins;
      }
      setTimeWorked(formatWorkMinutes(Math.max(0, workMinutes - lunchMinutes)));
      setStatsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user, currentWorkspaceId]);

  const submit = async () => {
    if (!user) return;
    const trimmed = notes.trim();
    if (!trimmed) {
      Alert.alert('Notes required', 'Add closing notes before submitting.');
      return;
    }

    setLoading(true);
    try {
      const { synced } = await submitNoteRow({
        agent_id: user.id,
        content: trimmed,
        note_type: 'closing_report',
      });
      reportAlert(synced);
      setNotes('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
      <AppText variant="h3" style={{ fontWeight: '700', marginBottom: spacing.sm }}>
        Survey Closing Report
      </AppText>
      <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
        Review today&apos;s survey stats and add closing notes.
      </AppText>

      {statsLoading ? (
        <LoadingSpinner label="Loading stats" />
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
          <StatTile icon="clipboard-outline" value={String(surveysDone)} caption="Surveys Done" />
          <StatTile icon="time-outline" value={timeWorked} caption="Time Worked" />
        </View>
      )}

      <FormField
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={4}
        style={{ height: undefined, minHeight: 100, textAlignVertical: 'top', paddingVertical: spacing.sm }}
      />
      <Button onPress={submit} loading={loading} disabled={!notes.trim()}>
        Submit survey closing report
      </Button>
    </Card>
  );
}
