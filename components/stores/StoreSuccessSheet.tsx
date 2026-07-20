// [CRM-0055] StoreSuccessSheet — quick actions after store assign/add
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  CheckCircle2,
  ClipboardList,
  Gift,
  ShoppingCart,
  X,
} from 'lucide-react-native';
import { AppText, Button, Card } from '@/components/ui';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { colors, hitSlop, radius, spacing } from '@/theme';

interface StoreSuccessSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  storeName: string;
  storeCounty?: string;
}

export function StoreSuccessSheet({
  open,
  onOpenChange,
  storeId,
  storeName,
  storeCounty,
}: StoreSuccessSheetProps) {
  const router = useRouter();
  const { currentWorkspaceLabel } = useWorkspace();
  const isMarketResearch =
    currentWorkspaceLabel?.toLowerCase() === 'market_research';

  const go = (path: `/(agent)/${string}`) => {
    onOpenChange(false);
    router.push({ pathname: path, params: { storeId, storeName } } as never);
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={() => onOpenChange(false)}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <View style={styles.header}>
              <CheckCircle2 size={24} color={colors.success} />
              <AppText style={styles.title}>Store Added Successfully!</AppText>
            </View>
            <Pressable
              onPress={() => onOpenChange(false)}
              hitSlop={hitSlop}
              accessibilityLabel="Close"
            >
              <X size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <Card style={styles.storeCard}>
            <AppText style={styles.storeName}>{storeName}</AppText>
            {storeCounty ? (
              <AppText variant="secondary">{storeCounty}</AppText>
            ) : null}
          </Card>

          <AppText variant="secondary" style={styles.hint}>
            Quick Actions for this store:
          </AppText>

          <View style={styles.grid}>
            <Pressable
              style={styles.tile}
              onPress={() => go('/(agent)/surveys')}
              hitSlop={hitSlop}
            >
              <ClipboardList size={24} color={colors.primary} />
              <AppText style={styles.tileLabel}>Start Survey</AppText>
            </Pressable>

            {!isMarketResearch ? (
              <>
                <Pressable
                  style={styles.tile}
                  onPress={() => go('/(agent)/record-sale')}
                  hitSlop={hitSlop}
                >
                  <ShoppingCart size={24} color={colors.primary} />
                  <AppText style={styles.tileLabel}>Record Sale</AppText>
                </Pressable>
                <Pressable
                  style={styles.tile}
                  onPress={() => go('/(agent)/give-products')}
                  hitSlop={hitSlop}
                >
                  <Gift size={24} color={colors.primary} />
                  <AppText style={styles.tileLabel}>Give Products</AppText>
                </Pressable>
              </>
            ) : null}
          </View>

          <Button variant="ghost" onPress={() => onOpenChange(false)}>
            Close
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: colors.foreground, flexShrink: 1 },
  storeCard: { backgroundColor: colors.muted },
  storeName: { fontWeight: '600', marginBottom: 2 },
  hint: { fontSize: 14 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '47%',
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    padding: spacing.md,
  },
  tileLabel: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
});
