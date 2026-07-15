import { useState } from 'react';
import { Alert } from 'react-native';
import { FormField } from '@/components/forms/FormField';
import { ComponentGate } from '@/components/ComponentGate';
import { useAuth } from '@/providers/AuthProvider';
import { workspaceService } from '@/services/workspaceService';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { Screen, PageHeader, Button } from '@/components/ui';

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
      <Screen scroll>
        <PageHeader title="Support Ticket" />
        <FormField label="Subject" value={subject} onChangeText={setSubject} />
        <FormField label="Message" value={message} onChangeText={setMessage} multiline numberOfLines={5} />
        <Button onPress={submit} loading={loading}>
          Submit ticket
        </Button>
      </Screen>
    </ComponentGate>
  );
}
