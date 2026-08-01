import { Course, HoleSetup } from '../types';
import { COURSE_RATING, COURSE_SLOPE } from './handicap';

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

/** The library's starting contents when nothing has been saved yet. */
export function seedCourses(): Course[] {
  return [GENEVA_COURSE];
}
