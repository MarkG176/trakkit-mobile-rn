/**
 * Centered modal dialog shell for report forms.
 * Single Modal layer — children must not open nested Modals (use inline expanders).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

const DIALOG_MS = 200;

type ReportDialogShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  icon?: IoniconName;
  children: ReactNode;
  footer?: ReactNode;
};

export function ReportDialogShell({
  open,
  onOpenChange,
  title,
  subtitle,
  icon = 'cube-outline',
  children,
  footer,
}: ReportDialogShellProps) {
  const { height: windowH } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(0)).current;
  const closingRef = useRef(false);

  useEffect(() => {
    if (open) {
      closingRef.current = false;
      setMounted(true);
      overlayAnim.setValue(0);
      panelAnim.setValue(0);
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: DIALOG_MS,
          useNativeDriver: true,
        }),
        Animated.timing(panelAnim, {
          toValue: 1,
          duration: DIALOG_MS,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!mounted || closingRef.current) return;
    closingRef.current = true;
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: DIALOG_MS,
        useNativeDriver: true,
      }),
      Animated.timing(panelAnim, {
        toValue: 0,
        duration: DIALOG_MS,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
        closingRef.current = false;
      }
    });
  }, [open, mounted, overlayAnim, panelAnim]);

  const close = () => onOpenChange(false);

  const panelScale = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });
  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  if (!mounted) return null;

  const maxPanelH = Math.min(windowH * 0.9, 640);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            opacity: overlayAnim,
          }}
        />

        {/* Dismiss only taps outside the panel */}
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={close}
          accessibilityLabel="Close dialog"
        />

        <Animated.View
          style={{
            width: '92%',
            maxWidth: 448,
            maxHeight: maxPanelH,
            opacity: panelAnim,
            transform: [{ scale: panelScale }, { translateY: panelTranslateY }],
            zIndex: 1,
            elevation: 16,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              padding: spacing.lg,
              maxHeight: maxPanelH,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: spacing.sm,
                marginBottom: spacing.sm,
              }}
            >
              <Ionicons name={icon} size={20} color={colors.foreground} />
              <AppText
                variant="h3"
                style={{
                  fontWeight: '700',
                  color: colors.foreground,
                  flex: 1,
                  flexShrink: 1,
                }}
              >
                {title}
              </AppText>
              <Pressable onPress={close} hitSlop={hitSlop} accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={colors.secondaryForeground} />
              </Pressable>
            </View>

            {subtitle ? (
              <AppText
                style={{
                  textAlign: 'center',
                  fontSize: 14,
                  color: colors.secondaryForeground,
                  marginBottom: spacing.md,
                }}
              >
                {subtitle}
              </AppText>
            ) : null}

            {children}
            {footer}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
