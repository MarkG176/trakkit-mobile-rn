/**
 * Read-only survey response review sheet (Profile / Activity).
 */
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { AppText, LoadingSpinner, EmptyMessage } from '@/components/ui';
import { colors, hitSlop, spacing } from '@/theme';
import { SurveyQuestionCard } from './SurveyQuestionCard';
import {
  normalizeSurveyQuestions,
  type SurveyQuestion,
  type SurveyResponsesMap,
} from './types';

type SurveyResponseSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responseId: string | null;
  workspaceId?: string | null;
};

export function SurveyResponseSheet({
  open,
  onOpenChange,
  responseId,
  workspaceId,
}: SurveyResponseSheetProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('Survey response');
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [answers, setAnswers] = useState<SurveyResponsesMap>({});

  useEffect(() => {
    if (!open || !responseId) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      let responseQuery = supabase
        .from('survey_responses')
        .select('responses, survey_template_id, completed_at, workspace_id')
        .eq('id', responseId);

      if (workspaceId) {
        responseQuery = responseQuery.eq('workspace_id', workspaceId);
      }

      const { data: response } = await responseQuery.maybeSingle();

      if (cancelled) return;

      if (!response) {
        setQuestions([]);
        setAnswers({});
        setLoading(false);
        return;
      }

      const map = (response.responses ?? {}) as SurveyResponsesMap;
      setAnswers(map);

      if (response.survey_template_id) {
        let templateQuery = supabase
          .from('survey_templates')
          .select('title, questions')
          .eq('id', response.survey_template_id);

        if (workspaceId) {
          templateQuery = templateQuery.eq('workspace_id', workspaceId);
        }

        const { data: template } = await templateQuery.maybeSingle();

        if (!cancelled && template) {
          setTitle(template.title || 'Survey response');
          setQuestions(normalizeSurveyQuestions(template.questions));
        }
      } else {
        setQuestions([]);
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, responseId, workspaceId]);

  return (
    <Modal
      visible={open}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => onOpenChange(false)}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.canvas,
          paddingTop: spacing.md,
          paddingBottom: insets.bottom + spacing.md,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.md,
            gap: spacing.sm,
          }}
        >
          <AppText
            variant="h3"
            style={{ fontWeight: '700', flex: 1, flexShrink: 1 }}
            numberOfLines={2}
          >
            {title}
          </AppText>
          <Pressable
            onPress={() => onOpenChange(false)}
            hitSlop={hitSlop}
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <LoadingSpinner label="Loading response" />
          ) : questions.length === 0 ? (
            <EmptyMessage>No questions found for this response.</EmptyMessage>
          ) : (
            questions.map((q, i) => (
              <SurveyQuestionCard
                key={q.id}
                question={q}
                index={i}
                value={answers[q.id]}
                readOnly
              />
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
