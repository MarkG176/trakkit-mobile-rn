import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ComponentGate } from '@/components/ComponentGate';
import { EveningReportForm } from '@/components/reports/EveningReportForm';
import { ClosingReportForm } from '@/components/reports/ClosingReportForm';
import { StockReportDialog } from '@/components/reports/StockReportDialog';
import { OpeningStockCountDialog } from '@/components/reports/OpeningStockCountDialog';
import { SurveyClosingReportForm } from '@/components/reports/SurveyClosingReportForm';
import { SeedingEveningReportForm } from '@/components/reports/SeedingEveningReportForm';
import { PriceReportForm } from '@/components/reports/PriceReportForm';
import {
  ReportsImagesCard,
  ReportsNotesCard,
  StockReportsLauncher,
  type ReportTileItem,
} from '@/components/reports/ReportsHub';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { workspaceService } from '@/services/workspaceService';
import { Screen, EmptyMessage } from '@/components/ui';
import type { StockLevelValue } from '@/components/reports/shared';

/** Full-screen forms (not availability dialogs). */
type ActiveReport =
  | 'evening'
  | 'closing'
  | 'survey_closing'
  | 'seeding_evening'
  | 'price'
  | null;

type EveningCode = 'CRM-0019' | 'CRM-0020' | 'CRM-0023';

type AvailabilityDialog = 'morning' | 'evening' | null;

function pickEveningCode(
  isEnabled: (code: string) => boolean,
  teamType: string,
  inStore: boolean,
): EveningCode | null {
  if (teamType.includes('survey') && isEnabled('CRM-0023')) return 'CRM-0023';
  if (inStore && isEnabled('CRM-0020')) return 'CRM-0020';
  if (isEnabled('CRM-0019')) return 'CRM-0019';
  if (isEnabled('CRM-0020')) return 'CRM-0020';
  if (isEnabled('CRM-0023')) return 'CRM-0023';
  return null;
}

function formForActive(
  active: Exclude<ActiveReport, null>,
  eveningCode: EveningCode | null,
  stockLevels: Record<string, StockLevelValue>,
): ReactNode {
  switch (active) {
    case 'evening':
      if (eveningCode === 'CRM-0020') return <ClosingReportForm />;
      if (eveningCode === 'CRM-0023') return <SurveyClosingReportForm />;
      return <EveningReportForm />;
    case 'closing':
      return <ClosingReportForm />;
    case 'survey_closing':
      return <SurveyClosingReportForm />;
    case 'seeding_evening':
      return <SeedingEveningReportForm />;
    case 'price':
      return <PriceReportForm stockLevels={stockLevels} />;
  }
}

export default function ReportsScreen() {
  const { currentWorkspaceLabel } = useWorkspace();
  const { isEnabled } = useProjectComponents();
  const [active, setActive] = useState<ActiveReport>(null);
  const [availabilityDialog, setAvailabilityDialog] = useState<AvailabilityDialog>(null);
  const [countOpen, setCountOpen] = useState(false);
  const [stockLevels, setStockLevels] = useState<Record<string, StockLevelValue>>({});

  const teamType = currentWorkspaceLabel?.toLowerCase() ?? '';
  const inStore = teamType.includes('instore') || workspaceService.isCurrentWorkspaceInStoreMode();

  /** Web: CRM-0022 ≈ availability; CRM-0021 ≈ morning count (chain after availability when in-store). */
  const showMorningAvailability = isEnabled('CRM-0022') || isEnabled('CRM-0021');
  const showMorningCount = isEnabled('CRM-0021') && inStore;
  const eveningCode = useMemo(
    () => pickEveningCode(isEnabled, teamType, inStore),
    [isEnabled, teamType, inStore],
  );
  const showEvening = eveningCode != null;
  const showPrice = isEnabled('CRM-0025');

  const handleMorningComplete = useCallback(
    (levels: Record<string, StockLevelValue>) => {
      setStockLevels(levels);
      setAvailabilityDialog(null);
      if (showMorningCount) {
        setCountOpen(true);
      }
    },
    [showMorningCount],
  );

  const morning = useMemo((): ReportTileItem | null => {
    if (!showMorningAvailability) return null;
    return {
      key: 'morning',
      title: 'Stock Availability',
      icon: 'sunny-outline',
      primary: true,
      onPress: () => setAvailabilityDialog('morning'),
    };
  }, [showMorningAvailability]);

  const evening = useMemo((): ReportTileItem | null => {
    if (!showEvening) return null;
    return {
      key: 'evening',
      title: 'Start Evening Report',
      icon: 'moon-outline',
      onPress: () => {
        if (eveningCode === 'CRM-0020' || eveningCode === 'CRM-0023') {
          setActive('evening');
        } else if (showMorningAvailability) {
          setAvailabilityDialog('evening');
        } else {
          setActive('evening');
        }
      },
    };
  }, [showEvening, eveningCode, showMorningAvailability]);

  const moreTiles = useMemo((): ReportTileItem[] => {
    const items: ReportTileItem[] = [];

    if (showPrice) {
      items.push({
        key: 'price',
        title: 'Price Report',
        icon: 'pricetag-outline',
        onPress: () => setActive('price'),
      });
    }

    if (isEnabled('CRM-0024')) {
      items.push({
        key: 'CRM-0024',
        title: 'Seeding Evening Report',
        icon: 'leaf-outline',
        onPress: () => setActive('seeding_evening'),
      });
    }

    const used = eveningCode;
    if (isEnabled('CRM-0020') && used !== 'CRM-0020') {
      items.push({
        key: 'closing',
        title: 'Closing Report',
        icon: 'storefront-outline',
        onPress: () => setActive('closing'),
      });
    }
    if (isEnabled('CRM-0023') && used !== 'CRM-0023') {
      items.push({
        key: 'survey_closing',
        title: 'Survey Closing Report',
        icon: 'clipboard-outline',
        onPress: () => setActive('survey_closing'),
      });
    }

    return items;
  }, [showPrice, eveningCode, isEnabled]);

  const hasAny = morning || evening || moreTiles.length > 0;

  if (active) {
    return (
      <ComponentGate code="CRM-0099" redirectTo="/(agent)">
        <Screen scroll showBack onBack={() => setActive(null)}>
          {formForActive(active, eveningCode, stockLevels)}
        </Screen>
      </ComponentGate>
    );
  }

  return (
    <ComponentGate code="CRM-0099" redirectTo="/(agent)">
      <Screen scroll>
        {!hasAny ? (
          <EmptyMessage>No reports enabled for this project.</EmptyMessage>
        ) : (
          <>
            <StockReportsLauncher morning={morning} evening={evening} moreTiles={moreTiles} />
            <ReportsNotesCard />
            <ReportsImagesCard />
          </>
        )}
      </Screen>

      <StockReportDialog
        open={availabilityDialog === 'morning'}
        onOpenChange={(next) => {
          if (!next) setAvailabilityDialog(null);
        }}
        reportType="morning"
        requireAll
        onComplete={handleMorningComplete}
      />

      <StockReportDialog
        open={availabilityDialog === 'evening'}
        onOpenChange={(next) => {
          if (!next) setAvailabilityDialog(null);
        }}
        reportType="evening"
      />

      <OpeningStockCountDialog
        open={countOpen}
        onOpenChange={setCountOpen}
        stockLevels={stockLevels}
      />
    </ComponentGate>
  );
}
