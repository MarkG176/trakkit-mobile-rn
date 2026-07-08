import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { offlineQueue } from '@/services/offlineQueue';

export function SyncStatusBar() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribeNet = NetInfo.addEventListener((state) => {
      setIsOnline(!!state.isConnected);
    });

    const unsubscribeQueue = offlineQueue.subscribe((count) => {
      setPendingCount(count);
    });

    return () => {
      unsubscribeNet();
      unsubscribeQueue();
    };
  }, []);

  if (isOnline && pendingCount === 0) return null;

  return (
    <View
      className={`px-4 py-2 ${isOnline ? 'bg-amber-500' : 'bg-red-600'}`}
    >
      <Text className="text-center text-xs font-medium text-white">
        {!isOnline
          ? 'Offline — changes will sync when connected'
          : `Syncing ${pendingCount} pending change${pendingCount === 1 ? '' : 's'}...`}
      </Text>
    </View>
  );
}
