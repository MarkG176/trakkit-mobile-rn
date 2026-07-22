/**
 * Shared survey answer widgets — rating / multiple_choice / text.
 * Used by Surveys form and SurveyResponseSheet (read-only mode).
 */
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Badge, Card } from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';
import type { SurveyAnswer, SurveyQuestion } from './types';

type SurveyQuestionCardProps = {
  question: SurveyQuestion;
  index: number;
  value?: SurveyAnswer;
  onChange?: (questionId: string, value: SurveyAnswer) => void;
  readOnly?: boolean;
};

function QuestionChrome({
  index,
  question,
}: {
  index: number;
  question: SurveyQuestion;
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
          marginBottom: spacing.xs,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: radius.full,
            backgroundColor: '#DBEAFE',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppText style={{ fontSize: 14, fontWeight: '700', color: '#1D4ED8' }}>
            {index + 1}
          </AppText>
        </View>
        <View style={{ flex: 1, flexShrink: 1, minWidth: 0 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: spacing.sm,
              flexWrap: 'wrap',
            }}
          >
            <AppText
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
                flexShrink: 1,
                flex: 1,
              }}
            >
              {question.label}
            </AppText>
            {question.required ? <Badge variant="destructive">Required</Badge> : null}
          </View>
          {question.description ? (
            <AppText
              variant="secondary"
              style={{ fontSize: 12, marginTop: spacing.xs, flexShrink: 1 }}
            >
              {question.description}
            </AppText>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function RatingInput({
  value,
  onChange,
  readOnly,
}: {
  value?: number;
  onChange?: (n: number) => void;
  readOnly?: boolean;
}) {
  const selected = typeof value === 'number' ? value : 0;

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
      {[1, 2, 3, 4, 5].map((n) => {
        const lit = n <= selected;
        return (
          <Pressable
            key={n}
            disabled={readOnly}
            onPress={() => onChange?.(n)}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={`Rating ${n}`}
            accessibilityState={{ selected: lit }}
            style={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={lit ? 'star' : 'star-outline'}
              size={32}
              color={lit ? '#FACC15' : colors.secondaryForeground}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function MultipleChoiceInput({
  questionId,
  options,
  value,
  onChange,
  readOnly,
}: {
  questionId: string;
  options: string[];
  value?: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  if (readOnly) {
    const text = typeof value === 'string' && value.trim() ? value : null;
    return (
      <AppText
        style={{
          fontWeight: '600',
          fontSize: 16,
          fontStyle: text ? 'normal' : 'italic',
          color: text ? colors.foreground : colors.secondaryForeground,
        }}
      >
        {text ?? 'No answer'}
      </AppText>
    );
  }

  return (
    <View style={{ gap: spacing.sm }}>
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <Pressable
            key={`${questionId}-${opt}`}
            onPress={() => onChange?.(opt)}
            hitSlop={hitSlop}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={({ pressed }) => ({
              minHeight: 48,
              borderWidth: 1,
              borderColor: selected ? colors.primary : colors.border,
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: selected
                ? colors.primaryLight
                : pressed
                  ? colors.muted
                  : colors.card,
            })}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: radius.full,
                borderWidth: 2,
                borderColor: selected ? colors.primary : colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selected ? (
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: radius.full,
                    backgroundColor: colors.primary,
                  }}
                />
              ) : null}
            </View>
            <AppText style={{ flex: 1, fontSize: 16, flexShrink: 1 }}>{opt}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

function TextAnswerInput({
  value,
  onChange,
  readOnly,
}: {
  value?: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  if (readOnly) {
    const text = typeof value === 'string' && value.trim() ? value : null;
    return (
      <AppText
        style={{
          fontSize: 16,
          lineHeight: 22,
          fontStyle: text ? 'normal' : 'italic',
          color: text ? colors.foreground : colors.secondaryForeground,
        }}
      >
        {text ?? 'No answer'}
      </AppText>
    );
  }

  return (
    <TextInput
      value={typeof value === 'string' ? value : ''}
      onChangeText={onChange}
      placeholder="Enter your response…"
      placeholderTextColor={colors.secondaryForeground}
      multiline
      numberOfLines={4}
      textAlignVertical="top"
      style={{
        minHeight: 100,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: 16,
        color: colors.foreground,
        backgroundColor: colors.muted,
      }}
    />
  );
}

export function SurveyQuestionCard({
  question,
  index,
  value,
  onChange,
  readOnly = false,
}: SurveyQuestionCardProps) {
  return (
    <Card style={{ marginBottom: spacing.md }}>
      <QuestionChrome index={index} question={question} />

      {question.type === 'rating' ? (
        readOnly ? (
          <RatingInput
            value={typeof value === 'number' ? value : undefined}
            readOnly
          />
        ) : (
          <RatingInput
            value={typeof value === 'number' ? value : undefined}
            onChange={(n) => onChange?.(question.id, n)}
          />
        )
      ) : null}

      {question.type === 'multiple_choice' ? (
        question.options?.length ? (
          <MultipleChoiceInput
            questionId={question.id}
            options={question.options}
            value={typeof value === 'string' ? value : undefined}
            onChange={(v) => onChange?.(question.id, v)}
            readOnly={readOnly}
          />
        ) : readOnly ? (
          <AppText
            style={{
              fontStyle: 'italic',
              color: colors.secondaryForeground,
            }}
          >
            No answer
          </AppText>
        ) : null
      ) : null}

      {question.type === 'text' ? (
        <TextAnswerInput
          value={typeof value === 'string' ? value : undefined}
          onChange={(v) => onChange?.(question.id, v)}
          readOnly={readOnly}
        />
      ) : null}

      {/* Unknown types: chrome only — no input */}
      {question.type !== 'rating' &&
      question.type !== 'multiple_choice' &&
      question.type !== 'text' &&
      readOnly ? (
        <AppText
          style={{
            fontSize: 16,
            fontStyle: typeof value === 'string' && value ? 'normal' : 'italic',
            color:
              value !== undefined && value !== ''
                ? colors.foreground
                : colors.secondaryForeground,
          }}
        >
          {value !== undefined && value !== '' ? String(value) : 'No answer'}
        </AppText>
      ) : null}
    </Card>
  );
}
