/** Survey template question shapes + normalizers (template JSONB only). */

export type SurveyQuestionType = 'rating' | 'multiple_choice' | 'text' | string;

export type SurveyAnswer = string | number;

export type SurveyResponsesMap = Record<string, SurveyAnswer>;

export type SurveyQuestion = {
  id: string;
  type: SurveyQuestionType;
  label: string;
  description?: string;
  required: boolean;
  options?: string[];
};

export type SurveyTemplateSummary = {
  id: string;
  title: string;
  questions: SurveyQuestion[];
};

/** Map live / legacy template question objects into a stable UI shape. */
export function normalizeSurveyQuestion(raw: unknown, index: number): SurveyQuestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const q = raw as Record<string, unknown>;

  const id =
    (typeof q.id === 'string' && q.id) ||
    (typeof q.id === 'number' && String(q.id)) ||
    `q-${index}`;

  const typeRaw =
    (typeof q.type === 'string' && q.type) ||
    (typeof q.question_type === 'string' && q.question_type) ||
    'text';

  // Treat open_ended as text; unknown types keep their name (card shows, no input).
  const type: SurveyQuestionType =
    typeRaw === 'open_ended' ? 'text' : typeRaw;

  const label =
    (typeof q.question_text === 'string' && q.question_text) ||
    (typeof q.question === 'string' && q.question) ||
    (typeof q.title === 'string' && q.title) ||
    (typeof q.label === 'string' && q.label) ||
    (typeof q.text === 'string' && q.text) ||
    `Question ${index + 1}`;

  const description =
    typeof q.description === 'string' && q.description.trim()
      ? q.description.trim()
      : undefined;

  const options = Array.isArray(q.options)
    ? q.options.filter((o): o is string => typeof o === 'string')
    : undefined;

  return {
    id,
    type,
    label,
    description,
    required: q.required === true,
    options: options?.length ? options : undefined,
  };
}

export function normalizeSurveyQuestions(raw: unknown): SurveyQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i) => normalizeSurveyQuestion(item, i))
    .filter((q): q is SurveyQuestion => q != null);
}
