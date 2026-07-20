import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '@/components/forms/FormField';
import { GeoCapture } from '@/components/forms/GeoCapture';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { workspaceService } from '@/services/workspaceService';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { formatCurrencySimple } from '@/utils/currency';
import { useInventory, type InventoryItem } from '@/hooks/useInventory';
import {
  Screen,
  Button,
  AppText,
  LoadingSpinner,
  EmptyMessage,
} from '@/components/ui';
import { colors, hitSlop, radius, spacing } from '@/theme';

export default function RecordSaleScreen() {
  const { user } = useAuth();
  const { inventory, loading: inventoryLoading } = useInventory();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const currency = workspaceService.getProjectCurrencyCode();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return inventory;
    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.sku?.toLowerCase().includes(term) ?? false),
    );
  }, [inventory, search]);

  const pickProduct = (item: InventoryItem) => {
    setSelected(item);
    if (item.price > 0) {
      setPrice(String(item.price));
    }
    setPickerOpen(false);
    setSearch('');
  };

  const submit = async () => {
    if (!user || !selected || !price || lat == null || lon == null) {
      Alert.alert('Missing fields', 'Select a product, enter price, and wait for location.');
      return;
    }

    setLoading(true);
    try {
      const qty = parseInt(quantity, 10) || 1;
      const unitPrice = parseFloat(price);
      const payload = workspaceService.ensureWorkspaceContext({
        agent_id: user.id,
        product_name: selected.name,
        product_variant_id: selected.product_variant_id,
        quantity: qty,
        unit_price: unitPrice,
        total_price: qty * unitPrice,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
      });

      const { synced } = await writeWithOfflineQueue('sale_items', payload);
      Alert.alert(
        synced ? 'Sale recorded' : 'Saved offline',
        synced ? 'Sale submitted successfully.' : 'Will sync when connected.',
      );
      setSelected(null);
      setPrice('');
      setQuantity('1');
      setCustomerName('');
      setCustomerPhone('');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to record sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentGate code="CRM-0094" redirectTo="/(agent)">
      <Screen scroll showBack>
        <AppText variant="h3" style={{ fontWeight: '700', marginBottom: spacing.xs }}>
          Record sale
        </AppText>
        <AppText variant="secondary" style={{ marginBottom: spacing.lg }}>
          Capture units sold and amount for this visit.
        </AppText>

        <AppText style={{ fontWeight: '500', marginBottom: spacing.sm }}>Product</AppText>
        <Pressable
          onPress={() => setPickerOpen(true)}
          hitSlop={hitSlop}
          style={({ pressed }) => ({
            minHeight: 48,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: pressed ? colors.muted : colors.card,
            marginBottom: spacing.lg,
          })}
        >
          <AppText
            style={{
              flex: 1,
              flexShrink: 1,
              color: selected ? colors.foreground : colors.secondaryForeground,
            }}
            numberOfLines={2}
          >
            {selected ? selected.name : 'Select product...'}
          </AppText>
          <Ionicons name="chevron-down" size={18} color={colors.secondaryForeground} />
        </Pressable>

        <FormField
          label="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="number-pad"
        />
        <FormField
          label={`Unit price (${currency})`}
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
        />
        {price && quantity ? (
          <AppText variant="secondary" style={{ marginBottom: spacing.lg }}>
            Total:{' '}
            {formatCurrencySimple(
              (parseInt(quantity, 10) || 1) * parseFloat(price || '0'),
              currency,
            )}
          </AppText>
        ) : null}
        <FormField
          label="Customer name (optional)"
          value={customerName}
          onChangeText={setCustomerName}
        />
        <FormField
          label="Customer phone (optional)"
          value={customerPhone}
          onChangeText={setCustomerPhone}
          keyboardType="phone-pad"
        />
        <GeoCapture
          onLocation={(a, b) => {
            setLat(a);
            setLon(b);
          }}
        />
        <Button onPress={submit} loading={loading} disabled={!selected}>
          Submit sale
        </Button>
      </Screen>

      <Modal
        visible={pickerOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: spacing.md }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing.lg,
              marginBottom: spacing.md,
              gap: spacing.sm,
            }}
          >
            <AppText variant="h3" style={{ fontWeight: '700', flex: 1 }}>
              Select product
            </AppText>
            <Pressable onPress={() => setPickerOpen(false)} hitSlop={hitSlop}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md,
                backgroundColor: colors.card,
                minHeight: 48,
              }}
            >
              <Ionicons name="search" size={18} color={colors.secondaryForeground} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search products..."
                placeholderTextColor={colors.secondaryForeground}
                style={{ flex: 1, fontSize: 16, color: colors.foreground, paddingVertical: spacing.sm }}
              />
            </View>
          </View>

          {inventoryLoading ? (
            <LoadingSpinner label="Loading products" />
          ) : filtered.length === 0 ? (
            <EmptyMessage>
              {inventory.length === 0
                ? 'No products in your inventory.'
                : 'No products match your search.'}
            </EmptyMessage>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.product_variant_id}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = selected?.product_variant_id === item.product_variant_id;
                return (
                  <Pressable
                    onPress={() => pickProduct(item)}
                    hitSlop={hitSlop}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.md,
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected
                        ? colors.accent
                        : pressed
                          ? colors.muted
                          : colors.card,
                    })}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: radius.md,
                        backgroundColor: colors.primaryLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="cart-outline" size={22} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText style={{ fontWeight: '500', flexShrink: 1 }}>{item.name}</AppText>
                      <AppText variant="secondary" style={{ marginTop: 2 }}>
                        Available: {item.amount_issued}
                        {item.price > 0
                          ? ` · ${formatCurrencySimple(item.price, currency)}`
                          : ''}
                      </AppText>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </ComponentGate>
  );
}
