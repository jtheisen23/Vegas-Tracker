import { initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  collection,
  deleteDoc,
  doc,
  type Firestore,
  getDocs,
  getFirestore,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import type { SyncAdapter } from './sync';
import type { Tournament } from './types';

const INDEX_KEY = 'tg-fb-index';
const cacheKey = (id: string) => `tg-fb-${id}`;
const COLLECTION = 'tournaments';

/**
 * Read Firebase config from Vite env vars. Returns null if the required
 * fields are missing so callers can fall back to LocalSync.
 */
export function getFirebaseConfig(): FirebaseOptions | null {
  const env = import.meta.env as Record<string, string | undefined>;
  const cfg: FirebaseOptions = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
  if (!cfg.apiKey || !cfg.projectId) return null;
  return cfg;
}

/**
 * FirebaseSync — real cross-device sync backed by Firestore.
 *
 * The SyncAdapter interface is synchronous, so we cache tournaments in
 * memory + localStorage and populate the cache via onSnapshot. New devices
 * opening a shared URL see a brief "loading" state until Firestore responds.
 *
 * Required Firestore rules (example — tighten later if you want auth):
 *
 *   rules_version = '2';
 *   service cloud.firestore {
 *     match /databases/{database}/documents {
 *       match /tournaments/{id} {
 *         allow read, write: if true;
 *       }
 *     }
 *   }
 */
export class FirebaseSync implements SyncAdapter {
  private db: Firestore;
  private cache = new Map<string, Tournament>();
  private index: string[] = [];

  constructor(config: FirebaseOptions) {
    const app = initializeApp(config);
    this.db = getFirestore(app);
    this.loadLocalCache();
    void this.hydrateFromCloud();
  }

  private loadLocalCache(): void {
    try {
      const rawIdx = localStorage.getItem(INDEX_KEY);
      this.index = rawIdx ? (JSON.parse(rawIdx) as string[]) : [];
      this.index.forEach((id) => {
        const raw = localStorage.getItem(cacheKey(id));
        if (raw) this.cache.set(id, JSON.parse(raw) as Tournament);
      });
    } catch {
      /* corrupt cache — ignore */
    }
  }

  private writeIndex(): void {
    localStorage.setItem(INDEX_KEY, JSON.stringify(this.index));
  }

  private addToIndex(id: string): void {
    if (!this.index.includes(id)) {
      this.index.unshift(id);
      this.writeIndex();
    }
  }

  private cacheTournament(t: Tournament): void {
    this.cache.set(t.id, t);
    localStorage.setItem(cacheKey(t.id), JSON.stringify(t));
    this.addToIndex(t.id);
  }

  private async hydrateFromCloud(): Promise<void> {
    try {
      const snap = await getDocs(collection(this.db, COLLECTION));
      snap.forEach((d) => this.cacheTournament(d.data() as Tournament));
    } catch (err) {
      console.error('[firebase] index hydrate failed', err);
    }
  }

  load(eventId: string): Tournament | null {
    return this.cache.get(eventId) || null;
  }

  save(tournament: Tournament): void {
    const updated = { ...tournament, updatedAt: new Date().toISOString() };
    this.cacheTournament(updated);
    setDoc(doc(this.db, COLLECTION, updated.id), updated).catch((err) => {
      console.error('[firebase] save failed', err);
    });
  }

  subscribe(eventId: string, listener: (t: Tournament) => void): () => void {
    return onSnapshot(
      doc(this.db, COLLECTION, eventId),
      (snap) => {
        if (!snap.exists()) return;
        const t = snap.data() as Tournament;
        this.cacheTournament(t);
        listener(t);
      },
      (err) => console.error('[firebase] subscribe failed', err),
    );
  }

  listEventIds(): string[] {
    return this.index;
  }

  remove(eventId: string): void {
    this.cache.delete(eventId);
    localStorage.removeItem(cacheKey(eventId));
    this.index = this.index.filter((id) => id !== eventId);
    this.writeIndex();
    deleteDoc(doc(this.db, COLLECTION, eventId)).catch((err) =>
      console.error('[firebase] remove failed', err),
    );
  }
}
