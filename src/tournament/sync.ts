import type { Tournament } from './types';

/**
 * SyncAdapter abstracts real-time tournament state propagation.
 * LocalSync works across tabs on one device (BroadcastChannel + localStorage).
 * Swap in a Firebase/Supabase/REST implementation later without touching UI code.
 */
export interface SyncAdapter {
  load(eventId: string): Tournament | null;
  save(tournament: Tournament): void;
  subscribe(eventId: string, listener: (t: Tournament) => void): () => void;
  listEventIds(): string[];
  remove(eventId: string): void;
}

const INDEX_KEY = 'tg-events-index';
const eventKey = (id: string) => `tg-event-${id}`;

function readIndex(): string[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(ids: string[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

export class LocalSync implements SyncAdapter {
  private channels = new Map<string, BroadcastChannel>();

  load(eventId: string): Tournament | null {
    try {
      const raw = localStorage.getItem(eventKey(eventId));
      return raw ? (JSON.parse(raw) as Tournament) : null;
    } catch {
      return null;
    }
  }

  save(tournament: Tournament): void {
    const updated = { ...tournament, updatedAt: new Date().toISOString() };
    localStorage.setItem(eventKey(updated.id), JSON.stringify(updated));

    const index = readIndex();
    if (!index.includes(updated.id)) {
      index.unshift(updated.id);
      writeIndex(index);
    }

    const ch = this.getChannel(updated.id);
    ch.postMessage(updated);
  }

  subscribe(eventId: string, listener: (t: Tournament) => void): () => void {
    const ch = this.getChannel(eventId);
    const handler = (ev: MessageEvent<Tournament>) => listener(ev.data);
    ch.addEventListener('message', handler);

    const storageHandler = (ev: StorageEvent) => {
      if (ev.key === eventKey(eventId) && ev.newValue) {
        try {
          listener(JSON.parse(ev.newValue) as Tournament);
        } catch {
          /* ignore malformed payload */
        }
      }
    };
    window.addEventListener('storage', storageHandler);

    return () => {
      ch.removeEventListener('message', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }

  listEventIds(): string[] {
    return readIndex();
  }

  remove(eventId: string): void {
    localStorage.removeItem(eventKey(eventId));
    writeIndex(readIndex().filter((id) => id !== eventId));
    this.channels.get(eventId)?.close();
    this.channels.delete(eventId);
  }

  private getChannel(eventId: string): BroadcastChannel {
    let ch = this.channels.get(eventId);
    if (!ch) {
      ch = new BroadcastChannel(`tg-event-${eventId}`);
      this.channels.set(eventId, ch);
    }
    return ch;
  }
}

export const sync: SyncAdapter = new LocalSync();
