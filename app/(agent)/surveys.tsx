import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import {
  Screen,
  Button,
  AppText,
  CenteredScreen,
  LoadingSpinner,
  EmptyMessage,
  Card,
  IconChip,
} from '@/components/ui';
import { colors, spacing } from '@/theme';
import { SurveyForm } from '@/components/surveys/SurveyForm';
import {
  normalizeSurveyQuestions,
  type SurveyTemplateSummary,
} from '@/components/surveys/types';

export default function SurveysScreen() {
  const { currentWorkspaceId } = useWorkspace();
  const [templates, setTemplates] = useState<SurveyTemplateSummary[]>([]);
  const [active, setActive] = useState<SurveyTemplateSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentWorkspaceId) {
        setTemplates([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data } = await supabase
        .from('survey_templates')
        .select('id, title, questions')
        .eq('is_published', true)
        .eq('is_deleted', false)
        .eq('workspace_id', currentWorkspaceId)
        .order('title', { ascending: true })
        .limit(50);

      const list: SurveyTemplateSummary[] = (data ?? [])
        .map((row) => ({
          id: row.id,
          title: row.title?.trim() || 'Survey',
          questions: normalizeSurveyQuestions(row.questions),
        }))
        .filter((t) => t.questions.length > 0);

      setTemplates(list);
      setLoading(false);
    };
    load();
  }, [currentWorkspaceId]);

  if (loading) {
    return (
      <CenteredScreen>
        <LoadingSpinner label="Loading surveys" />
      </CenteredScreen>
    );
  }

  if (!templates.length) {
    return (
      <ComponentGate code="CRM-0097" redirectTo="/(agent)">
        <CenteredScreen>
          <EmptyMessage>No active survey for this workspace.</EmptyMessage>
        </CenteredScreen>
      </ComponentGate>
    );
  }

  if (active && currentWorkspaceId) {
    return (
      <ComponentGate code="CRM-0097" redirectTo="/(agent)">
        <Screen scroll showBack onBack={() => setActive(null)}>
          <SurveyForm
            template={active}
            workspaceId={currentWorkspaceId}
            onCancel={() => setActive(null)}
            onSubmitted={() => setActive(null)}
          />
        </Screen>
      </ComponentGate>
    );
  }

  return (
    <ComponentGate code="CRM-0097" redirectTo="/(agent)">
      <Screen scroll showBack>
        <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
          Complete assigned market surveys
        </AppText>
        {templates.map((tpl) => (
          <Card key={tpl.id} style={{ marginBottom: spacing.md }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <IconChip
                name="clipboard-outline"
                backgroundColor={colors.primaryLight}
                color={colors.primary}
              />
              <View style={{ flex: 1, flexShrink: 1 }}>
                <AppText style={{ fontWeight: '600', fontSize: 16, flexShrink: 1 }}>
                  {tpl.title}
                </AppText>
                <AppText variant="secondary" style={{ marginTop: 4, fontSize: 14 }}>
                  {tpl.questions.length} question{tpl.questions.length === 1 ? '' : 's'}
                </AppText>
              </View>
            </View>
            <Button onPress={() => setActive(tpl)}>Start Survey</Button>
          </Card>
        ))}
      </Screen>
    </ComponentGate>
  );
}
