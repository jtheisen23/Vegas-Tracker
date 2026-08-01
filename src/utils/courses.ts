import { Course, HoleSetup } from '../types';
import { COURSE_RATING, COURSE_SLOPE } from './handicap';

const COURSES_KEY = 'vegas-golf-courses';

const GENEVA_PARS = [4, 4, 4, 4, 3, 3, 4, 4, 4, 4, 4, 4, 4, 3, 3, 4, 4, 4];
const GENEVA_HDCPS = [1, 3, 9, 13, 17, 15, 5, 7, 11, 8, 2, 10, 14, 16, 18, 4, 6, 12];

/** Built-in Geneva Golf Club hole setup (pars + stroke indexes). */
export const GENEVA_HOLES: HoleSetup[] = GENEVA_PARS.map((par, i) => ({
  number: i + 1,
  par,
  handicapRating: GENEVA_HDCPS[i],
}));

/** Built-in Geneva course, seeded into the library on first use. */
export const GENEVA_COURSE: Course = {
  id: 'geneva-golf-club',
  name: 'Geneva Golf Club',
  rating: COURSE_RATING,
  slope: COURSE_SLOPE,
  holes: GENEVA_HOLES,
};

/**
 * Load the saved course library. On first use (or if storage is empty/corrupt)
 * the library is seeded with the built-in Geneva course and persisted.
 */
export function loadCourses(): Course[] {
  try {
    const data = localStorage.getItem(COURSES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fall through to seed */
  }
  const seed = [GENEVA_COURSE];
  persistCourses(seed);
  return seed;
}

/** Persist the full course library. */
export function persistCourses(courses: Course[]): void {
  try {
    localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
  } catch {
    /* ignore quota/serialization errors */
  }
}
