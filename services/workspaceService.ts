import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getCurrencyCodeFromCountry } from '@/utils/currency';

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  start_date: string;
  target_areas: string[] | null;
  workspace_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface UserWorkspace {
  id: string;
  user_id: string | null;
  workspace_id: string | null;
  role: 'admin' | 'member' | 'viewer';
  joined_at: string | null;
  workspace: Workspace;
  active_components: Record<string, boolean | string> | null;
}

export function normalizeWorkLocationMode(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

export function isInStoreWorkLocation(
  activeComponents: Record<string, boolean | string> | null | undefined,
): boolean {
  const raw = activeComponents?.work_location;
  if (typeof raw !== 'string') return false;
  return normalizeWorkLocationMode(raw) === 'instore';
}

const WORKSPACE_STORAGE_KEY = 'trakkit_current_workspace_id';

class WorkspaceService {
  private currentWorkspaceId: string | null = null;
  private currentProjectId: string | null = null;
  private currentWorkspaceLabel: string | null = null;
  private currentProjectCountry: string | null = null;
  private userWorkspaces: UserWorkspace[] = [];
  private user: User | null = null;
  private initialized = false;
  private listeners = new Set<() => void>();
  private storageLoaded = false;

  constructor() {
    this.loadSavedWorkspaceId();
  }

  private async loadSavedWorkspaceId(): Promise<void> {
    try {
      this.currentWorkspaceId = await AsyncStorage.getItem(WORKSPACE_STORAGE_KEY);
      this.storageLoaded = true;
    } catch {
      this.currentWorkspaceId = null;
      this.storageLoaded = true;
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (error) {
        console.error('Workspace listener error:', error);
      }
    });
  }

  private async saveWorkspaceId(workspaceId: string | null): Promise<void> {
    try {
      if (workspaceId) {
        await AsyncStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
      } else {
        await AsyncStorage.removeItem(WORKSPACE_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
  }

  async initialize(user: User): Promise<void> {
    if (!this.storageLoaded) await this.loadSavedWorkspaceId();
    if (this.initialized && this.user?.id === user.id) return;
    this.user = user;
    await this.loadUserWorkspaces();
    this.initialized = true;
  }

  async loadUserWorkspaces(): Promise<void> {
    if (!this.user) return;
    const previousWorkspaceId = this.currentWorkspaceId;

    try {
      const { data, error } = await supabase
        .from('user_workspaces')
        .select(`
          id,
          user_id,
          workspace_id,
          role,
          active_components,
          created_at,
          workspace:workspaces!inner (
            id,
            name,
            description,
            created_at,
            updated_at,
            is_active
          )
        `)
        .eq('user_id', this.user.id)
        .eq('is_active', true)
        .eq('workspace.is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading user workspaces:', error);
        this.userWorkspaces = [];
        return;
      }

      this.userWorkspaces = (data || []).map((item) => ({
        id: item.id,
        user_id: item.user_id,
        workspace_id: item.workspace_id,
        role: item.role as 'admin' | 'member' | 'viewer',
        joined_at: item.created_at,
        workspace: item.workspace as Workspace,
        active_components: (item as { active_components?: Record<string, boolean | string> | null }).active_components ?? null,
      }));

      if (previousWorkspaceId && this.userWorkspaces.some((w) => w.workspace_id === previousWorkspaceId)) {
        this.currentWorkspaceId = previousWorkspaceId;
        await this.loadCurrentWorkspaceLabel();
        if (this.currentWorkspaceId) await this.loadProjectsForWorkspace(this.currentWorkspaceId);
      } else if (!this.currentWorkspaceId && this.userWorkspaces.length > 0) {
        this.currentWorkspaceId = this.userWorkspaces[0].workspace_id;
        await this.loadCurrentWorkspaceLabel();
        if (this.currentWorkspaceId) await this.loadProjectsForWorkspace(this.currentWorkspaceId);
      } else if (this.currentWorkspaceId && this.userWorkspaces.length > 0) {
        await this.loadCurrentWorkspaceLabel();
        await this.loadProjectsForWorkspace(this.currentWorkspaceId);
      }
    } catch (error) {
      console.error('Error loading user workspaces:', error);
      this.userWorkspaces = [];
    } finally {
      this.notify();
    }
  }

  hasWorkspaceAccess(workspaceId: string): boolean {
    return this.userWorkspaces.some((uw) => uw.workspace_id === workspaceId);
  }

  getUserWorkspaces(): UserWorkspace[] {
    return this.userWorkspaces;
  }

  getCurrentWorkspaceRole(): 'admin' | 'member' | 'viewer' | null {
    if (!this.currentWorkspaceId) return null;
    return this.userWorkspaces.find((uw) => uw.workspace_id === this.currentWorkspaceId)?.role ?? null;
  }

  getCurrentWorkspaceId(): string | null {
    return this.currentWorkspaceId;
  }

  getCurrentProjectId(): string | null {
    return this.currentProjectId;
  }

  getCurrentActiveComponents(): Record<string, boolean | string> | null {
    if (!this.currentWorkspaceId) return null;
    return this.userWorkspaces.find((w) => w.workspace_id === this.currentWorkspaceId)?.active_components ?? null;
  }

  isCurrentWorkspaceInStoreMode(): boolean {
    return isInStoreWorkLocation(this.getCurrentActiveComponents() ?? undefined);
  }

  private async loadCurrentWorkspaceLabel(): Promise<void> {
    this.currentWorkspaceLabel = null;
    this.currentProjectCountry = null;
    if (!this.currentWorkspaceId && !this.currentProjectId) return;

    try {
      let data: { project_type?: string | null; country?: string | null } | null = null;

      if (this.currentProjectId) {
        const { data: byId } = await supabase
          .from('project_plans')
          .select('project_type, country')
          .eq('id', this.currentProjectId)
          .maybeSingle();
        if (byId) data = byId;
      }

      if (!data && this.currentWorkspaceId) {
        const { data: byWorkspace } = await supabase
          .from('project_plans')
          .select('project_type, country')
          .eq('workspace_id', this.currentWorkspaceId)
          .eq('status', 'active')
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (byWorkspace) data = byWorkspace;
      }

      this.currentWorkspaceLabel = data?.project_type ?? null;
      this.currentProjectCountry = data?.country ?? null;
    } catch (error) {
      console.error('Error loading project metadata:', error);
    }
  }

  getCurrentWorkspaceLabel(): string | null {
    return this.currentWorkspaceLabel;
  }

  getCurrentProjectCountry(): string | null {
    return this.currentProjectCountry;
  }

  getProjectCurrencyCode(): string {
    return getCurrencyCodeFromCountry(this.currentProjectCountry);
  }

  async setCurrentWorkspace(workspaceId: string): Promise<boolean> {
    if (!this.hasWorkspaceAccess(workspaceId)) return false;
    this.currentWorkspaceId = workspaceId;
    await this.saveWorkspaceId(workspaceId);
    await this.loadCurrentWorkspaceLabel();
    await this.loadProjectsForWorkspace(workspaceId);
    this.notify();
    return true;
  }

  private async loadProjectsForWorkspace(workspaceId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, start_date, target_areas')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading projects for workspace:', error);
        return;
      }

      this.currentProjectId = data?.[0]?.id || null;
      await this.loadCurrentWorkspaceLabel();
    } catch (error) {
      console.error('Error loading projects for workspace:', error);
    }
  }

  getWorkspaceContext(): { workspace_id: string } | Record<string, never> {
    return this.currentWorkspaceId ? { workspace_id: this.currentWorkspaceId } : {};
  }

  getProjectContext(): { project_id: string } | Record<string, never> {
    return this.currentProjectId ? { project_id: this.currentProjectId } : {};
  }

  getFullContext(): { workspace_id?: string; project_id?: string } {
    const context: { workspace_id?: string; project_id?: string } = {};
    if (this.currentWorkspaceId) context.workspace_id = this.currentWorkspaceId;
    if (this.currentProjectId) context.project_id = this.currentProjectId;
    return context;
  }

  ensureWorkspaceContext<T extends Record<string, unknown>>(data: T): T & { workspace_id: string } {
    if (!this.currentWorkspaceId) {
      throw new Error('No workspace selected. Please select a workspace first.');
    }
    return { ...data, workspace_id: this.currentWorkspaceId };
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getWorkspaceName(): string {
    if (!this.currentWorkspaceId) return 'No Workspace';
    return (
      this.userWorkspaces.find((uw) => uw.workspace_id === this.currentWorkspaceId)?.workspace.name ??
      'Unknown Workspace'
    );
  }

  async refresh(): Promise<void> {
    if (this.user) await this.loadUserWorkspaces();
  }

  reset(): void {
    this.user = null;
    this.initialized = false;
    this.userWorkspaces = [];
    this.currentWorkspaceId = null;
    this.currentProjectId = null;
    this.notify();
  }
}

export const workspaceService = new WorkspaceService();
export type { Workspace, Project, UserWorkspace };
