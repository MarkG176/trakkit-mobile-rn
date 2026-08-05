import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ComponentGate } from '@/components/ComponentGate';
import { Screen, Card, AppText, IconChip } from '@/components/ui';
import { colors, spacing } from '@/theme';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <ComponentGate code="CRM-0101">
      <Screen scroll showBack>
        <AppText
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: colors.primary,
            letterSpacing: 0.5,
            marginBottom: spacing.sm,
          }}
        >
          ABOUT
        </AppText>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <IconChip
              name="information-circle-outline"
              backgroundColor={colors.muted}
              color={colors.foreground}
            />
            <View style={{ flex: 1 }}>
              <AppText style={{ fontWeight: '600' }}>App Version</AppText>
              <AppText variant="secondary" style={{ marginTop: 2 }}>
                TraKKiT v{version}
              </AppText>
            </View>
            <View
              style={{
                backgroundColor: colors.muted,
                paddingHorizontal: spacing.sm,
                paddingVertical: 4,
                borderRadius: 999,
              }}
            >
              <AppText style={{ fontSize: 12, fontWeight: '600' }}>Stable</AppText>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              marginTop: spacing.md,
              paddingTop: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Ionicons name="globe-outline" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <AppText style={{ fontWeight: '600' }}>Language</AppText>
              <AppText variant="secondary" style={{ marginTop: 2 }}>
                English (v1)
              </AppText>
            </View>
          </View>
        </Card>
      </Screen>
    </ComponentGate>
  );
}
