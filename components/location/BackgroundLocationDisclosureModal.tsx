import { Modal, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, IconChip } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

type BackgroundLocationDisclosureModalProps = {
  visible: boolean;
  continuing?: boolean;
  onContinue: () => void;
  onNotNow: () => void;
};

const FEATURES = [
  {
    icon: 'time-outline' as const,
    title: 'Shift tracking',
    body: 'Your position is recorded while you are checked in.',
  },
  {
    icon: 'eye-outline' as const,
    title: 'Supervisor visibility',
    body: 'Supervisors can see where you are in the field during active shifts.',
  },
];

export function BackgroundLocationDisclosureModal({
  visible,
  continuing = false,
  onContinue,
  onNotNow,
}: BackgroundLocationDisclosureModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onNotNow}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(15, 23, 32, 0.55)',
          justifyContent: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.lg,
        }}
      >
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: radius.lg,
            maxHeight: '92%',
            paddingHorizontal: spacing.md,
            paddingTop: spacing.lg,
            paddingBottom: spacing.md,
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
              <IconChip
                name="navigate-circle-outline"
                backgroundColor={colors.primaryLight}
                color={colors.primary}
                size={64}
                iconSize={32}
              />
              <AppText
                style={{
                  fontWeight: '700',
                  fontSize: 22,
                  textAlign: 'center',
                  marginTop: spacing.md,
                }}
              >
                Background location
              </AppText>
            </View>

            <View
              style={{
                backgroundColor: colors.primaryLight,
                borderRadius: radius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <AppText style={{ fontSize: 16, lineHeight: 24, fontWeight: '600' }}>
                TraKKiT collects location data to enable shift tracking and supervisor visibility
                even when the app is closed or not in use.
              </AppText>
            </View>

            <AppText
              variant="secondary"
              style={{ fontSize: 14, lineHeight: 20, marginBottom: spacing.md }}
            >
              Tracking runs only during an active shift and stops when you check out. Location is
              shared with your supervisors for field visibility. It is not used for advertising.
            </AppText>

            {FEATURES.map((feature) => (
              <View
                key={feature.title}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: spacing.sm,
                  marginBottom: spacing.sm,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: radius.sm,
                    backgroundColor: colors.muted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={feature.icon} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <AppText style={{ fontWeight: '600', fontSize: 14 }}>{feature.title}</AppText>
                  <AppText
                    variant="secondary"
                    style={{ fontSize: 13, marginTop: 2, lineHeight: 18 }}
                  >
                    {feature.body}
                  </AppText>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            <Button onPress={onContinue} loading={continuing} disabled={continuing}>
              Continue
            </Button>
            <Button variant="ghost" onPress={onNotNow} disabled={continuing}>
              Not now
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
