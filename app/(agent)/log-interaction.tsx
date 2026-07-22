import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormField } from '@/components/forms/FormField';
import { ComponentGate } from '@/components/ComponentGate';
import { SentimentStars } from '@/components/interactions/SentimentStars';
import { useInteractionAudio } from '@/hooks/useInteractionAudio';
import { useAuth } from '@/providers/AuthProvider';
import { workspaceService } from '@/services/workspaceService';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { Screen, Button, Card, AppText } from '@/components/ui';
import { colors, spacing } from '@/theme';

export default function LogInteractionScreen() {
  const { user } = useAuth();
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [sentiment, setSentiment] = useState(0);
  const [loading, setLoading] = useState(false);
  const {
    isRecording,
    durationLabel,
    audioUrl,
    uploading,
    startRecording,
    stopRecording,
    resetRecording,
  } = useInteractionAudio();

  const canSubmit = customerName.trim().length > 0 && !uploading;

  const submit = async () => {
    if (!user || !customerName.trim()) {
      Alert.alert('Missing fields', 'Enter the customer name.');
      return;
    }

    setLoading(true);
    try {
      let recordingUrl = audioUrl;
      if (isRecording) {
        recordingUrl = await stopRecording();
      }

      const payload = workspaceService.ensureWorkspaceContext({
        agent_id: user.id,
        interaction_type: 'other',
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        outcome: 'completed',
        quantity_sold: 0,
        metadata: {
          interaction_type: 'other',
          notes: notes.trim(),
          sentiment,
          recording_url: recordingUrl || undefined,
        },
      });

      const { synced } = await writeWithOfflineQueue('interactions', payload);
      Alert.alert(
        synced ? 'Interaction logged' : 'Saved offline',
        synced ? 'Interaction saved successfully.' : 'Will sync when connected.',
      );
      setNotes('');
      setCustomerName('');
      setCustomerPhone('');
      setSentiment(0);
      resetRecording();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to log interaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComponentGate code="CRM-0096" redirectTo="/(agent)">
      <Screen scroll showBack>
        <View style={{ gap: spacing.md, paddingBottom: spacing.lg }}>
          <Card>
            <AppText
              variant="h3"
              style={{ fontWeight: '700', marginBottom: spacing.md, color: colors.foreground }}
            >
              Interaction Details
            </AppText>
            <FormField
              label="Interaction Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Add details about the interaction..."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ minHeight: 96, height: undefined, paddingVertical: spacing.sm }}
              containerStyle={{ marginBottom: 0 }}
            />
          </Card>

          <Card>
            <AppText
              variant="h3"
              style={{ fontWeight: '700', marginBottom: spacing.md, color: colors.foreground }}
            >
              Customer Information
            </AppText>
            <FormField
              label="Customer Name *"
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Enter customer name"
            />
            <FormField
              label="Phone Number"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              containerStyle={{ marginBottom: 0 }}
            />
          </Card>

          <Card>
            <AppText
              variant="h3"
              style={{ fontWeight: '700', marginBottom: spacing.md, color: colors.foreground }}
            >
              Customer Sentiment
            </AppText>
            <SentimentStars value={sentiment} onChange={setSentiment} />
          </Card>

          <Card>
            <AppText
              variant="h3"
              style={{ fontWeight: '700', marginBottom: spacing.md, color: colors.foreground }}
            >
              Recording
            </AppText>
            <Button
              variant={isRecording ? 'destructive' : 'outline'}
              onPress={isRecording ? () => void stopRecording() : () => void startRecording()}
              loading={uploading}
              disabled={uploading}
              icon={
                uploading ? undefined : (
                  <Ionicons
                    name={isRecording ? 'stop' : 'mic'}
                    size={20}
                    color={isRecording ? colors.primaryForeground : colors.foreground}
                  />
                )
              }
            >
              {uploading
                ? 'Uploading...'
                : isRecording
                  ? `Stop Recording (${durationLabel})`
                  : 'Start Recording Audio'}
            </Button>
            {audioUrl ? (
              <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
                <AppText variant="secondary" style={{ fontSize: 14 }}>
                  Recording saved ✓
                </AppText>
                <Button variant="ghost" onPress={resetRecording}>
                  Remove recording
                </Button>
              </View>
            ) : null}
          </Card>

          <Button onPress={submit} loading={loading} disabled={!canSubmit}>
            Save Interaction
          </Button>
        </View>
      </Screen>
    </ComponentGate>
  );
}
