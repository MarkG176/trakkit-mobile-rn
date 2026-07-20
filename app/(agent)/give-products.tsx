// [CRM-0095] Give Products — giveaway cart with recipient and per-line interaction submit
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { CartItem, ProductCart } from '@/components/sales/ProductCart';
import { Screen, AppText, Button, Input, LoadingSpinner } from '@/components/ui';
import { useInventory } from '@/hooks/useInventory';
import { useProductFocusInventory } from '@/hooks/useProductFocusInventory';
import { useInteractionForm } from '@/hooks/useInteractionForm';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { colors, radius, spacing } from '@/theme';

export default function GiveProductsScreen() {
  const router = useRouter();
  const { currentWorkspaceId, currentWorkspaceLabel } = useWorkspace();
  const { inventory, loading: inventoryLoading } = useInventory();
  const { products: productFocusProducts, loading: productFocusLoading } =
    useProductFocusInventory();
  const { submitInteraction, loading } = useInteractionForm();

  const isWholesale = currentWorkspaceLabel?.toLowerCase() === 'wholesale';
  const sourceProducts = isWholesale ? productFocusProducts : inventory;
  const sourceLoading = isWholesale ? productFocusLoading : inventoryLoading;

  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setCartItems([]);
  }, [currentWorkspaceId]);

  const products = useMemo(
    () =>
      sourceProducts.map((item) => ({
        productVariantId: item.product_variant_id,
        name: item.name,
        sku: item.sku,
        price: 0,
        maxQuantity: isWholesale
          ? 999
          : 'amount_issued' in item
            ? (item as { amount_issued: number }).amount_issued
            : 999,
      })),
    [sourceProducts, isWholesale],
  );

  const submit = async () => {
    if (cartItems.length === 0) {
      Alert.alert('No products', 'Select at least one product to give away.');
      return;
    }
    if (!recipientName.trim()) {
      Alert.alert('Recipient required', 'Enter the recipient name.');
      return;
    }

    let allOk = true;
    for (const item of cartItems) {
      const ok = await submitInteraction({
        interactionType: 'giveaway',
        customerName: recipientName.trim(),
        notes,
        sentiment: 0,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
      });
      if (!ok) {
        allOk = false;
        break;
      }
    }

    if (allOk) {
      Alert.alert('Giveaway recorded', 'Products handed out successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      setCartItems([]);
      setRecipientName('');
      setNotes('');
    }
  };

  return (
    <ComponentGate code="CRM-0095" redirectTo="/(agent)">
      <Screen showBack style={{ flex: 1, padding: 0 }}>
        <View style={styles.form}>
          <Input
            label="Recipient name"
            value={recipientName}
            onChangeText={setRecipientName}
            placeholder="Customer or store contact"
          />
          <Input
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add giveaway notes…"
            multiline
            numberOfLines={2}
            style={{ minHeight: 64, textAlignVertical: 'top' }}
          />
          <View style={styles.searchWrap}>
            <Search size={16} color={colors.mutedForeground} style={styles.searchIcon} />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search products…"
              placeholderTextColor={colors.mutedForeground}
              style={styles.searchInput}
            />
          </View>
        </View>

        {sourceLoading ? (
          <LoadingSpinner label="Loading products" />
        ) : (
          <View style={{ flex: 1, paddingHorizontal: spacing.md }}>
            <ProductCart
              mode="giveaway"
              products={products}
              cartItems={cartItems}
              onCartChange={setCartItems}
              searchTerm={searchTerm}
              hideInventoryCounts={isWholesale}
              onCheckoutPress={submit}
              checkoutLabel="Record giveaway"
              loading={loading}
            />
          </View>
        )}

        {cartItems.length > 0 ? (
          <View style={styles.bottomSubmit}>
            <AppText variant="secondary">
              {cartItems.reduce((s, i) => s + i.quantity, 0)} item(s) selected
            </AppText>
            <Button onPress={submit} loading={loading}>
              Submit giveaway
            </Button>
          </View>
        ) : null}
      </Screen>
    </ComponentGate>
  );
}

const styles = StyleSheet.create({
  form: { paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  searchWrap: { position: 'relative', justifyContent: 'center', marginBottom: spacing.sm },
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
  bottomSubmit: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing.sm,
  },
});
