import { useState } from 'react';
import { Alert } from 'react-native';
import { ComponentGate } from '@/components/ComponentGate';
import { SetAssignedLocationCard } from '@/components/stores/SetAssignedLocationCard';
import { AddStoreCard } from '@/components/stores/AddStoreCard';
import {
  StoreSuccessSheet,
  type AddedStoreInfo,
} from '@/components/stores/StoreSuccessSheet';
import { StockReportDialog } from '@/components/reports/StockReportDialog';
import { Screen, EmptyMessage } from '@/components/ui';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { useWorkspaceStores } from '@/hooks/useWorkspaceStores';
import type { StockLevelValue } from '@/components/reports/shared';
import { spacing } from '@/theme';

export default function RoutesScreen() {
  const { isEnabled } = useProjectComponents();
  const { stores, loading, refresh } = useWorkspaceStores();

  const [successStore, setSuccessStore] = useState<AddedStoreInfo | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [stockLevels, setStockLevels] = useState<Record<string, StockLevelValue>>({});

  const showSetLocation = isEnabled('CRM-0098A');
  const showAddStore = isEnabled('CRM-0098L');
  const showSuccessHub = isEnabled('CRM-0055');
  const hasAnyAction = showSetLocation || showAddStore;

  const handleStoreSuccess = (store: AddedStoreInfo) => {
    setSuccessStore(store);
    setStockLevels({});
    if (showSuccessHub) {
      setSuccessOpen(true);
    } else {
      Alert.alert('Store added', `${store.name} was added successfully.`);
    }
  };

  const openStockFromHub = () => {
    setSuccessOpen(false);
    setStockOpen(true);
  };

  return (
    <ComponentGate code="CRM-0098" redirectTo="/(agent)">
      <Screen
        scroll
        scrollProps={{
          contentContainerStyle: {
            padding: spacing.md,
            paddingBottom: spacing.xl,
            gap: spacing.md,
          },
        }}
      >
        {!hasAnyAction ? (
          <EmptyMessage>No Stores actions are enabled for this workspace.</EmptyMessage>
        ) : (
          <>
            {showSetLocation ? (
              <SetAssignedLocationCard stores={stores} storesLoading={loading} />
            ) : null}
            {showAddStore ? (
              <AddStoreCard
                onStoreAdded={refresh}
                onSuccess={handleStoreSuccess}
              />
            ) : null}
          </>
        )}
      </Screen>

      {showSuccessHub ? (
        <StoreSuccessSheet
          open={successOpen}
          onOpenChange={setSuccessOpen}
          store={successStore}
          stockLevels={stockLevels}
          onRequestStockReport={openStockFromHub}
        />
      ) : null}

      <StockReportDialog
        open={stockOpen}
        onOpenChange={(open) => {
          setStockOpen(open);
          if (!open && successStore && showSuccessHub) {
            setSuccessOpen(true);
          }
        }}
        reportType="morning"
        storeId={successStore?.id}
        onComplete={(levels) => {
          setStockLevels(levels);
          setStockOpen(false);
          if (successStore && showSuccessHub) {
            setSuccessOpen(true);
          }
        }}
      />
    </ComponentGate>
  );
}
