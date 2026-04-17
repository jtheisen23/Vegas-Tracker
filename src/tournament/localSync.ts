import type { SyncAdapter } from './sync';
import type { Tournament } from './types';

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

/**
 * LocalSync — cross-tab sync on a single device via BroadcastChannel and
 * localStorage. No network calls. Perfect for demo and single-scorekeeper
 * setups but does not sync across devices.
 */
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

    this.getChannel(updated.id).postMessage(updated);
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
