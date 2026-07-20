import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  PanResponder,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '@/components/forms/FormField';
import { AppText, Button, Card } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { workspaceService } from '@/services/workspaceService';
import { colors, hitSlop, radius, spacing } from '@/theme';
import {
  parsePrice,
  reportAlert,
  STOCK_LEVEL_OPTIONS,
  stockReport,
  submitPriceRows,
  todayWorkDate,
  useReportSkus,
  type StockLevelValue,
} from './shared';

const SWIPE_THRESHOLD = 48;

type PriceReportFormProps = {
  stockLevels?: Record<string, StockLevelValue>;
};

export function PriceReportForm({ stockLevels = {} }: PriceReportFormProps) {
  const { user } = useAuth();
  const { width: screenW } = useWindowDimensions();
  const { skus, loading: skusLoading } = useReportSkus();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const currency = workspaceService.getProjectCurrencyCode();

  const eligible = useMemo(
    () =>
      skus.filter((sku) => {
        const level = stockLevels[sku.productVariantId];
        return level === 'available' || level === 'low_stock' || level === 'unavailable';
      }),
    [skus, stockLevels],
  );

  const total = eligible.length;
  const current = eligible[page];
  const filledCount = eligible.filter((sku) => {
    const price = parsePrice(prices[sku.productVariantId] ?? '');
    return price != null;
  }).length;
  const allFilled = total > 0 && filledCount === total;

  const goToPage = useCallback(
    (next: number) => {
      if (next < 0 || next >= total) return;
      setPage(next);
      translateX.setValue(0);
    },
    [total, translateX],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 8,
        onPanResponderMove: (_, g) => {
          translateX.setValue(g.dx);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dx <= -SWIPE_THRESHOLD && page < total - 1) {
            Animated.timing(translateX, {
              toValue: -screenW,
              duration: 180,
              useNativeDriver: true,
            }).start(() => goToPage(page + 1));
            return;
          }
          if (g.dx >= SWIPE_THRESHOLD && page > 0) {
            Animated.timing(translateX, {
              toValue: screenW,
              duration: 180,
              useNativeDriver: true,
            }).start(() => goToPage(page - 1));
            return;
          }
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        },
      }),
    [goToPage, page, screenW, total, translateX],
  );

  const submit = async () => {
    if (!user) return;

    if (!allFilled) {
      Alert.alert('Incomplete report', 'Enter a price for every eligible product.');
      return;
    }

    const payloads = eligible
      .map((sku) => {
        const price = parsePrice(prices[sku.productVariantId] ?? '');
        if (price == null) return null;
        return {
          agent_id: user.id,
          product_variant_id: sku.productVariantId,
          work_date: todayWorkDate(),
          price,
          sku: sku.sku ?? sku.name,
          stock_level: stockLevels[sku.productVariantId] ?? null,
        };
      })
      .filter(Boolean) as Record<string, unknown>[];

    setLoading(true);
    try {
      const { synced } = await submitPriceRows(payloads);
      reportAlert(synced);
      setPrices({});
      setPage(0);
    } finally {
      setLoading(false);
    }
  };

  const statusOpt = current
    ? STOCK_LEVEL_OPTIONS.find((o) => o.value === stockLevels[current.productVariantId])
    : undefined;

  return (
    <Card style={{ marginBottom: spacing.lg, padding: spacing.lg }}>
      <AppText variant="h3" style={{ fontWeight: '700', marginBottom: spacing.sm }}>
        Price Report
      </AppText>
      <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
        Enter the observed shelf price for each product.
      </AppText>

      {skusLoading ? null : total === 0 ? (
        <AppText variant="secondary" style={{ marginBottom: spacing.md }}>
          No eligible products. Complete the morning stock report first.
        </AppText>
      ) : current ? (
        <>
          <AppText
            variant="secondary"
            style={{ textAlign: 'center', marginBottom: spacing.md, fontWeight: '600' }}
          >
            {page + 1} of {total}
          </AppText>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            <Pressable
              onPress={() => goToPage(page - 1)}
              disabled={page === 0}
              hitSlop={hitSlop}
              style={{ opacity: page === 0 ? 0.3 : 1, padding: spacing.sm }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.foreground} />
            </Pressable>

            <Animated.View
              {...panResponder.panHandlers}
              style={{
                flex: 1,
                transform: [{ translateX }],
              }}
            >
              <Card
                style={{
                  padding: spacing.lg,
                  backgroundColor: stockReport.panel,
                  borderWidth: 1,
                  borderColor: stockReport.border,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    marginBottom: spacing.md,
                  }}
                >
                  {statusOpt ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 4,
                        borderRadius: radius.full,
                        backgroundColor: `${statusOpt.color}18`,
                      }}
                    >
                      <Ionicons name={statusOpt.icon} size={14} color={statusOpt.color} />
                      <AppText style={{ fontSize: 12, fontWeight: '500', color: statusOpt.color }}>
                        {statusOpt.label}
                      </AppText>
                    </View>
                  ) : null}
                </View>

                <AppText
                  variant="h3"
                  style={{
                    fontWeight: '700',
                    marginBottom: spacing.lg,
                    textAlign: 'center',
                    flexShrink: 1,
                  }}
                >
                  {current.name}
                </AppText>

                <FormField
                  label={`Price (${currency})`}
                  value={prices[current.productVariantId] ?? ''}
                  onChangeText={(value) =>
                    setPrices((prev) => ({ ...prev, [current.productVariantId]: value }))
                  }
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
              </Card>
            </Animated.View>

            <Pressable
              onPress={() => goToPage(page + 1)}
              disabled={page >= total - 1}
              hitSlop={hitSlop}
              style={{ opacity: page >= total - 1 ? 0.3 : 1, padding: spacing.sm }}
            >
              <Ionicons name="chevron-forward" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          <AppText variant="secondary" style={{ textAlign: 'center', marginBottom: spacing.md }}>
            {filledCount} of {total} prices entered
          </AppText>
        </>
      ) : null}

      <Button onPress={submit} loading={loading} disabled={total === 0 || !allFilled}>
        Submit price report
      </Button>
    </Card>
  );
}
