import { ComponentGate } from '@/components/ComponentGate';
import { EveningReportForm } from '@/components/reports/EveningReportForm';
import { ClosingReportForm } from '@/components/reports/ClosingReportForm';
import { MorningStockReportForm } from '@/components/reports/MorningStockReportForm';
import { StockReportForm } from '@/components/reports/StockReportForm';
import { SurveyClosingReportForm } from '@/components/reports/SurveyClosingReportForm';
import { SeedingEveningReportForm } from '@/components/reports/SeedingEveningReportForm';
import { PriceReportForm } from '@/components/reports/PriceReportForm';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { workspaceService } from '@/services/workspaceService';
import { Screen } from '@/components/ui';

export default function ReportsScreen() {
  const { currentWorkspaceLabel } = useWorkspace();
  const teamType = currentWorkspaceLabel?.toLowerCase() ?? '';
  const inStore = teamType.includes('instore') || workspaceService.isCurrentWorkspaceInStoreMode();
  const showEvening =
    !teamType.includes('instore') && !teamType.includes('seeding') && !teamType.includes('survey');
  const showSurvey = teamType.includes('survey');
  const showSeeding = teamType.includes('seeding');

  return (
    <ComponentGate code="CRM-0099" redirectTo="/(agent)">
      <Screen scroll>
        {showEvening ? (
          <ComponentGate code="CRM-0019">
            <EveningReportForm />
          </ComponentGate>
        ) : null}

        {inStore ? (
          <ComponentGate code="CRM-0020">
            <ClosingReportForm />
          </ComponentGate>
        ) : null}

        {inStore ? (
          <ComponentGate code="CRM-0021">
            <MorningStockReportForm />
          </ComponentGate>
        ) : null}

        <ComponentGate code="CRM-0022">
          <StockReportForm />
        </ComponentGate>

        {showSurvey ? (
          <ComponentGate code="CRM-0023">
            <SurveyClosingReportForm />
          </ComponentGate>
        ) : null}

        {showSeeding ? (
          <ComponentGate code="CRM-0024">
            <SeedingEveningReportForm />
          </ComponentGate>
        ) : null}

        <ComponentGate code="CRM-0025">
          <PriceReportForm />
        </ComponentGate>
      </Screen>
    </ComponentGate>
  );
}
