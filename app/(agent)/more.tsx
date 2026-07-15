import { useRouter } from 'expo-router';
import { ComponentGate } from '@/components/ComponentGate';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { Screen, PageHeader, ListItemCard } from '@/components/ui';

const LINKS = [
  { code: 'CRM-0105', label: 'Interaction History', path: '/(agent)/interaction-history' as const },
  { code: 'CRM-0106', label: 'Sales Activities', path: '/(agent)/sales-activities' as const },
  { code: 'CRM-0107', label: 'Giveaway Activities', path: '/(agent)/giveaway-activities' as const },
  { code: 'CRM-0108', label: 'Survey Activities', path: '/(agent)/survey-activities' as const },
  { code: 'CRM-0109', label: 'Help & Support', path: '/(agent)/help-support' as const },
  { code: 'CRM-0111', label: 'Manage Agents', path: '/(agent)/manage-agents' as const },
  { code: 'CRM-0101', label: 'Settings', path: '/(agent)/settings' as const },
];

export default function MoreScreen() {
  const router = useRouter();
  const { isEnabled } = useProjectComponents();

  return (
    <ComponentGate code="CRM-0100">
      <Screen scroll>
        <PageHeader title="More" />
        {LINKS.filter((l) => isEnabled(l.code)).map((link) => (
          <ListItemCard
            key={link.code}
            title={link.label}
            onPress={() => router.push(link.path)}
          />
        ))}
      </Screen>
    </ComponentGate>
  );
}
