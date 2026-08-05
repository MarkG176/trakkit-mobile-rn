import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useAgentStatus } from '@/providers/AgentStatusProvider';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import {
  hasAcknowledgedBackgroundLocationDisclosure,
  markBackgroundLocationDisclosureAcknowledged,
} from '@/services/backgroundLocationDisclosureStorage';
import { setBackgroundLocationDisclosureBlocking } from '@/utils/backgroundLocationDisclosureGate';
import { requestBackgroundLocationPermission } from '@/utils/location';
import { startBackgroundTracking } from '@/tasks/backgroundLocation';

type OpenHandler = (opts?: { force?: boolean }) => void;

let openHandler: OpenHandler | null = null;

/** Open the disclosure from Settings (or elsewhere) before requesting background permission. */
export function openBackgroundLocationDisclosure(opts?: { force?: boolean }): void {
  if (!openHandler) {
    console.warn('[openBackgroundLocationDisclosure] host is not mounted');
    return;
  }
  openHandler(opts);
}

export type BackgroundLocationDisclosureState = {
  visible: boolean;
  continuing: boolean;
  continueAndRequest: () => void;
  dismissForNow: () => void;
};

export function useBackgroundLocationDisclosure(): BackgroundLocationDisclosureState {
  const { user } = useAuth();
  const { currentWorkspaceId, isInitialized } = useWorkspace();
  const { isCheckedIn } = useAgentStatus();
  const { isEnabled, isLoaded } = useProjectComponents();

  const [visible, setVisible] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const checkingRef = useRef(false);
  const lastAutoKeyRef = useRef<string | null>(null);

  const featureEnabled = isEnabled('CRM-0005');

  const releaseGate = useCallback(() => {
    setBackgroundLocationDisclosureBlocking(false);
  }, []);

  const markAcknowledged = useCallback(async () => {
    if (!user?.id || !currentWorkspaceId) return;
    await markBackgroundLocationDisclosureAcknowledged(user.id, currentWorkspaceId);
  }, [user?.id, currentWorkspaceId]);

  const open = useCallback(
    (opts?: { force?: boolean }) => {
      setVisible(true);
      setBackgroundLocationDisclosureBlocking(true);
      if (opts?.force && user?.id && currentWorkspaceId) {
        lastAutoKeyRef.current = `${user.id}:${currentWorkspaceId}`;
      }
    },
    [user?.id, currentWorkspaceId],
  );

  useEffect(() => {
    openHandler = open;
    return () => {
      if (openHandler === open) openHandler = null;
    };
  }, [open]);

  useEffect(() => {
    if (!user?.id || !currentWorkspaceId || !isInitialized || !isLoaded) return;

    if (!featureEnabled) {
      releaseGate();
      return;
    }

    const key = `${user.id}:${currentWorkspaceId}`;
    if (lastAutoKeyRef.current === key) return;

    // Block the app tour immediately so both modals never stack.
    setBackgroundLocationDisclosureBlocking(true);

    let cancelled = false;

    const maybeAutoOpen = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        const acknowledged = await hasAcknowledgedBackgroundLocationDisclosure(
          user.id,
          currentWorkspaceId,
        );
        if (cancelled) return;
        lastAutoKeyRef.current = key;
        if (!acknowledged) {
          setVisible(true);
        } else {
          releaseGate();
        }
      } catch {
        if (!cancelled) releaseGate();
      } finally {
        checkingRef.current = false;
      }
    };

    maybeAutoOpen();
    return () => {
      cancelled = true;
    };
  }, [user?.id, currentWorkspaceId, isInitialized, isLoaded, featureEnabled, releaseGate]);

  useEffect(() => {
    return () => {
      setBackgroundLocationDisclosureBlocking(false);
    };
  }, []);

  const continueAndRequest = useCallback(async () => {
    if (continuing) return;
    setContinuing(true);
    try {
      await markAcknowledged();
      // Close disclosure first; keep tour blocked until OS prompts finish.
      setVisible(false);
      const granted = await requestBackgroundLocationPermission();
      if (granted && isCheckedIn) {
        await startBackgroundTracking();
      }
    } finally {
      setContinuing(false);
      setVisible(false);
      releaseGate();
    }
  }, [continuing, markAcknowledged, releaseGate, isCheckedIn]);

  const dismissForNow = useCallback(() => {
    setVisible(false);
    releaseGate();
  }, [releaseGate]);

  return {
    visible,
    continuing,
    continueAndRequest: () => {
      void continueAndRequest();
    },
    dismissForNow,
  };
}
