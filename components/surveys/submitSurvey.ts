/**
 * Submit survey via sync_record_survey (interaction + response + points).
 * Offline: enqueue interactions + survey_responses separately.
 */
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';
import { writeWithOfflineQueue } from '@/services/offlineQueue';
import { getCurrentLocation } from '@/utils/location';
import type { SurveyResponsesMap } from './types';

function newClientOpId(): string {
  // UUID-ish for sync_record_survey / client_sync_operations
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type SubmitSurveyArgs = {
  agentId: string;
  workspaceId: string;
  surveyTemplateId: string;
  surveyName: string;
  responses: SurveyResponsesMap;
  startedAt: string;
  points?: number;
};

export async function submitSurveyResponse(
  args: SubmitSurveyArgs,
): Promise<{ synced: boolean }> {
  const completedAt = new Date().toISOString();
  const startedMs = Date.parse(args.startedAt);
  const durationSeconds = Number.isFinite(startedMs)
    ? Math.max(0, Math.round((Date.now() - startedMs) / 1000))
    : 0;

  let locationLat: number | null = null;
  let locationLng: number | null = null;
  try {
    const loc = await getCurrentLocation();
    locationLat = loc.latitude;
    locationLng = loc.longitude;
  } catch {
    // Location optional — still submit.
  }

  const payload = {
    surveyTemplateId: args.surveyTemplateId,
    surveyName: args.surveyName,
    responses: args.responses,
    startedAt: args.startedAt,
    completedAt,
    durationSeconds,
    locationLat: locationLat != null ? String(locationLat) : '',
    locationLng: locationLng != null ? String(locationLng) : '',
    audioUrl: '',
    points: String(args.points ?? 20),
    taskId: '',
    storeId: '',
    storeName: '',
  };

  const net = await NetInfo.fetch();
  if (net.isConnected) {
    const { data, error } = await supabase.rpc('sync_record_survey', {
      p_client_operation_id: newClientOpId(),
      p_workspace_id: args.workspaceId,
      p_payload: payload,
    });

    if (!error && data && typeof data === 'object' && (data as { success?: boolean }).success) {
      return { synced: true };
    }
  }

  // Offline / RPC failure — queue interaction + response (points awarded on sync if RPC used later).
  const { synced: interactionSynced } = await writeWithOfflineQueue(
    'interactions',
    {
      agent_id: args.agentId,
      workspace_id: args.workspaceId,
      interaction_type: 'survey',
      outcome: 'completed',
      quantity_sold: 0,
      survey_template_id: args.surveyTemplateId,
      latitude: locationLat,
      longitude: locationLng,
      metadata: {
        survey_template_id: args.surveyTemplateId,
        survey_name: args.surveyName,
      },
    },
  );

  const { synced: responseSynced } = await writeWithOfflineQueue('survey_responses', {
    agent_id: args.agentId,
    workspace_id: args.workspaceId,
    survey_template_id: args.surveyTemplateId,
    responses: args.responses,
    started_at: args.startedAt,
    completed_at: completedAt,
    duration_seconds: durationSeconds,
    completion_time_seconds: durationSeconds,
    is_completed: true,
    completion_status: 'completed',
    location_lat: locationLat,
    location_lng: locationLng,
  });

  return { synced: interactionSynced && responseSynced };
}
