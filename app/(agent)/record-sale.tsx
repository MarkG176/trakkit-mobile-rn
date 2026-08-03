import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '@/components/forms/FormField';
import { GeoCapture } from '@/components/forms/GeoCapture';
import { ComponentGate } from '@/components/ComponentGate';
import { ProductPickerSheet } from '@/components/sales/ProductPickerSheet';
import { SaleCartSection } from '@/components/sales/SaleCartSection';
import {
  SaleFeedbackDialog,
  type SaleFeedbackData,
} from '@/components/sales/SaleFeedbackDialog';
import {
  cartTotal,
  ensureLineInCart,
  getLineTotal,
  removeLine,
  setLineTotal,
  updateLinePrice,
  updateLineQuantity,
  type SaleLine,
} from '@/components/sales/types';
import { useAuth } from '@/providers/AuthProvider';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { workspaceService } from '@/services/workspaceService';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { formatCurrencySimple } from '@/utils/currency';
import { useInventory, type InventoryItem } from '@/hooks/useInventory';
import { storeIdPayload, useStoreRouteParams } from '@/hooks/useStoreRouteParams';
import { normalizeComponentFlag } from '@/utils/componentFlags';
import { uploadImageToStorage } from '@/utils/reportImages';
import { Screen, Button, AppText, appAlert } from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';

export default function RecordSaleScreen() {
  const { user } = useAuth();
  const { codes, isEnabled } = useProjectComponents();
  const { storeId, storeName } = useStoreRouteParams();
  const { inventory, loading: inventoryLoading } = useInventory();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [cart, setCart] = useState<SaleLine[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [pendingResult, setPendingResult] = useState<{
    synced: boolean;
    total: number;
    count: number;
    customerName: string;
  } | null>(null);

  const requirePhoto = useMemo(
    () =>
      codes['CRM-0034P'] !== undefined && normalizeComponentFlag(codes['CRM-0034P']),
    [codes],
  );
  const canOverridePrice = useMemo(
    () =>
      codes['CRM-0034C'] === undefined
        ? true
        : normalizeComponentFlag(codes['CRM-0034C']),
    [codes],
  );
  const showFeedback = isEnabled('CRM-0054');

  const currency = workspaceService.getProjectCurrencyCode();
  const total = cartTotal(cart);
  const canSubmit =
    cart.length > 0 && lat != null && lon != null && (!requirePhoto || Boolean(photoUri));

  const handleEnsureInCart = (item: InventoryItem) => {
    setCart((prev) => ensureLineInCart(prev, item));
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required for sale photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const finishSale = (synced: boolean, saleTotal: number, count: number, name: string) => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setPhotoUri(null);
    if (showFeedback) {
      setPendingResult({ synced, total: saleTotal, count, customerName: name });
      setFeedbackOpen(true);
    } else {
      appAlert(
        synced ? 'Sale recorded' : 'Saved offline',
        synced
          ? count === 1
            ? 'Sale submitted successfully.'
            : `${count} items submitted successfully.`
          : 'Will sync when connected.',
      );
    }
  };

  const submitFeedback = async (feedback: SaleFeedbackData) => {
    if (!user || !pendingResult) return;
    await writeWithOfflineQueue(
      'interactions',
      workspaceService.ensureWorkspaceContext({
        agent_id: user.id,
        interaction_type: 'sale_feedback',
        customer_name: pendingResult.customerName || null,
        outcome: 'completed',
        quantity_sold: pendingResult.count,
        metadata: {
          engagement_type: feedback.engagementType,
          notes: feedback.notes,
          sentiment: feedback.sentiment,
          sale_total: pendingResult.total,
        },
        ...storeIdPayload(storeId),
      }),
    );
    setPendingResult(null);
  };

  const submit = async () => {
    if (!user || cart.length === 0 || lat == null || lon == null) {
      Alert.alert('Missing fields', 'Add at least one product and wait for location.');
      return;
    }
    if (requirePhoto && !photoUri) {
      Alert.alert('Photo required', 'Take a sale photo before completing.');
      return;
    }

    const invalid = cart.find((line) => line.quantity < 1 || !Number.isFinite(line.unitPrice));
    if (invalid) {
      Alert.alert('Invalid items', 'Each item needs a quantity and unit price.');
      return;
    }

    const overStock = cart.find(
      (line) => line.quantity > line.amount_issued && line.amount_issued > 0,
    );
    if (overStock) {
      Alert.alert(
        'Stock limit',
        `${overStock.name} only has ${overStock.amount_issued} available.`,
      );
      return;
    }

    setLoading(true);
    try {
      let photoPath: string | null = null;
      if (photoUri) {
        const path = `${user.id}/sales/${Date.now()}.jpg`;
        const ok = await uploadImageToStorage('store_images', path, photoUri);
        if (!ok) throw new Error('Failed to upload sale photo');
        photoPath = path;
      }

      let allSynced = true;
      const saleTotal = cartTotal(cart);
      const count = cart.length;
      const name = customerName;
      for (const line of cart) {
        const payload = workspaceService.ensureWorkspaceContext({
          agent_id: user.id,
          product_name: line.name,
          product_variant_id: line.product_variant_id,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          total_price: getLineTotal(line),
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          ...(photoPath ? { metadata: { sale_photo: photoPath } } : {}),
          ...storeIdPayload(storeId),
        });

        const { synced } = await writeWithOfflineQueue('sale_items', payload);
        if (!synced) allSynced = false;
      }

      finishSale(allSynced, saleTotal, count, name);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentGate code="CRM-0094" redirectTo="/(agent)">
      <Screen showBack>
        <View style={{ flex: 1, marginHorizontal: -spacing.md, marginBottom: -spacing.md }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: spacing.md,
              paddingBottom: spacing.xl,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AppText variant="secondary" style={{ marginBottom: spacing.lg }}>
              {storeName
                ? `Build the cart for ${storeName}, then complete the sale.`
                : 'Build the cart, then complete the sale for this visit.'}
            </AppText>

            <SaleCartSection
              cart={cart}
              currency={currency}
              onAddProducts={() => setPickerOpen(true)}
              onUpdateQuantity={(id, qty) =>
                setCart((prev) => updateLineQuantity(prev, id, qty))
              }
              onUpdatePrice={
                canOverridePrice
                  ? (id, price) => setCart((prev) => updateLinePrice(prev, id, price))
                  : undefined
              }
              onRemove={(id) => setCart((prev) => removeLine(prev, id))}
            />

            <AppText style={{ fontWeight: '700', fontSize: 16, marginBottom: spacing.sm }}>
              Customer (optional)
            </AppText>
            <FormField
              label="Customer name"
              value={customerName}
              onChangeText={setCustomerName}
            />
            <FormField
              label="Customer phone"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
            />

            {requirePhoto ? (
              <View style={{ marginBottom: spacing.md }}>
                <AppText style={{ fontWeight: '700', fontSize: 16, marginBottom: spacing.sm }}>
                  Sale photo {requirePhoto ? '*' : ''}
                </AppText>
                {photoUri ? (
                  <View style={{ gap: spacing.sm }}>
                    <Image
                      source={{ uri: photoUri }}
                      style={{
                        width: '100%',
                        height: 180,
                        borderRadius: radius.md,
                        backgroundColor: colors.muted,
                      }}
                    />
                    <Button variant="outline" onPress={() => void pickPhoto()}>
                      Retake Photo
                    </Button>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => void pickPhoto()}
                    hitSlop={hitSlop}
                    style={{
                      minHeight: 120,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                      borderStyle: 'dashed',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: spacing.sm,
                      backgroundColor: colors.muted,
                    }}
                  >
                    <Ionicons name="camera-outline" size={28} color={colors.primary} />
                    <AppText style={{ fontWeight: '600' }}>Take sale photo</AppText>
                  </Pressable>
                )}
              </View>
            ) : null}

            <GeoCapture
              onLocation={(a, b) => {
                setLat(a);
                setLon(b);
              }}
            />
          </ScrollView>

          <View
            style={{
              paddingHorizontal: spacing.md,
              paddingTop: spacing.sm,
              paddingBottom: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.canvas,
            }}
          >
            <Button onPress={() => void submit()} loading={loading} disabled={!canSubmit}>
              {`Complete Sale • ${formatCurrencySimple(total, currency)}`}
            </Button>
          </View>
        </View>
      </Screen>

      <ProductPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        inventory={inventory}
        inventoryLoading={inventoryLoading}
        cart={cart}
        currency={currency}
        onEnsureInCart={handleEnsureInCart}
        onUpdateQuantity={(id, qty) => setCart((prev) => updateLineQuantity(prev, id, qty))}
        onSetLineTotal={
          canOverridePrice
            ? (id, totalValue) => setCart((prev) => setLineTotal(prev, id, totalValue))
            : undefined
        }
      />

      {pendingResult ? (
        <SaleFeedbackDialog
          open={feedbackOpen}
          onOpenChange={setFeedbackOpen}
          totalAmount={pendingResult.total}
          itemCount={pendingResult.count}
          currency={currency}
          customerName={pendingResult.customerName || undefined}
          onSubmit={submitFeedback}
          onSkip={() => setPendingResult(null)}
        />
      ) : null}
    </ComponentGate>
  );
}
