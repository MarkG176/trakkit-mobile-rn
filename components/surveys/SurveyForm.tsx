/**
 * Active survey form — all questions on one scroll page.
 */
import { useCallback, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppText, Button, ProgressBar } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { colors, spacing } from '@/theme';
import { SurveyQuestionCard } from './SurveyQuestionCard';
import { submitSurveyResponse } from './submitSurvey';
import type { SurveyResponsesMap, SurveyTemplateSummary } from './types';

type SurveyFormProps = {
  template: SurveyTemplateSummary;
  workspaceId: string;
  onCancel: () => void;
  onSubmitted?: () => void;
};

export function SurveyForm({
  template,
  workspaceId,
  onCancel,
  onSubmitted,
}: SurveyFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [responses, setResponses] = useState<SurveyResponsesMap>({});
  const [startedAt] = useState(() => new Date().toISOString());
  const [submitting, setSubmitting] = useState(false);

  const total = template.questions.length;

  const handleAnswerChange = useCallback((questionId: string, value: string | number) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const answeredCount = template.questions.filter((q) => {
    const v = responses[q.id];
    return v !== undefined && v !== '';
  }).length;

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { synced } = await submitSurveyResponse({
        agentId: user.id,
        workspaceId,
        surveyTemplateId: template.id,
        surveyName: template.title,
        responses,
        startedAt,
      });
      Alert.alert(synced ? 'Survey submitted' : 'Saved offline');
      onSubmitted?.();
      router.replace('/(agent)');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setResponses({});
  }, [template.id]);

  return (
    <View>
      <AppText style={{ fontWeight: '700', fontSize: 20, marginBottom: spacing.xs, flexShrink: 1 }}>
        {template.title}
      </AppText>
      <AppText
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: colors.primary,
          marginBottom: spacing.sm,
        }}
      >
        {total} question{total === 1 ? '' : 's'}
      </AppText>
      <ProgressBar value={total > 0 ? answeredCount / total : 0} />

      <View style={{ marginTop: spacing.lg }}>
        {template.questions.map((q, i) => (
          <SurveyQuestionCard
            key={q.id}
            question={q}
            index={i}
            value={responses[q.id]}
            onChange={handleAnswerChange}
          />
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
        <Button variant="outline" style={{ flex: 1 }} onPress={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button style={{ flex: 1 }} onPress={submit} loading={submitting}>
          Submit
        </Button>
      </View>
    </View>
  );
}
