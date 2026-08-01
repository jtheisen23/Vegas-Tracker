import {
  collection,
  deleteDoc,
  doc,
  type Firestore,
  getDocs,
  onSnapshot,
  setDoc,
} from 'firebase/firestore';
import { Course } from '../types';
import { GENEVA_COURSE, seedCourses } from './courses';
import { getDb } from '../firebase';

const STORAGE_KEY = 'vegas-golf-courses';
const CHANNEL = 'vegas-golf-courses';
const COLLECTION = 'courses';

/**
 * CourseSync abstracts the saved-course library so the UI is identical
 * whether courses live only in this browser or sync across devices.
 * `load` is synchronous (returns the cached list); cross-device adapters
 * populate the cache and push updates through `subscribe`.
 */
export interface CourseSync {
  load(): Course[];
  upsert(course: Course): void;
  remove(id: string): void;
  subscribe(listener: (courses: Course[]) => void): () => void;
}

function readLocal(): Course[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as Course[];
    }
  } catch {
    /* fall through to seed */
  }
  const seed = seedCourses();
  writeLocal(seed);
  return seed;
}

function writeLocal(courses: Course[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
  } catch {
    /* ignore quota/serialization errors */
  }
}

function upsertInto(courses: Course[], course: Course): Course[] {
  const exists = courses.some((c) => c.id === course.id);
  return exists ? courses.map((c) => (c.id === course.id ? course : c)) : [...courses, course];
}

/**
 * LocalCourseSync — single-device library persisted to localStorage, with
 * cross-tab updates via BroadcastChannel + the storage event.
 */
export class LocalCourseSync implements CourseSync {
  private channel: BroadcastChannel | null =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;

  load(): Course[] {
    return readLocal();
  }

  upsert(course: Course): void {
    const next = upsertInto(readLocal(), course);
    writeLocal(next);
    this.channel?.postMessage('changed');
  }

  remove(id: string): void {
    const next = readLocal().filter((c) => c.id !== id);
    writeLocal(next);
    this.channel?.postMessage('changed');
  }

  subscribe(listener: (courses: Course[]) => void): () => void {
    const onChannel = () => listener(readLocal());
    this.channel?.addEventListener('message', onChannel);

    const onStorage = (ev: StorageEvent) => {
      if (ev.key === STORAGE_KEY) listener(readLocal());
    };
    window.addEventListener('storage', onStorage);

    return () => {
      this.channel?.removeEventListener('message', onChannel);
      window.removeEventListener('storage', onStorage);
    };
  }
}

/**
 * FirebaseCourseSync — the same library shared across devices via a Firestore
 * `courses` collection. The library is cached in memory + localStorage so
 * load() stays synchronous; onSnapshot keeps every device up to date.
 */
export class FirebaseCourseSync implements CourseSync {
  private db: Firestore;
  private cache: Course[];
  private listeners = new Set<(courses: Course[]) => void>();
  private started = false;

  constructor(db: Firestore) {
    this.db = db;
    // Seed the in-memory cache so the UI shows Geneva immediately; the cloud
    // snapshot replaces it once Firestore responds.
    this.cache = readLocal();
  }

  private notify(): void {
    writeLocal(this.cache);
    this.listeners.forEach((fn) => fn(this.cache));
  }

  private start(): void {
    if (this.started) return;
    this.started = true;

    onSnapshot(
      collection(this.db, COLLECTION),
      (snap) => {
        const courses = snap.docs.map((d) => d.data() as Course);
        if (courses.length === 0) {
          // First use of a fresh project — publish the built-in course.
          void this.seedCloud();
          return;
        }
        this.cache = courses;
        this.notify();
      },
      (err) => console.error('[courses] subscribe failed', err),
    );
  }

  private async seedCloud(): Promise<void> {
    try {
      // Guard against a race between the empty snapshot and the seed write.
      const existing = await getDocs(collection(this.db, COLLECTION));
      if (!existing.empty) return;
      await setDoc(doc(this.db, COLLECTION, GENEVA_COURSE.id), GENEVA_COURSE);
    } catch (err) {
      console.error('[courses] seed failed', err);
    }
  }

  load(): Course[] {
    return this.cache;
  }

  upsert(course: Course): void {
    this.cache = upsertInto(this.cache, course);
    this.notify();
    setDoc(doc(this.db, COLLECTION, course.id), course).catch((err) =>
      console.error('[courses] save failed', err),
    );
  }

  remove(id: string): void {
    this.cache = this.cache.filter((c) => c.id !== id);
    this.notify();
    deleteDoc(doc(this.db, COLLECTION, id)).catch((err) =>
      console.error('[courses] remove failed', err),
    );
  }

  subscribe(listener: (courses: Course[]) => void): () => void {
    this.listeners.add(listener);
    this.start();
    return () => {
      this.listeners.delete(listener);
    };
  }
}

function createCourseSync(): { adapter: CourseSync; kind: 'firebase' | 'local' } {
  const db = getDb();
  if (db) return { adapter: new FirebaseCourseSync(db), kind: 'firebase' };
  return { adapter: new LocalCourseSync(), kind: 'local' };
}

const { adapter, kind } = createCourseSync();

export const courseSync: CourseSync = adapter;
export const courseSyncKind: 'firebase' | 'local' = kind;
