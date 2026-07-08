import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';

const OUTBOX_KEY = 'trakkit_offline_outbox';

export interface OutboxItem {
  id: string;
  table: string;
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
}

type QueueListener = (pendingCount: number) => void;

class OfflineQueueService {
  private listeners = new Set<QueueListener>();
  private processing = false;
  private netUnsubscribe: (() => void) | null = null;

  constructor() {
    this.netUnsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        this.processQueue();
      }
    });
  }

  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    this.getQueue().then((q) => listener(q.length));
    return () => this.listeners.delete(listener);
  }

  private notify(count: number): void {
    this.listeners.forEach((l) => l(count));
  }

  private async getQueue(): Promise<OutboxItem[]> {
    try {
      const raw = await AsyncStorage.getItem(OUTBOX_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private async saveQueue(queue: OutboxItem[]): Promise<void> {
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(queue));
    this.notify(queue.length);
  }

  async enqueue(table: string, payload: Record<string, unknown>): Promise<{ synced: boolean; id: string }> {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const item: OutboxItem = {
      id,
      table,
      payload,
      createdAt: new Date().toISOString(),
      retries: 0,
    };

    const net = await NetInfo.fetch();
    if (net.isConnected) {
      const synced = await this.trySync(item);
      if (synced) return { synced: true, id };
    }

    const queue = await this.getQueue();
    queue.push(item);
    await this.saveQueue(queue);
    return { synced: false, id };
  }

  private async trySync(item: OutboxItem): Promise<boolean> {
    try {
      const { error } = await supabase.from(item.table as never).insert(item.payload as never);
      return !error;
    } catch {
      return false;
    }
  }

  async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      let queue = await this.getQueue();
      const remaining: OutboxItem[] = [];

      for (const item of queue) {
        const ok = await this.trySync(item);
        if (!ok) {
          remaining.push({ ...item, retries: item.retries + 1 });
        }
      }

      await this.saveQueue(remaining);
    } finally {
      this.processing = false;
    }
  }

  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }
}

export const offlineQueue = new OfflineQueueService();

export async function writeWithOfflineQueue(
  table: string,
  payload: Record<string, unknown>,
): Promise<{ synced: boolean; id: string }> {
  return offlineQueue.enqueue(table, payload);
}
