import { useState, useEffect, useCallback } from 'react';
import { Course } from '../types';
import { courseSync } from '../utils/courseSync';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export type CourseInput = Omit<Course, 'id'> & { id?: string };

/**
 * Manages the saved course library through the course sync adapter, so the
 * library persists locally and — when Firebase is configured — syncs across
 * devices. saveCourse upserts: with a matching id it updates that course,
 * otherwise it creates a new one. Returns the stored course (with its id).
 */
export function useCourses() {
  const [courses, setCourses] = useState<Course[]>(() => courseSync.load());

  useEffect(() => courseSync.subscribe(setCourses), []);

  const saveCourse = useCallback((input: CourseInput): Course => {
    const id = input.id ?? generateId();
    const course: Course = {
      id,
      name: input.name,
      rating: input.rating,
      slope: input.slope,
      holes: input.holes.map((h) => ({ ...h })),
    };
    courseSync.upsert(course);
    // Optimistic local update (BroadcastChannel/onSnapshot won't echo to us).
    setCourses((prev) => {
      const exists = prev.some((c) => c.id === id);
      return exists ? prev.map((c) => (c.id === id ? course : c)) : [...prev, course];
    });
    return course;
  }, []);

  const deleteCourse = useCallback((id: string) => {
    courseSync.remove(id);
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { courses, saveCourse, deleteCourse };
}
