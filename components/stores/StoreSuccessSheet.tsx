import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, Card, IconChip } from '@/components/ui';
import { CollectFeedbackForm } from '@/components/stores/CollectFeedbackForm';
import { PriceReportForm } from '@/components/reports/PriceReportForm';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { colors, hitSlop, radius, spacing } from '@/theme';
import type { IoniconName } from '@/components/navigation/TabIcon';
import type { StockLevelValue } from '@/components/reports/shared';

const DIALOG_MS = 200;

export type AddedStoreInfo = {
  id: string;
  name: string;
  county: string;
};

type HubView = 'menu' | 'feedback' | 'price';

type StoreSuccessSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: AddedStoreInfo | null;
  stockLevels: Record<string, StockLevelValue>;
  onRequestStockReport: () => void;
};

type ActionTile = {
  key: string;
  label: string;
  icon: IoniconName;
  onPress: () => void;
  disabled?: boolean;
};

export function StoreSuccessSheet({
  open,
  onOpenChange,
  store,
  stockLevels,
  onRequestStockReport,
}: StoreSuccessSheetProps) {
  const router = useRouter();
  const { isEnabled } = useProjectComponents();
  const { currentWorkspaceLabel } = useWorkspace();
  const { height: windowH } = useWindowDimensions();

  const [view, setView] = useState<HubView>('menu');
  const [mounted, setMounted] = useState(false);
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const panelAnim = useRef(new Animated.Value(0)).current;
  const closingRef = useRef(false);

  const isMarketResearch =
    (currentWorkspaceLabel ?? '').toLowerCase() === 'market_research';
  const hasStockLevels = Object.keys(stockLevels).length > 0;

  useEffect(() => {
    if (open) {
      setView('menu');
      closingRef.current = false;
      setMounted(true);
      overlayAnim.setValue(0);
      panelAnim.setValue(0);
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 1, duration: DIALOG_MS, useNativeDriver: true }),
        Animated.timing(panelAnim, { toValue: 1, duration: DIALOG_MS, useNativeDriver: true }),
      ]).start();
      return;
    }
    if (!mounted || closingRef.current) return;
    closingRef.current = true;
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 0, duration: DIALOG_MS, useNativeDriver: true }),
      Animated.timing(panelAnim, { toValue: 0, duration: DIALOG_MS, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
        closingRef.current = false;
        setView('menu');
      }
    });
  }, [open, mounted, overlayAnim, panelAnim]);

  if (!mounted || !store) return null;

  const close = () => onOpenChange(false);

  const pushWithStore = (pathname: '/(agent)/surveys' | '/(agent)/record-sale' | '/(agent)/give-products') => {
    onOpenChange(false);
    router.push({
      pathname,
      params: { storeId: store.id, storeName: store.name },
    });
  };

  const tiles: ActionTile[] = [];
  if (isEnabled('CRM-0097')) {
    tiles.push({
      key: 'survey',
      label: 'Start Survey',
      icon: 'clipboard',
      onPress: () => pushWithStore('/(agent)/surveys'),
    });
  }
  if (!isMarketResearch && isEnabled('CRM-0034')) {
    tiles.push({
      key: 'sale',
      label: 'Record Sale',
      icon: 'cart',
      onPress: () => pushWithStore('/(agent)/record-sale'),
    });
  }
  if (!isMarketResearch && isEnabled('CRM-0034G')) {
    tiles.push({
      key: 'giveaway',
      label: 'Give Products',
      icon: 'gift',
      onPress: () => pushWithStore('/(agent)/give-products'),
    });
  }
  tiles.push({
    key: 'feedback',
    label: 'Collect Feedback',
    icon: 'chatbox',
    onPress: () => setView('feedback'),
  });
  if (isMarketResearch && isEnabled('CRM-0025')) {
    tiles.push({
      key: 'price',
      label: 'Price Report',
      icon: 'pricetag',
      onPress: () => setView('price'),
      disabled: !hasStockLevels,
    });
  }

  const maxPanelH = Math.min(windowH * 0.92, 720);
  const panelScale = panelAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] });
  const panelTranslateY = panelAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

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
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={close}
          accessibilityLabel="Close"
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
              maxHeight: maxPanelH,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: spacing.sm,
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.lg,
                paddingBottom: spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <IconChip
                name="checkmark-circle"
                backgroundColor={colors.primary}
                color={colors.primaryForeground}
              />
              <View style={{ flex: 1, flexShrink: 1 }}>
                <AppText variant="h3" style={{ fontWeight: '700', flexShrink: 1 }}>
                  Store Added Successfully!
                </AppText>
                <AppText
                  style={{ fontSize: 14, color: colors.secondaryForeground, marginTop: 2 }}
                >
                  Quick actions for this store
                </AppText>
              </View>
              <Pressable onPress={close} hitSlop={hitSlop} accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={colors.secondaryForeground} />
              </Pressable>
            </View>

            <ScrollView
              style={{ maxHeight: maxPanelH - 88 }}
              contentContainerStyle={{
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                gap: spacing.md,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Card style={{ backgroundColor: colors.muted, marginBottom: 0 }}>
                <AppText style={{ fontWeight: '600', fontSize: 16 }}>{store.name}</AppText>
                {store.county ? (
                  <AppText variant="secondary" style={{ marginTop: 2, fontSize: 13 }}>
                    {store.county}
                  </AppText>
                ) : null}
              </Card>

              {view === 'menu' ? (
                <>
                  <AppText variant="secondary" style={{ fontSize: 14 }}>
                    Quick Actions for this store:
                  </AppText>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {tiles.map((tile) => (
                      <Button
                        key={tile.key}
                        variant="tile"
                        disabled={tile.disabled}
                        onPress={tile.onPress}
                        style={{ minWidth: '45%', flex: 1 }}
                        icon={
                          <Ionicons
                            name={tile.icon}
                            size={20}
                            color={colors.primaryForeground}
                          />
                        }
                      >
                        {tile.label}
                      </Button>
                    ))}
                  </View>

                  {isEnabled('CRM-0022') || isEnabled('CRM-0021') ? (
                    <Button variant="outline" onPress={onRequestStockReport}>
                      Stock Report
                    </Button>
                  ) : null}

                  {isMarketResearch && isEnabled('CRM-0025') && !hasStockLevels ? (
                    <AppText variant="secondary" style={{ fontSize: 13 }}>
                      Complete a stock report first to unlock Price Report.
                    </AppText>
                  ) : null}

                  <Button variant="ghost" onPress={close}>
                    Close
                  </Button>
                </>
              ) : null}

              {view === 'feedback' ? (
                <CollectFeedbackForm
                  storeId={store.id}
                  storeName={store.name}
                  onDone={() => setView('menu')}
                  onCancel={() => setView('menu')}
                />
              ) : null}

              {view === 'price' ? (
                <View>
                  <Button variant="ghost" onPress={() => setView('menu')} style={{ marginBottom: spacing.sm }}>
                    Back to Actions
                  </Button>
                  <PriceReportForm stockLevels={stockLevels} storeId={store.id} />
                </View>
              ) : null}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
