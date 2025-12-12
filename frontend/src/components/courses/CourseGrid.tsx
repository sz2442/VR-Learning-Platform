import { CourseCard } from './CourseCard';
import { CardSkeleton } from '@/components/ui';
import type { Course } from '@/types';

interface CourseGridProps {
  courses: Course[];
  isLoading?: boolean;
}

export function CourseGrid({ courses, isLoading }: CourseGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-surface-500">No courses found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course, index) => (
        <CourseCard key={course.id} course={course} index={index} />
      ))}
    </div>
  );
}
