// [CRM-0109] Help & Support — docs link + ticket shortcut
import { Linking, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bug,
  ExternalLink,
  HelpCircle,
  MessageCircle,
} from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { AppText, Card, Screen } from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';

const HELP_DOCS_URL = 'https://trakkit.darajatech.com/docs';

export default function HelpSupportScreen() {
  const router = useRouter();

  const openDocs = () => {
    void Linking.openURL(HELP_DOCS_URL);
  };

  return (
    <ComponentGate code="CRM-0109">
      <Screen scroll>
        <AppText variant="secondary" style={{ marginBottom: spacing.lg }}>
          Get assistance when you need it. Contact your supervisor or open the help center.
        </AppText>

        <Pressable onPress={openDocs} hitSlop={hitSlop} style={{ marginBottom: spacing.md }}>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.sm,
                  backgroundColor: colors.primaryLight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HelpCircle size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: '600' }}>Visit Help Center</AppText>
                <AppText variant="secondary" style={{ fontSize: 12, marginTop: 2 }}>
                  Guides and knowledge base
                </AppText>
              </View>
              <ExternalLink size={18} color={colors.mutedForeground} />
            </View>
          </Card>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(agent)/support-ticket')}
          hitSlop={hitSlop}
          style={{ marginBottom: spacing.md }}
        >
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.sm,
                  backgroundColor: colors.muted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MessageCircle size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: '600' }}>Submit a ticket</AppText>
                <AppText variant="secondary" style={{ fontSize: 12, marginTop: 2 }}>
                  Bug, inventory, or missing stats
                </AppText>
              </View>
            </View>
          </Card>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(agent)/support-ticket')}
          hitSlop={hitSlop}
        >
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Bug size={22} color={colors.destructive} />
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: '600' }}>Report a bug</AppText>
                <AppText variant="secondary" style={{ fontSize: 12, marginTop: 2 }}>
                  Help us improve the app
                </AppText>
              </View>
            </View>
          </Card>
        </Pressable>
      </Screen>
    </ComponentGate>
  );
}
