import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { FormField } from '@/components/forms/FormField';

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
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  if (!questions.length) {
    return (
      <ComponentGate code="CRM-0097" redirectTo="/(agent)">
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-slate-600">No active survey for this workspace.</Text>
        </View>
      </ComponentGate>
    );
  }

  return (
    <ComponentGate code="CRM-0097" redirectTo="/(agent)">
      <ScrollView className="flex-1 bg-white px-4 py-6">
        <Text className="mb-2 text-sm text-slate-500">
          Question {step + 1} of {questions.length}
        </Text>
        <Text className="mb-4 text-lg font-bold text-slate-900">{current.question_text}</Text>

        {current.question_type === 'multiple_choice' && current.options ? (
          current.options.map((opt) => (
            <TouchableOpacity
              key={opt}
              className={`mb-2 rounded-xl border p-4 ${answers[current.id] === opt ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
              onPress={() => setAnswers((a) => ({ ...a, [current.id]: opt }))}
            >
              <Text>{opt}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <FormField
            label="Your answer"
            value={answers[current.id] ?? ''}
            onChangeText={(v) => setAnswers((a) => ({ ...a, [current.id]: v }))}
            multiline
          />
        )}

        <View className="mt-4 flex-row gap-3">
          {step > 0 && (
            <TouchableOpacity className="flex-1 rounded-xl border border-slate-300 py-3" onPress={() => setStep(step - 1)}>
              <Text className="text-center font-medium">Back</Text>
            </TouchableOpacity>
          )}
          {step < questions.length - 1 ? (
            <TouchableOpacity
              className="flex-1 rounded-xl bg-blue-600 py-3"
              onPress={() => setStep(step + 1)}
              disabled={!answers[current.id]}
            >
              <Text className="text-center font-semibold text-white">Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity className="flex-1 rounded-xl bg-green-600 py-3" onPress={submitSurvey} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center font-semibold text-white">Submit</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ComponentGate>
  );
}
