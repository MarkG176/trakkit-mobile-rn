/**
 * Branded success/offline confirmation dialog.
 * Imperative API: appAlert(title, message?) — drop-in for success Alert.alert calls.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { IconChip } from '@/components/ui/IconChip';
import { card, colors, hitSlop, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

const DIALOG_MS = 200;

type AppAlertVariant = 'success' | 'offline';

type AppAlertRequest = {
  title: string;
  message?: string;
  variant: AppAlertVariant;
  resolve: () => void;
};

type AppAlertOptions = {
  variant?: AppAlertVariant;
};

let showHandler: ((req: AppAlertRequest) => void) | null = null;

function resolveVariant(title: string, options?: AppAlertOptions): AppAlertVariant {
  if (options?.variant) return options.variant;
  if (/saved offline/i.test(title)) return 'offline';
  return 'success';
}

/** Show a branded confirmation card. Resolves when the user dismisses it. */
export function appAlert(
  title: string,
  message?: string,
  options?: AppAlertOptions,
): Promise<void> {
  return new Promise((resolve) => {
    if (!showHandler) {
      console.warn('[appAlert] AppAlertHost is not mounted');
      resolve();
      return;
    }
    showHandler({
      title,
      message,
      variant: resolveVariant(title, options),
      resolve,
    });
  });
}

const VARIANT_ICON: Record<AppAlertVariant, IoniconName> = {
  success: 'checkmark',
  offline: 'alert',
};

export function AppAlertHost() {
  const [open, setOpen] = useState(false);
  const [display, setDisplay] = useState<AppAlertRequest | null>(null);
  const [mounted, setMounted] = useState(false);
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(0)).current;
  const closingRef = useRef(false);
  const activeRef = useRef<AppAlertRequest | null>(null);

  useEffect(() => {
    showHandler = (req) => {
      // Replace any open alert; resolve the previous one so callers don't hang.
      if (activeRef.current) {
        activeRef.current.resolve();
      }
      activeRef.current = req;
      setDisplay(req);
      setOpen(true);
    };
    return () => {
      showHandler = null;
    };
  }, []);

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
        setDisplay(null);
        closingRef.current = false;
      }
    });
  }, [open, mounted, overlayAnim, panelAnim]);

  const dismiss = () => {
    const current = activeRef.current;
    activeRef.current = null;
    setOpen(false);
    current?.resolve();
  };

  const panelScale = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1],
  });
  const panelTranslateY = panelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  if (!mounted || !display) return null;

  const icon = VARIANT_ICON[display.variant];

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
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
            backgroundColor: 'rgba(0,0,0,0.45)',
            opacity: overlayAnim,
          }}
        />

        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={dismiss}
          accessibilityLabel="Dismiss"
        />

        <Animated.View
          style={{
            width: '78%',
            maxWidth: 320,
            opacity: panelAnim,
            transform: [{ scale: panelScale }, { translateY: panelTranslateY }],
            zIndex: 1,
            elevation: 16,
          }}
        >
          <View style={[card.container, { padding: 0 }]}>
            <View style={{ position: 'absolute', top: spacing.sm, right: spacing.sm, zIndex: 2 }}>
              <Pressable onPress={dismiss} hitSlop={hitSlop} accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={colors.secondaryForeground} />
              </Pressable>
            </View>

            <View
              style={{
                alignItems: 'center',
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.lg,
                paddingBottom: spacing.lg,
              }}
            >
              <IconChip
                name={icon}
                backgroundColor={colors.primary}
                color={colors.primaryForeground}
                size={56}
                iconSize={28}
                style={{ marginBottom: spacing.md }}
              />
              <AppText
                variant="h3"
                style={{
                  fontWeight: '700',
                  color: colors.foreground,
                  textAlign: 'center',
                }}
              >
                {display.title}
              </AppText>
              {display.message ? (
                <AppText
                  style={{
                    fontSize: 14,
                    color: colors.secondaryForeground,
                    textAlign: 'center',
                    marginTop: spacing.xs,
                  }}
                >
                  {display.message}
                </AppText>
              ) : null}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
