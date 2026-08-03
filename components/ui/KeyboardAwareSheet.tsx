import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { colors, spacing } from '@/theme';

type KeyboardAwareSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Extra style for the sheet panel. */
  contentStyle?: StyleProp<ViewStyle>;
  /** Wrap children in a ScrollView (default true). */
  scrollable?: boolean;
};

/**
 * Bottom sheet Modal that stays above the soft keyboard.
 * Uses KeyboardAvoidingView on iOS and explicit keyboard-height padding on Android.
 */
export function KeyboardAwareSheet({
  visible,
  onClose,
  children,
  contentStyle,
  scrollable = true,
}: KeyboardAwareSheetProps) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight(visible);
  const androidLift = Platform.OS === 'android' ? keyboardHeight : 0;

  const body = scrollable ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
      contentContainerStyle={{ paddingBottom: spacing.sm }}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Dismiss" />
        <View
          style={[
            {
              backgroundColor: colors.background,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: spacing.md,
              paddingBottom: spacing.md + Math.max(insets.bottom, 0),
              maxHeight: '90%',
              marginBottom: androidLift > 0 ? Math.max(0, androidLift - insets.bottom) : 0,
            },
            contentStyle,
          ]}
        >
          {body}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
