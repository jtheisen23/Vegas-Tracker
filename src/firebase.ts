import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

/**
 * Read Firebase config from Vite env vars. Returns null if the required
 * fields are missing so callers can fall back to local-only storage.
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

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

/**
 * Lazily initialize a single shared Firebase app. Both the tournament sync
 * and the course library sync call this, so we must never call
 * initializeApp twice (that throws "app already exists").
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app;
  const cfg = getFirebaseConfig();
  if (!cfg) return null;
  app = initializeApp(cfg);
  return app;
}

/** Shared Firestore instance, or null when Firebase isn't configured. */
export function getDb(): Firestore | null {
  if (db) return db;
  const a = getFirebaseApp();
  if (!a) return null;
  db = getFirestore(a);
  return db;
}
