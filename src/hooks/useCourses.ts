import { useState, useCallback } from 'react';
import { Course } from '../types';
import { loadCourses, persistCourses } from '../utils/courses';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export type CourseInput = Omit<Course, 'id'> & { id?: string };

/**
 * Manages the saved course library (persisted to localStorage).
 * saveCourse upserts: with a matching id it updates that course, otherwise
 * it creates a new one. Returns the stored course (with its id).
 */
export function useCourses() {
  const [courses, setCourses] = useState<Course[]>(() => loadCourses());

  const saveCourse = useCallback((input: CourseInput): Course => {
    const id = input.id ?? generateId();
    const course: Course = {
      id,
      name: input.name,
      rating: input.rating,
      slope: input.slope,
      holes: input.holes.map((h) => ({ ...h })),
    };
    setCourses((prev) => {
      const exists = prev.some((c) => c.id === id);
      const next = exists ? prev.map((c) => (c.id === id ? course : c)) : [...prev, course];
      persistCourses(next);
      return next;
    });
    return course;
  }, []);

  const deleteCourse = useCallback((id: string) => {
    setCourses((prev) => {
      const next = prev.filter((c) => c.id !== id);
      persistCourses(next);
      return next;
    });
  }, []);

  return { courses, saveCourse, deleteCourse };
}
