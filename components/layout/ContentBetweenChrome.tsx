import { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors } from '@/theme';

type ContentBetweenChromeProps = ViewProps & {
  children: ReactNode;
  /** Safe-area edges this shell should own (defaults to none — parent chrome owns them). */
  edges?: readonly Edge[];
};

/**
 * Flex region that sits between the app TopBar and the bottom tab / system nav.
 * `minHeight: 0` prevents children from overflowing past the tab bar.
 */
export function ContentBetweenChrome({
  children,
  edges = [],
  style,
  ...props
}: ContentBetweenChromeProps) {
  if (edges.length === 0) {
    return (
      <View style={[{ flex: 1, minHeight: 0 }, style]} {...props}>
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={edges}
      style={[{ flex: 1, minHeight: 0, backgroundColor: colors.canvas }, style]}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
}
