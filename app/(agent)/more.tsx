import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ComponentGate } from '@/components/ComponentGate';
import { useProjectComponents } from '@/hooks/useProjectComponents';

const LINKS = [
  { code: 'CRM-0105', label: 'Interaction History', path: '/(agent)/interaction-history' },
  { code: 'CRM-0106', label: 'Sales Activities', path: '/(agent)/sales-activities' },
  { code: 'CRM-0107', label: 'Giveaway Activities', path: '/(agent)/giveaway-activities' },
  { code: 'CRM-0108', label: 'Survey Activities', path: '/(agent)/survey-activities' },
  { code: 'CRM-0109', label: 'Help & Support', path: '/(agent)/help-support' },
  { code: 'CRM-0111', label: 'Manage Agents', path: '/(agent)/manage-agents' },
  { code: 'CRM-0101', label: 'Settings', path: '/(agent)/settings' },
];

export default function MoreScreen() {
  const router = useRouter();
  const { isEnabled } = useProjectComponents();

  return (
    <ComponentGate code="CRM-0100">
      <ScrollView className="flex-1 bg-slate-50 px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">More</Text>
        {LINKS.filter((l) => isEnabled(l.code)).map((link) => (
          <TouchableOpacity
            key={link.code}
            className="mb-2 rounded-xl bg-white p-4"
            onPress={() => router.push(link.path as never)}
          >
            <Text className="font-medium text-slate-900">{link.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ComponentGate>
  );
}
