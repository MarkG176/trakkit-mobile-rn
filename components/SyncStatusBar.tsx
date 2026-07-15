import { useEffect, useState } from 'react';
import { View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { offlineQueue } from '@/services/offlineQueue';
import { AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';

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
      style={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        backgroundColor: isOnline ? colors.warning : colors.destructive,
      }}
    >
      <AppText style={{ textAlign: 'center', color: colors.primaryForeground, fontSize: 12, fontWeight: '500' }}>
        {!isOnline
          ? 'Offline — changes will sync when connected'
          : `Syncing ${pendingCount} pending change${pendingCount === 1 ? '' : 's'}...`}
      </AppText>
    </View>
  );
}
