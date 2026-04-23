import type { Tournament } from './types';
import { LocalSync } from './localSync';
import { FirebaseSync, getFirebaseConfig } from './firebaseSync';

/**
 * SyncAdapter abstracts tournament state propagation so UI code stays the
 * same whether data lives in localStorage, Firestore, or anywhere else.
 *
 * `load` must be synchronous — adapters that are backed by a network call
 * keep a local cache and populate it via `subscribe` / an initial fetch.
 */
export interface SyncAdapter {
  load(eventId: string): Tournament | null;
  save(tournament: Tournament): void;
  subscribe(eventId: string, listener: (t: Tournament) => void): () => void;
  listEventIds(): string[];
  remove(eventId: string): void;
}

function createSync(): { adapter: SyncAdapter; kind: 'firebase' | 'local' } {
  const fb = getFirebaseConfig();
  if (fb) return { adapter: new FirebaseSync(fb), kind: 'firebase' };
  return { adapter: new LocalSync(), kind: 'local' };
}

const { adapter, kind } = createSync();

export const sync: SyncAdapter = adapter;
export const syncKind: 'firebase' | 'local' = kind;

if (typeof window !== 'undefined') {
  if (kind === 'firebase') {
    console.info('[tournament] sync: Firebase (cross-device live)');
  } else {
    console.info(
      '[tournament] sync: LocalSync (single-device). Set VITE_FIREBASE_* env vars for cross-device.',
    );
  }
}
