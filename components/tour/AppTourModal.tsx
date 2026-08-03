import { Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, IconChip, ProgressBar } from '@/components/ui';
import type { AppTourItem } from '@/utils/appTourContent';
import type { IoniconName } from '@/components/navigation/TabIcon';
import { colors, hitSlop, radius, spacing } from '@/theme';

type AppTourModalProps = {
  visible: boolean;
  stepIndex: number;
  stepCount: number;
  navItems: AppTourItem[];
  toolItems: AppTourItem[];
  onNext: () => void;
  onBack: () => void;
  onSkipOrFinish: () => void;
};

function ItemRow({ item }: { item: AppTourItem }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <IconChip
        name={item.icon}
        backgroundColor={colors.primaryLight}
        color={colors.primary}
        size={40}
        iconSize={20}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText style={{ fontWeight: '600', fontSize: 14 }}>{item.name}</AppText>
        <AppText variant="secondary" style={{ fontSize: 12, marginTop: 2, lineHeight: 16 }}>
          {item.description}
        </AppText>
      </View>
    </View>
  );
}

function EmptyHint({ message }: { message: string }) {
  return (
    <AppText variant="secondary" style={{ fontSize: 14, marginTop: spacing.sm }}>
      {message}
    </AppText>
  );
}

export function AppTourModal({
  visible,
  stepIndex,
  stepCount,
  navItems,
  toolItems,
  onNext,
  onBack,
  onSkipOrFinish,
}: AppTourModalProps) {
  const isLast = stepIndex >= stepCount - 1;
  const progress = (stepIndex + 1) / stepCount;

  let title = '';
  let subtitle = '';
  let heroIcon: IoniconName = 'compass-outline';

  if (stepIndex === 0) {
    title = 'Welcome to TraKKiT';
    subtitle = 'Your tools are set up for this project. Take a quick look at what is available.';
    heroIcon = 'sparkles-outline';
  } else if (stepIndex === 1) {
    title = 'Where to go';
    subtitle = 'These tabs get you around the app for this workspace.';
    heroIcon = 'navigate-outline';
  } else if (stepIndex === 2) {
    title = 'Your tools';
    subtitle = 'Everything enabled for you in this workspace.';
    heroIcon = 'construct-outline';
  } else {
    title = "You're all set";
    subtitle = 'You can replay this tour anytime from Help & Support.';
    heroIcon = 'checkmark-circle-outline';
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onSkipOrFinish}
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
            paddingTop: spacing.md,
            paddingBottom: spacing.md,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.sm,
            }}
          >
            <AppText variant="secondary" style={{ fontSize: 12, fontWeight: '600' }}>
              Step {stepIndex + 1} of {stepCount}
            </AppText>
            {!isLast ? (
              <Pressable
                onPress={onSkipOrFinish}
                hitSlop={hitSlop}
                accessibilityRole="button"
                accessibilityLabel="Skip tour"
              >
                <AppText style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
                  Skip
                </AppText>
              </Pressable>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>

          <ProgressBar value={progress} style={{ marginBottom: spacing.md }} />

          <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
            <IconChip
              name={heroIcon}
              backgroundColor={colors.primaryLight}
              color={colors.primary}
              size={56}
              iconSize={28}
            />
            <AppText
              style={{
                fontWeight: '700',
                fontSize: 20,
                textAlign: 'center',
                marginTop: spacing.md,
              }}
            >
              {title}
            </AppText>
            <AppText
              variant="secondary"
              style={{
                fontSize: 14,
                textAlign: 'center',
                marginTop: spacing.xs,
                lineHeight: 20,
              }}
            >
              {subtitle}
            </AppText>
          </View>

          {stepIndex === 1 || stepIndex === 2 ? (
            <ScrollView
              style={{ maxHeight: 280, marginBottom: spacing.md }}
              showsVerticalScrollIndicator={false}
            >
              {stepIndex === 1 ? (
                navItems.length > 0 ? (
                  navItems.map((item) => <ItemRow key={item.code} item={item} />)
                ) : (
                  <EmptyHint message="No navigation tabs are enabled for this workspace." />
                )
              ) : toolItems.length > 0 ? (
                toolItems.map((item) => <ItemRow key={item.code} item={item} />)
              ) : (
                <EmptyHint message="No additional tools are enabled for this workspace." />
              )}
            </ScrollView>
          ) : stepIndex === 3 ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                backgroundColor: colors.primaryLight,
                borderRadius: radius.md,
                padding: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <Ionicons name="help-circle-outline" size={22} color={colors.primary} />
              <AppText style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>
                Open Help & Support → App Tour whenever you need a refresher.
              </AppText>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {stepIndex > 0 ? (
              <View style={{ flex: 1 }}>
                <Button variant="outline" onPress={onBack}>
                  Back
                </Button>
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Button onPress={isLast ? onSkipOrFinish : onNext}>
                {isLast ? 'Finish' : 'Next'}
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
