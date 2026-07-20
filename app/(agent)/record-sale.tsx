// [CRM-0094] Record Sale — multi-item cart with feedback and optional photo
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Camera, Search, ShoppingCart, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { ComponentGate } from '@/components/ComponentGate';
import {
  CartItem,
  ProductCart,
  getCartItemCount,
  getCartTotal,
} from '@/components/sales/ProductCart';
import {
  SaleFeedbackData,
  SaleFeedbackSheet,
} from '@/components/sales/SaleFeedbackSheet';
import { Screen, AppText, Button, Input, LoadingSpinner } from '@/components/ui';
import { useInventory } from '@/hooks/useInventory';
import { useProductFocusInventory } from '@/hooks/useProductFocusInventory';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { useSalesForm } from '@/hooks/useSalesForm';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { workspaceService } from '@/services/workspaceService';
import { uploadCheckInPhoto } from '@/utils/agentPhotos';
import { colors, hitSlop, radius, spacing } from '@/theme';

const CUSTOM_PRICES_CACHE_KEY = 'wholesale_custom_prices';

const getCachedPrices = async (): Promise<Record<string, number>> => {
  try {
    const cached = await AsyncStorage.getItem(CUSTOM_PRICES_CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
};

const savePriceToCache = async (productId: string, price: number) => {
  const cached = await getCachedPrices();
  cached[productId] = price;
  await AsyncStorage.setItem(CUSTOM_PRICES_CACHE_KEY, JSON.stringify(cached));
};

export default function RecordSaleScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentWorkspaceId, currentWorkspaceLabel } = useWorkspace();
  const { isEnabled } = useProjectComponents();
  const { submitSale, loading: submitting } = useSalesForm();
  const { inventory, loading: inventoryLoading } = useInventory();
  const { products: productFocusProducts, loading: productFocusLoading } =
    useProductFocusInventory();

  const isSalePhotoRequired = isEnabled('CRM-0034P');
  const canOverridePrice = isEnabled('CRM-0034C');
  const isWholesaleTeam = currentWorkspaceLabel?.toLowerCase() === 'wholesale';
  const currencyCode = workspaceService.getProjectCurrencyCode();

  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [salePhotoUri, setSalePhotoUri] = useState<string | null>(null);
  const [salePhotoUrl, setSalePhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cachedPrices, setCachedPrices] = useState<Record<string, number>>({});

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['55%', '90%'], []);
  const hasBottomSheet = Boolean(BottomSheet);

  useEffect(() => {
    getCachedPrices().then(setCachedPrices);
  }, []);

  useEffect(() => {
    setCartItems([]);
    setShowCart(false);
    setShowFeedback(false);
  }, [currentWorkspaceId]);

  const sourceProducts = isWholesaleTeam ? productFocusProducts : inventory;
  const loading = isWholesaleTeam ? productFocusLoading : inventoryLoading;

  const products = useMemo(
    () =>
      sourceProducts.map((item) => {
        const price =
          canOverridePrice && cachedPrices[item.product_variant_id] != null
            ? cachedPrices[item.product_variant_id]
            : item.price || 0;
        return {
          productVariantId: item.product_variant_id,
          name: item.name,
          sku: item.sku,
          price,
          maxQuantity:
            'amount_issued' in item ? (item as { amount_issued: number }).amount_issued : undefined,
        };
      }),
    [sourceProducts, canOverridePrice, cachedPrices],
  );

  const totalAmount = getCartTotal(cartItems);
  const itemCount = getCartItemCount(cartItems);

  const openCart = () => {
    setShowCart(true);
    if (hasBottomSheet) {
      requestAnimationFrame(() => bottomSheetRef.current?.expand());
    }
  };

  const closeCart = () => {
    setShowCart(false);
    bottomSheetRef.current?.close();
  };

  const handleCartChange = useCallback(
    (items: CartItem[]) => {
      setCartItems(items);
      if (canOverridePrice) {
        items.forEach((item) => {
          void savePriceToCache(item.productVariantId, item.price);
        });
      }
    },
    [canOverridePrice],
  );

  const captureSalePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Camera required', 'Allow camera access to attach a sale photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setSalePhotoUri(result.assets[0].uri);
      setSalePhotoUrl(null);
    }
  };

  const ensurePhotoUploaded = async (): Promise<string | undefined> => {
    if (salePhotoUrl) return salePhotoUrl;
    if (!salePhotoUri || !user) return undefined;
    setUploadingPhoto(true);
    try {
      const url = await uploadCheckInPhoto(salePhotoUri, user.id);
      if (url) setSalePhotoUrl(url);
      return url ?? undefined;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const beginCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty cart', 'Add at least one product.');
      return;
    }
    if (isSalePhotoRequired && !salePhotoUri && !salePhotoUrl) {
      Alert.alert('Photo required', 'Take a sale photo before submitting.');
      return;
    }
    if (isSalePhotoRequired) {
      const url = await ensurePhotoUploaded();
      if (!url) {
        Alert.alert('Upload failed', 'Could not upload sale photo. Try again.');
        return;
      }
    }
    closeCart();
    setShowFeedback(true);
  };

  const processSale = async (feedback: SaleFeedbackData) => {
    const imageUrl = isSalePhotoRequired
      ? salePhotoUrl ?? (await ensurePhotoUploaded())
      : salePhotoUrl ?? undefined;

    const success = await submitSale({
      items: cartItems.map((item) => ({
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        price: item.price,
        lineTotal: item.lineTotal,
      })),
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      engagementType: feedback.engagementType,
      notes: feedback.notes,
      sentiment: feedback.sentiment,
      imageUrl,
    });

    if (success) {
      setShowFeedback(false);
      setCartItems([]);
      setCustomerName('');
      setCustomerPhone('');
      setSalePhotoUri(null);
      setSalePhotoUrl(null);
      Alert.alert('Sale recorded', 'Your sale was submitted successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const cartBody = (
    <View style={styles.cartBody}>
      <View style={styles.cartHeader}>
        <AppText style={styles.cartTitle}>Sale cart</AppText>
        <Pressable onPress={closeCart} hitSlop={hitSlop}>
          <X size={22} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {cartItems.map((item) => (
        <View key={item.productVariantId} style={styles.cartLine}>
          <View style={{ flex: 1 }}>
            <AppText style={styles.lineName}>{item.name}</AppText>
            <AppText variant="secondary" style={styles.lineMeta}>
              Qty {item.quantity} · {currencyCode} {item.price.toFixed(2)}
            </AppText>
          </View>
          <AppText style={styles.lineTotal}>
            {currencyCode} {(item.lineTotal ?? item.price * item.quantity).toFixed(2)}
          </AppText>
        </View>
      ))}

      <Input
        label="Customer name (optional)"
        value={customerName}
        onChangeText={setCustomerName}
        placeholder="Walk-in Customer"
      />
      <Input
        label="Phone (optional)"
        value={customerPhone}
        onChangeText={setCustomerPhone}
        keyboardType="phone-pad"
      />

      {(isSalePhotoRequired || salePhotoUri) && (
        <View style={styles.photoBlock}>
          {salePhotoUri ? (
            <Image source={{ uri: salePhotoUri }} style={styles.photo} />
          ) : null}
          <Button
            variant="outline"
            onPress={captureSalePhoto}
            icon={<Camera size={18} color={colors.primary} />}
          >
            {salePhotoUri
              ? 'Retake photo'
              : isSalePhotoRequired
                ? 'Take required photo'
                : 'Add photo'}
          </Button>
        </View>
      )}

      <Button
        onPress={beginCheckout}
        loading={submitting || uploadingPhoto}
        style={{ marginTop: spacing.sm }}
      >
        Continue · {currencyCode} {totalAmount.toFixed(2)}
      </Button>
    </View>
  );

  return (
    <ComponentGate code="CRM-0094" redirectTo="/(agent)">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Screen showBack style={{ padding: 0 }}>
          <View style={styles.searchWrap}>
            <Search
              size={16}
              color={colors.mutedForeground}
              style={styles.searchIcon}
            />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search products…"
              placeholderTextColor={colors.mutedForeground}
              style={styles.searchInput}
            />
          </View>

          {loading ? (
            <LoadingSpinner label="Loading products" />
          ) : (
            <ProductCart
              mode="sale"
              products={products}
              cartItems={cartItems}
              onCartChange={(items) => {
                handleCartChange(items);
                if (items.length > 0 && !showCart) openCart();
              }}
              currencyCode={currencyCode}
              allowPriceOverride={canOverridePrice}
              searchTerm={searchTerm}
              onCheckoutPress={openCart}
              checkoutLabel={`View cart (${itemCount})`}
            />
          )}

          {hasBottomSheet && showCart ? (
            <BottomSheet
              ref={bottomSheetRef}
              index={0}
              snapPoints={snapPoints}
              enablePanDownToClose
              onClose={closeCart}
              onChange={(index) => {
                if (index === -1) setShowCart(false);
              }}
            >
              <BottomSheetScrollView contentContainerStyle={{ padding: spacing.md }}>
                {cartBody}
              </BottomSheetScrollView>
            </BottomSheet>
          ) : null}

          {!hasBottomSheet ? (
            <Modal visible={showCart} animationType="slide" onRequestClose={closeCart}>
              <View style={styles.modalCart}>{cartBody}</View>
            </Modal>
          ) : null}

          <SaleFeedbackSheet
            open={showFeedback}
            onOpenChange={setShowFeedback}
            totalAmount={totalAmount}
            itemCount={itemCount}
            customerName={customerName || 'Walk-in Customer'}
            currencyCode={currencyCode}
            onSubmit={processSale}
            onSkip={() =>
              processSale({ engagementType: 'direct', notes: '', sentiment: 0 })
            }
          />
        </Screen>

        {itemCount > 0 && !showCart ? (
          <Pressable style={styles.fab} onPress={openCart} hitSlop={hitSlop}>
            <ShoppingCart size={20} color={colors.primaryForeground} />
            <AppText style={styles.fabText}>{itemCount}</AppText>
          </Pressable>
        ) : null}
      </GestureHandlerRootView>
    </ComponentGate>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: { position: 'absolute', left: 12, zIndex: 1 },
  searchInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingLeft: 40,
    paddingRight: spacing.md,
    backgroundColor: colors.card,
    fontSize: 16,
    color: colors.foreground,
  },
  cartBody: { gap: spacing.sm },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cartTitle: { fontSize: 18, fontWeight: '700' },
  cartLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lineName: { fontWeight: '500', fontSize: 14 },
  lineMeta: { fontSize: 12, marginTop: 2 },
  lineTotal: { fontWeight: '700' },
  photoBlock: { alignItems: 'center', gap: spacing.sm, marginVertical: spacing.sm },
  photo: { width: 120, height: 120, borderRadius: radius.md },
  modalCart: {
    flex: 1,
    padding: spacing.md,
    paddingTop: spacing.xl,
    backgroundColor: colors.background,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.lg,
    minWidth: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
  },
  fabText: { color: colors.primaryForeground, fontWeight: '700' },
});
