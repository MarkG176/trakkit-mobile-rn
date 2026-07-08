import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { workspaceService, UserWorkspace } from '@/services/workspaceService';
import { useAuth } from '@/providers/AuthProvider';

interface WorkspaceContextType {
  currentWorkspaceId: string | null;
  currentProjectId: string | null;
  currentWorkspaceLabel: string | null;
  currentProjectCountry: string | null;
  userWorkspaces: UserWorkspace[];
  currentWorkspaceRole: 'admin' | 'member' | 'viewer' | null;
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => Promise<boolean>;
  refreshWorkspaces: () => Promise<void>;
  isInitialized: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentWorkspaceLabel, setCurrentWorkspaceLabel] = useState<string | null>(null);
  const [currentProjectCountry, setCurrentProjectCountry] = useState<string | null>(null);
  const [userWorkspaces, setUserWorkspaces] = useState<UserWorkspace[]>([]);
  const [currentWorkspaceRole, setCurrentWorkspaceRole] = useState<'admin' | 'member' | 'viewer' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const updateWorkspaceState = useCallback(() => {
    setCurrentWorkspaceId(workspaceService.getCurrentWorkspaceId());
    setCurrentProjectId(workspaceService.getCurrentProjectId());
    setCurrentWorkspaceLabel(workspaceService.getCurrentWorkspaceLabel());
    setCurrentProjectCountry(workspaceService.getCurrentProjectCountry());
    setUserWorkspaces(workspaceService.getUserWorkspaces());
    setCurrentWorkspaceRole(workspaceService.getCurrentWorkspaceRole());
    setIsInitialized(workspaceService.isInitialized());
  }, []);

  useEffect(() => {
    if (!user) {
      setIsInitialized(false);
      return;
    }

    let cancelled = false;

    const ensureInitialized = async () => {
      try {
        if (!workspaceService.isInitialized()) {
          await workspaceService.initialize(user);
        }
      } catch (error) {
        console.error('Workspace initialization failed:', error);
      } finally {
        if (!cancelled || workspaceService.isInitialized()) {
          updateWorkspaceState();
          setIsInitialized(true);
        }
      }
    };

    ensureInitialized();
    return () => {
      cancelled = true;
    };
  }, [user, updateWorkspaceState]);

  useEffect(() => {
    if (!user) return;
    return workspaceService.subscribe(updateWorkspaceState);
  }, [user, updateWorkspaceState]);

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    setIsLoading(true);
    try {
      const success = await workspaceService.setCurrentWorkspace(workspaceId);
      if (success) updateWorkspaceState();
      return success;
    } finally {
      setIsLoading(false);
    }
  }, [updateWorkspaceState]);

  const refreshWorkspaces = useCallback(async () => {
    setIsLoading(true);
    try {
      await workspaceService.refresh();
      updateWorkspaceState();
    } finally {
      setIsLoading(false);
    }
  }, [updateWorkspaceState]);

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspaceId,
        currentProjectId,
        currentWorkspaceLabel,
        currentProjectCountry,
        userWorkspaces,
        currentWorkspaceRole,
        isLoading,
        switchWorkspace,
        refreshWorkspaces,
        isInitialized,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}
