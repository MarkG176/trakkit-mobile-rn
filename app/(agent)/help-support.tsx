import { ScrollView, Text } from 'react-native';
import { ComponentGate } from '@/components/ComponentGate';

export default function HelpSupportScreen() {
  return (
    <ComponentGate code="CRM-0109">
      <ScrollView className="flex-1 bg-white px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Help & Support</Text>
        <Text className="mb-3 text-slate-700">
          Contact your supervisor or submit a support ticket from the Chat tab.
        </Text>
        <Text className="text-slate-600">
          For urgent issues during field work, call your team lead directly.
        </Text>
      </ScrollView>
    </ComponentGate>
  );
}
