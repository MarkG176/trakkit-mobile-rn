import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { FormField } from '@/components/forms/FormField';
import {
  Screen,
  PageHeader,
  Button,
  SelectCard,
  AppText,
  CenteredScreen,
  LoadingSpinner,
  EmptyMessage,
} from '@/components/ui';
import { colors, spacing } from '@/theme';

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options?: string[];
}

export default function SurveysScreen() {
  const { user } = useAuth();
  const { currentWorkspaceId, currentProjectId } = useWorkspace();
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!currentWorkspaceId) return;
      let query = supabase
        .from('survey_templates')
        .select('id, questions')
        .eq('is_published', true)
        .eq('is_deleted', false)
        .limit(1);

      if (currentProjectId) {
        query = query.eq('project_id', currentProjectId);
      }

      const { data: template } = await query.maybeSingle();
      const qs = (template?.questions as SurveyQuestion[] | null) ?? [];
      setTemplateId(template?.id ?? null);
      setQuestions(qs);
      setLoading(false);
    };
    load();
  }, [currentWorkspaceId, currentProjectId]);

  const current = questions[step];

  const submitSurvey = async () => {
    if (!user || !currentWorkspaceId || !templateId) return;
    setSubmitting(true);
    try {
      const responsePayload = {
        agent_id: user.id,
        workspace_id: currentWorkspaceId,
        survey_template_id: templateId,
        responses: answers,
        is_completed: true,
        completed_at: new Date().toISOString(),
      };
      const { synced } = await writeWithOfflineQueue('survey_responses', responsePayload);
      Alert.alert(synced ? 'Survey submitted' : 'Saved offline');
      setStep(0);
      setAnswers({});
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <CenteredScreen>
        <LoadingSpinner />
      </CenteredScreen>
    );
  }

  if (!questions.length) {
    return (
      <ComponentGate code="CRM-0097" redirectTo="/(agent)">
        <CenteredScreen>
          <EmptyMessage>No active survey for this workspace.</EmptyMessage>
        </CenteredScreen>
      </ComponentGate>
    );
  }

  return (
    <ComponentGate code="CRM-0097" redirectTo="/(agent)">
      <Screen scroll>
        <AppText variant="secondary" style={{ marginBottom: spacing.sm }}>
          Question {step + 1} of {questions.length}
        </AppText>
        <PageHeader title={current.question_text} />

        {current.question_type === 'multiple_choice' && current.options ? (
          current.options.map((opt) => (
            <SelectCard
              key={opt}
              label={opt}
              selected={answers[current.id] === opt}
              onPress={() => setAnswers((a) => ({ ...a, [current.id]: opt }))}
            />
          ))
        ) : (
          <FormField
            label="Your answer"
            value={answers[current.id] ?? ''}
            onChangeText={(v) => setAnswers((a) => ({ ...a, [current.id]: v }))}
            multiline
          />
        )}

        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
          {step > 0 ? (
            <Button variant="secondary" style={{ flex: 1 }} onPress={() => setStep(step - 1)}>
              Back
            </Button>
          ) : null}
          {step < questions.length - 1 ? (
            <Button style={{ flex: 1 }} onPress={() => setStep(step + 1)} disabled={!answers[current.id]}>
              Next
            </Button>
          ) : (
            <Button
              style={{ flex: 1, backgroundColor: colors.success }}
              onPress={submitSurvey}
              loading={submitting}
              disabled={!answers[current.id]}
            >
              Submit
            </Button>
          )}
        </View>
      </Screen>
    </ComponentGate>
  );
}
