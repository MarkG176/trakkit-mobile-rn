import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { FormField } from '@/components/forms/FormField';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { workspaceService } from '@/services/workspaceService';
import { writeWithOfflineQueue } from '@/services/offlineQueue';

export default function SupportTicketScreen() {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user || !subject || !message) {
      Alert.alert('Missing fields', 'Enter subject and message.');
      return;
    }
    setLoading(true);
    try {
      const payload = workspaceService.ensureWorkspaceContext({
        agent_id: user.id,
        agent_email: user.email ?? null,
        message: `${subject}\n\n${message}`,
        ticket_type: 'general',
        status: 'open',
      });
      const { synced } = await writeWithOfflineQueue('support_tickets', payload);
      Alert.alert(synced ? 'Ticket submitted' : 'Saved offline');
      setSubject('');
      setMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentGate code="CRM-0110">
      <ScrollView className="flex-1 bg-white px-4 py-6">
        <Text className="mb-4 text-xl font-bold text-slate-900">Support Ticket</Text>
        <FormField label="Subject" value={subject} onChangeText={setSubject} />
        <FormField label="Message" value={message} onChangeText={setMessage} multiline numberOfLines={5} />
        <TouchableOpacity className="rounded-xl bg-blue-600 py-4" onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-center font-semibold text-white">Submit ticket</Text>}
        </TouchableOpacity>
      </ScrollView>
    </ComponentGate>
  );
}
