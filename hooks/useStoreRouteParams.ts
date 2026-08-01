import { useLocalSearchParams } from 'expo-router';

/** Optional store context passed via expo-router search params. */
export function useStoreRouteParams(): {
  storeId: string | null;
  storeName: string | null;
} {
  const params = useLocalSearchParams<{ storeId?: string; storeName?: string }>();
  const storeId = typeof params.storeId === 'string' && params.storeId.trim()
    ? params.storeId.trim()
    : null;
  const storeName =
    typeof params.storeName === 'string' && params.storeName.trim()
      ? params.storeName.trim()
      : null;
  return { storeId, storeName };
}

export function storeIdPayload(storeId: string | null | undefined): { store_id?: string } {
  return storeId ? { store_id: storeId } : {};
}
