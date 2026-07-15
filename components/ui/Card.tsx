import { View, ViewProps } from 'react-native';
import { card } from '@/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...props }: CardProps) {
  return (
    <View style={[card.container, style]} {...props}>
      {children}
    </View>
  );
}
