import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { hitSlop, spacing } from '@/theme';

type SentimentStarsProps = {
  value: number;
  onChange: (rating: number) => void;
};

export function SentimentStars({ value, onChange }: SentimentStarsProps) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs }}>
      {[1, 2, 3, 4, 5].map((rating) => {
        const filled = rating <= value;
        return (
          <Pressable
            key={rating}
            onPress={() => onChange(rating === value ? 0 : rating)}
            hitSlop={hitSlop}
            accessibilityLabel={`${rating} star${rating === 1 ? '' : 's'}`}
            accessibilityRole="button"
            style={({ pressed }) => ({
              width: 48,
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons
              name={filled ? 'star' : 'star-outline'}
              size={32}
              color={filled ? '#FFC107' : '#CBD5DC'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
