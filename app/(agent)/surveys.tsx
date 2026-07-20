// [CRM-0097] Surveys — published templates with RHF/zod multi-type questions
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Star } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import {
  Screen,
  AppText,
  Button,
  Input,
  SelectCard,
  LoadingSpinner,
  EmptyMessage,
  CenteredScreen,
  SectionHeader,
} from '@/components/ui';
import { useSurveyTemplate, SurveyQuestion } from '@/hooks/useSurveyTemplate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { supabase } from '@/lib/supabase';
import { colors, hitSlop, radius, spacing } from '@/theme';

type TemplateListItem = {
  id: string;
  title: string;
  description: string | null;
};

const questionText = (q: SurveyQuestion, index: number) =>
  q.text || q.question || q.title || q.label || `Question ${index + 1}`;

const questionType = (q: SurveyQuestion) => {
  const raw = (q.type || '').toLowerCase();
  if (raw.includes('rating') || raw.includes('star')) return 'rating';
  if (raw.includes('choice') || raw.includes('select') || raw === 'multiple_choice') {
    return 'multiple_choice';
  }
  return 'text';
};

export default function SurveysScreen() {
  const { user } = useAuth();
  const { currentWorkspaceId, currentProjectId } = useWorkspace();
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: template, isLoading: templateLoading } = useSurveyTemplate(selectedId);

  useEffect(() => {
    const load = async () => {
      if (!currentWorkspaceId) {
        setListLoading(false);
        return;
      }
      setListLoading(true);
      try {
        let query = supabase
          .from('survey_templates')
          .select('id, title, description')
          .eq('workspace_id', currentWorkspaceId)
          .eq('is_published', true)
          .eq('status', 'active')
          .neq('is_deleted', true)
          .order('created_at', { ascending: false });

        if (currentProjectId) {
          query = query.eq('project_id', currentProjectId);
        }

        const { data, error } = await query;
        if (error) throw error;
        const rows = (data ?? []) as TemplateListItem[];
        setTemplates(rows);
        if (rows.length === 1) setSelectedId(rows[0].id);
      } catch (e) {
        console.error('Survey list load failed', e);
        Alert.alert('Error', 'Could not load surveys.');
      } finally {
        setListLoading(false);
      }
    };
    load();
  }, [currentWorkspaceId, currentProjectId]);

  const questions = template?.questions ?? [];

  const schema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};
    questions.forEach((q, index) => {
      const key = q.id || `q_${index}`;
      const type = questionType(q);
      if (q.required) {
        if (type === 'rating') {
          shape[key] = z.number().min(1, 'Required');
        } else {
          shape[key] = z.string().min(1, 'Required');
        }
      } else {
        shape[key] =
          type === 'rating'
            ? z.number().optional()
            : z.string().optional();
      }
    });
    return z.object(shape);
  }, [questions]);

  type FormValues = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {},
  });

  useEffect(() => {
    reset({});
  }, [selectedId, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!user || !currentWorkspaceId || !selectedId || submitting) return;
    setSubmitting(true);
    try {
      const { data: currentTask } = await supabase
        .from('agent_tasks')
        .select('id')
        .eq('agent_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      const { data: interaction, error: interactionError } = await supabase
        .from('interactions')
        .insert({
          task_id: currentTask?.id || null,
          agent_id: user.id,
          interaction_type: 'survey',
          outcome: 'completed',
          quantity_sold: 0,
          survey_template_id: selectedId,
          workspace_id: currentWorkspaceId,
          metadata: { survey_template_id: selectedId },
        })
        .select('id')
        .single();

      if (interactionError) throw interactionError;

      const { error: responseError } = await supabase.from('survey_responses').insert({
        agent_id: user.id,
        survey_template_id: selectedId,
        interaction_id: interaction.id,
        responses: JSON.parse(JSON.stringify(values)),
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        is_completed: true,
        completion_status: 'completed',
        workspace_id: currentWorkspaceId,
      });

      if (responseError) throw responseError;

      Alert.alert('Survey submitted', 'Responses recorded successfully.');
      reset({});
      if (templates.length > 1) setSelectedId(null);
    } catch (e) {
      console.error('Survey submit failed', e);
      Alert.alert('Error', 'Failed to submit survey. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (listLoading) {
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
          <EmptyMessage>No published surveys for this workspace.</EmptyMessage>
        </CenteredScreen>
      </ComponentGate>
    );
  }

  return (
    <ComponentGate code="CRM-0097" redirectTo="/(agent)">
      <Screen scroll showBack>
        {!selectedId ? (
          <>
            <SectionHeader title="Available surveys" />
            {templates.map((t) => (
              <SelectCard
                key={t.id}
                label={t.title}
                selected={false}
                onPress={() => setSelectedId(t.id)}
              />
            ))}
          </>
        ) : templateLoading ? (
          <LoadingSpinner label="Loading questions" />
        ) : (
          <>
            {templates.length > 1 ? (
              <Button
                variant="ghost"
                onPress={() => setSelectedId(null)}
                style={{ alignSelf: 'flex-start', marginBottom: spacing.sm }}
              >
                ← Back to list
              </Button>
            ) : null}

            <AppText style={styles.surveyTitle}>
              {template?.title ?? 'Survey'}
            </AppText>

            {questions.map((q, index) => {
              const key = q.id || `q_${index}`;
              const type = questionType(q);
              return (
                <View key={key} style={styles.questionCard}>
                  <View style={styles.qHeader}>
                    <View style={styles.qBadge}>
                      <AppText style={styles.qBadgeText}>{index + 1}</AppText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText style={styles.qText}>{questionText(q, index)}</AppText>
                      {q.required ? (
                        <AppText style={styles.required}>Required</AppText>
                      ) : null}
                    </View>
                  </View>

                  {type === 'rating' ? (
                    <Controller
                      control={control}
                      name={key as never}
                      render={({ field: { value, onChange } }) => (
                        <View style={styles.stars}>
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Pressable
                              key={rating}
                              onPress={() => onChange(rating)}
                              hitSlop={hitSlop}
                            >
                              <Star
                                size={32}
                                color={
                                  rating <= (Number(value) || 0)
                                    ? '#FBBF24'
                                    : colors.mutedForeground
                                }
                                fill={
                                  rating <= (Number(value) || 0)
                                    ? '#FBBF24'
                                    : 'transparent'
                                }
                              />
                            </Pressable>
                          ))}
                        </View>
                      )}
                    />
                  ) : null}

                  {type === 'multiple_choice' && Array.isArray(q.options) ? (
                    <Controller
                      control={control}
                      name={key as never}
                      render={({ field: { value, onChange } }) => (
                        <View>
                          {q.options!.map((option) => (
                            <SelectCard
                              key={option}
                              label={option}
                              selected={value === option}
                              onPress={() => onChange(option)}
                            />
                          ))}
                        </View>
                      )}
                    />
                  ) : null}

                  {type === 'text' ? (
                    <Controller
                      control={control}
                      name={key as never}
                      render={({ field: { value, onChange } }) => (
                        <Input
                          label="Your answer"
                          value={(value as string) ?? ''}
                          onChangeText={onChange}
                          placeholder="Enter your response…"
                          multiline
                          numberOfLines={3}
                          style={styles.textAnswer}
                        />
                      )}
                    />
                  ) : null}
                </View>
              );
            })}

            <Button
              onPress={handleSubmit(onSubmit)}
              loading={submitting}
              disabled={submitting || !isValid || questions.length === 0}
              style={{ marginTop: spacing.md }}
            >
              Submit survey
            </Button>
          </>
        )}
      </Screen>
    </ComponentGate>
  );
}

const styles = StyleSheet.create({
  surveyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.lg,
    color: colors.foreground,
  },
  questionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.card,
  },
  qHeader: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  qBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qBadgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  qText: { fontSize: 16, fontWeight: '500' },
  required: {
    marginTop: 4,
    fontSize: 12,
    color: colors.destructive,
    fontWeight: '600',
  },
  stars: { flexDirection: 'row', gap: spacing.sm },
  textAnswer: { minHeight: 80, textAlignVertical: 'top', marginBottom: 0 },
});
