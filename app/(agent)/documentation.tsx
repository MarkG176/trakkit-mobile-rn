import { useMemo, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Screen,
  AppText,
  Button,
  Card,
  Badge,
  Input,
  IconChip,
  SectionHeader,
} from '@/components/ui';
import {
  DOCS_URL,
  documentCategories,
  documentationFaqs,
} from '@/constants/help';
import { colors, hitSlop, radius, spacing } from '@/theme';

async function openDocs() {
  await Linking.openURL(DOCS_URL);
}

export default function DocumentationScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showFaqs, setShowFaqs] = useState(false);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return documentCategories;
    return documentCategories.filter(
      (category) =>
        category.title.toLowerCase().includes(q) ||
        category.documents.some((doc) => doc.title.toLowerCase().includes(q)),
    );
  }, [searchQuery]);

  const selectedCategory = documentCategories.find((c) => c.id === selectedCategoryId);

  if (selectedCategory) {
    return (
      <Screen scroll showBack onBack={() => setSelectedCategoryId(null)}>
        <AppText variant="secondary" style={{ marginBottom: spacing.md, fontSize: 14 }}>
          {selectedCategory.documents.length} documents — open the Help Center for the full guides
        </AppText>
        {selectedCategory.documents.map((doc) => (
          <Pressable key={doc.id} onPress={openDocs} hitSlop={hitSlop}>
            {({ pressed }) => (
              <Card
                style={{
                  marginBottom: spacing.sm,
                  opacity: pressed ? 0.85 : 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                }}
              >
                <IconChip name="document-text-outline" size={40} iconSize={20} />
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontWeight: '600', fontSize: 16 }}>{doc.title}</AppText>
                  <AppText variant="secondary" style={{ fontSize: 12, marginTop: spacing.xs }}>
                    Opens trakkit.darajatech.com/docs
                  </AppText>
                </View>
                <Ionicons name="open-outline" size={18} color={colors.mutedForeground} />
              </Card>
            )}
          </Pressable>
        ))}
        <Button variant="outline" onPress={openDocs} style={{ marginTop: spacing.sm }}>
          Visit Help Center
        </Button>
      </Screen>
    );
  }

  if (showFaqs) {
    return (
      <Screen scroll showBack onBack={() => setShowFaqs(false)}>
        <AppText variant="secondary" style={{ marginBottom: spacing.md, fontSize: 14 }}>
          Frequently asked questions
        </AppText>
        {documentationFaqs.map((faq) => (
          <Card key={faq.id} style={{ marginBottom: spacing.md }}>
            <AppText style={{ fontWeight: '700', fontSize: 16, marginBottom: spacing.sm }}>
              {faq.question}
            </AppText>
            <AppText variant="secondary" style={{ fontSize: 14, lineHeight: 20 }}>
              {faq.answer}
            </AppText>
          </Card>
        ))}
        <Pressable
          onPress={openDocs}
          hitSlop={hitSlop}
          accessibilityRole="link"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            minHeight: 48,
            marginTop: spacing.sm,
          }}
        >
          <Ionicons name="open-outline" size={18} color={colors.primary} />
          <AppText style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
            View full docs
          </AppText>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen scroll showBack>
      <AppText variant="secondary" style={{ marginBottom: spacing.md, fontSize: 14 }}>
        Access guides, resources, and support materials
      </AppText>

      <Card style={{ marginBottom: spacing.lg }}>
        <AppText style={{ fontWeight: '700', fontSize: 16, marginBottom: spacing.xs }}>
          TraKKiT Help Center
        </AppText>
        <AppText variant="secondary" style={{ fontSize: 14, marginBottom: spacing.md }}>
          Full documentation for agents and supervisors lives at trakkit.darajatech.com/docs
        </AppText>
        <Button variant="outline" onPress={openDocs}>
          Visit Help Center
        </Button>
      </Card>

      <Input
        placeholder="Search documentation..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        containerStyle={{ marginBottom: spacing.lg }}
      />

      <SectionHeader title="Categories" />
      <View style={{ marginBottom: spacing.md }}>
        {filteredCategories.map((category) => (
          <Pressable
            key={category.id}
            onPress={() => setSelectedCategoryId(category.id)}
            hitSlop={hitSlop}
          >
            {({ pressed }) => (
              <Card
                style={{
                  marginBottom: spacing.sm,
                  opacity: pressed ? 0.85 : 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                }}
              >
                <IconChip
                  name={category.icon}
                  backgroundColor={category.accent}
                  color={category.iconColor}
                  size={40}
                  iconSize={20}
                />
                <View style={{ flex: 1 }}>
                  <AppText style={{ fontWeight: '600', fontSize: 16 }}>{category.title}</AppText>
                  <AppText variant="secondary" style={{ fontSize: 12, marginTop: spacing.xs }}>
                    {category.documents.length} documents
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </Card>
            )}
          </Pressable>
        ))}

        <Pressable onPress={() => setShowFaqs(true)} hitSlop={hitSlop}>
          {({ pressed }) => (
            <Card
              style={{
                marginBottom: spacing.sm,
                opacity: pressed ? 0.85 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
              }}
            >
              <IconChip
                name="help-circle-outline"
                backgroundColor="#FFF4D6"
                color={colors.warning}
                size={40}
                iconSize={20}
              />
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: '600', fontSize: 16 }}>FAQs</AppText>
                <AppText variant="secondary" style={{ fontSize: 12, marginTop: spacing.xs }}>
                  Frequently asked questions
                </AppText>
              </View>
              <Badge variant="warning">{String(documentationFaqs.length)}</Badge>
            </Card>
          )}
        </Pressable>
      </View>

      <Pressable
        onPress={openDocs}
        hitSlop={hitSlop}
        accessibilityRole="link"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
          minHeight: 48,
          borderRadius: radius.md,
          marginBottom: spacing.md,
        }}
      >
        <Ionicons name="open-outline" size={18} color={colors.primary} />
        <AppText style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
          View full docs at trakkit.darajatech.com
        </AppText>
      </Pressable>
    </Screen>
  );
}
