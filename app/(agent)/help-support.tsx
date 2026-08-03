import { useMemo, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ComponentGate } from '@/components/ComponentGate';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { openAppTour } from '@/hooks/useAppTour';
import { buildAppTourAvailableItems } from '@/utils/appTourContent';
import {
  Screen,
  AppText,
  Button,
  Card,
  IconChip,
  ListItemCard,
  SectionHeader,
} from '@/components/ui';
import {
  DOCS_URL,
  buildFaqItems,
  popularHelpTopics,
} from '@/constants/help';
import { colors, hitSlop, radius, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';

type SupportOption = {
  id: string;
  title: string;
  description: string;
  icon: IoniconName;
  accent: string;
  iconColor: string;
  action: () => void;
};

async function openDocs() {
  await Linking.openURL(DOCS_URL);
}

export default function HelpSupportScreen() {
  const router = useRouter();
  const { isEnabled } = useProjectComponents();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqItems = buildFaqItems();
  const availableItems = useMemo(() => buildAppTourAvailableItems(isEnabled), [isEnabled]);

  const supportOptions: SupportOption[] = [
    {
      id: 'tour',
      title: 'App Tour',
      description: 'See what is available in this workspace',
      icon: 'compass-outline',
      accent: colors.primaryLight,
      iconColor: colors.primary,
      action: () => openAppTour(),
    },
    {
      id: 'ticket',
      title: 'Submit a Ticket',
      description: 'Create a detailed support request',
      icon: 'help-circle-outline',
      accent: '#FFF4D6',
      iconColor: colors.warning,
      action: () => router.push('/(agent)/support-ticket'),
    },
    {
      id: 'docs',
      title: 'Documentation',
      description: 'In-app guides and FAQs',
      icon: 'book-outline',
      accent: colors.primaryLight,
      iconColor: colors.primary,
      action: () => router.push('/(agent)/documentation'),
    },
    {
      id: 'chat',
      title: 'Chat',
      description: 'Message your supervisor',
      icon: 'chatbubble-outline',
      accent: '#F3E8FF',
      iconColor: '#9333EA',
      action: () => router.push('/(agent)/support-ticket'),
    },
    {
      id: 'bug',
      title: 'Report a Bug',
      description: 'Help us improve the app',
      icon: 'bug-outline',
      accent: '#FFE5E3',
      iconColor: colors.destructive,
      action: () => router.push('/(agent)/support-ticket'),
    },
  ];

  return (
    <ComponentGate code="CRM-0109">
      <Screen scroll showBack>
        <AppText variant="secondary" style={{ marginBottom: spacing.lg, fontSize: 14 }}>
          Get assistance when you need it
        </AppText>

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: spacing.sm,
            marginBottom: spacing.lg,
          }}
        >
          {supportOptions.map((option) => (
            <Pressable
              key={option.id}
              onPress={option.action}
              hitSlop={hitSlop}
              accessibilityRole="button"
              accessibilityLabel={option.title}
              style={{ width: '48%', flexGrow: 1 }}
            >
              {({ pressed }) => (
                <Card
                  style={{
                    opacity: pressed ? 0.85 : 1,
                    alignItems: 'center',
                    paddingVertical: spacing.md,
                    minHeight: 120,
                  }}
                >
                  <IconChip
                    name={option.icon}
                    backgroundColor={option.accent}
                    color={option.iconColor}
                    size={40}
                    iconSize={20}
                  />
                  <AppText
                    style={{
                      fontWeight: '600',
                      fontSize: 14,
                      marginTop: spacing.sm,
                      textAlign: 'center',
                    }}
                  >
                    {option.title}
                  </AppText>
                  <AppText
                    variant="secondary"
                    style={{ fontSize: 12, marginTop: spacing.xs, textAlign: 'center' }}
                  >
                    {option.description}
                  </AppText>
                </Card>
              )}
            </Pressable>
          ))}
        </View>

        <SectionHeader title="Available in this workspace" />
        <View style={{ marginBottom: spacing.lg }}>
          {availableItems.length > 0 ? (
            availableItems.map((item) => (
              <Card
                key={item.code}
                style={{
                  marginBottom: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: spacing.sm,
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
                  <AppText
                    variant="secondary"
                    style={{ fontSize: 12, marginTop: 2, lineHeight: 16 }}
                  >
                    {item.description}
                  </AppText>
                </View>
              </Card>
            ))
          ) : (
            <AppText variant="secondary" style={{ fontSize: 14, marginBottom: spacing.sm }}>
              No project tools are enabled for this workspace yet.
            </AppText>
          )}
        </View>

        <Card style={{ marginBottom: spacing.lg }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: spacing.sm,
            }}
          >
            <AppText style={{ fontWeight: '700', fontSize: 16 }}>Help Center</AppText>
            <Ionicons name="open-outline" size={18} color={colors.mutedForeground} />
          </View>
          <AppText variant="secondary" style={{ fontSize: 14, marginBottom: spacing.md }}>
            Access our comprehensive knowledge base and guides at trakkit.darajatech.com
          </AppText>
          <Button variant="outline" onPress={openDocs}>
            Visit Help Center
          </Button>
        </Card>

        <SectionHeader title="Popular Help Topics" />
        <View style={{ marginBottom: spacing.lg }}>
          {popularHelpTopics.map((topic) => (
            <ListItemCard
              key={topic.title}
              title={topic.title}
              subtitle={topic.category}
              onPress={() => router.push('/(agent)/documentation')}
              trailing={
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              }
            />
          ))}
        </View>

        <SectionHeader title="Help & FAQ" />
        <View style={{ marginBottom: spacing.md }}>
          {faqItems.map((item, index) => {
            const open = expandedFaq === index;
            return (
              <Card key={item.question} style={{ marginBottom: spacing.sm, padding: 0 }}>
                <Pressable
                  onPress={() => setExpandedFaq(open ? null : index)}
                  hitSlop={hitSlop}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  style={{
                    minHeight: 48,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm + 2,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                  }}
                >
                  <AppText style={{ flex: 1, fontWeight: '600', fontSize: 14 }}>
                    {item.question}
                  </AppText>
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
                {open ? (
                  <AppText
                    variant="secondary"
                    style={{
                      fontSize: 14,
                      lineHeight: 20,
                      paddingHorizontal: spacing.md,
                      paddingBottom: spacing.md,
                    }}
                  >
                    {item.answer}
                  </AppText>
                ) : null}
              </Card>
            );
          })}
        </View>

        <Pressable
          onPress={openDocs}
          hitSlop={hitSlop}
          accessibilityRole="link"
          accessibilityLabel="View full docs on trakkit.darajatech.com"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            minHeight: 48,
            marginBottom: spacing.lg,
            borderRadius: radius.md,
          }}
        >
          <Ionicons name="open-outline" size={18} color={colors.primary} />
          <AppText style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
            View full docs
          </AppText>
        </Pressable>

        <Card
          style={{
            borderColor: '#FECACA',
            backgroundColor: '#FEF2F2',
            marginBottom: spacing.md,
          }}
        >
          <AppText style={{ fontWeight: '700', fontSize: 16, color: '#991B1B', marginBottom: spacing.xs }}>
            Emergency Contact
          </AppText>
          <AppText style={{ fontSize: 14, color: '#B91C1C', marginBottom: spacing.sm }}>
            For urgent issues affecting your work or safety, call your team lead directly.
          </AppText>
          <Button
            variant="destructive"
            onPress={() => router.push('/(agent)/support-ticket')}
          >
            Contact Supervisor
          </Button>
        </Card>
      </Screen>
    </ComponentGate>
  );
}
