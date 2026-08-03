import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkspace } from '@/providers/WorkspaceProvider';
import { useProjectComponents } from '@/hooks/useProjectComponents';
import { hasSeenAppTour, markAppTourSeen } from '@/services/appTourStorage';
import {
  buildAppTourNavItems,
  buildAppTourToolItems,
  type AppTourItem,
} from '@/utils/appTourContent';

type OpenHandler = (opts?: { force?: boolean }) => void;

let openHandler: OpenHandler | null = null;

/** Open the app tour from Help (or elsewhere). Does not clear the seen flag. */
export function openAppTour(): void {
  if (!openHandler) {
    console.warn('[openAppTour] AppTourHost is not mounted');
    return;
  }
  openHandler({ force: true });
}

export type AppTourState = {
  visible: boolean;
  stepIndex: number;
  stepCount: number;
  navItems: AppTourItem[];
  toolItems: AppTourItem[];
  goNext: () => void;
  goBack: () => void;
  skipOrFinish: () => void;
};

export function useAppTour(): AppTourState {
  const { user } = useAuth();
  const { currentWorkspaceId, isInitialized } = useWorkspace();
  const { isEnabled, isLoaded } = useProjectComponents();

  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const checkingRef = useRef(false);
  const lastAutoKeyRef = useRef<string | null>(null);

  const navItems = buildAppTourNavItems(isEnabled);
  const toolItems = buildAppTourToolItems(isEnabled);
  const stepCount = 4;

  const markSeen = useCallback(async () => {
    if (!user?.id || !currentWorkspaceId) return;
    await markAppTourSeen(user.id, currentWorkspaceId);
  }, [user?.id, currentWorkspaceId]);

  const closeAndMarkSeen = useCallback(async () => {
    setVisible(false);
    setStepIndex(0);
    await markSeen();
  }, [markSeen]);

  const open = useCallback(
    (opts?: { force?: boolean }) => {
      setStepIndex(0);
      setVisible(true);
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

    const key = `${user.id}:${currentWorkspaceId}`;
    if (lastAutoKeyRef.current === key) return;

    let cancelled = false;

    const maybeAutoOpen = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;
      try {
        const seen = await hasSeenAppTour(user.id, currentWorkspaceId);
        if (cancelled) return;
        lastAutoKeyRef.current = key;
        if (!seen) {
          setStepIndex(0);
          setVisible(true);
        }
      } finally {
        checkingRef.current = false;
      }
    };

    maybeAutoOpen();
    return () => {
      cancelled = true;
    };
  }, [user?.id, currentWorkspaceId, isInitialized, isLoaded]);

  const goNext = useCallback(() => {
    setStepIndex((prev) => Math.min(prev + 1, stepCount - 1));
  }, [stepCount]);

  const goBack = useCallback(() => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const skipOrFinish = useCallback(() => {
    void closeAndMarkSeen();
  }, [closeAndMarkSeen]);

  return {
    visible,
    stepIndex,
    stepCount,
    navItems,
    toolItems,
    goNext,
    goBack,
    skipOrFinish,
  };
}
