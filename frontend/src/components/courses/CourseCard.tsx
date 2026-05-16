import { Link } from 'react-router-dom';
import { Clock, BarChart3 } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { formatDuration, getDifficultyBadgeClass } from '@/lib/utils';
import type { Course } from '@/types';
import { motion } from 'framer-motion';

interface CourseCardProps {
  course: Course;
  index?: number;
}

export function CourseCard({ course, index = 0 }: CourseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link to={`/courses/${course.id}`}>
        <Card hover className="group overflow-hidden p-0">
          {/* Image */}
          <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30">
            {course.imageUrl ? (
              <img
                src={course.imageUrl}
                alt={course.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <BarChart3 className="h-16 w-16 text-primary-300 dark:text-primary-700" />
              </div>
            )}
            
            {/* Difficulty badge overlay */}
            <div className="absolute right-3 top-3">
              <Badge className={getDifficultyBadgeClass(course.difficulty)}>
                {course.difficulty}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3 className="mb-2 font-display text-lg font-semibold line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {course.title}
            </h3>
            
            <p className="mb-4 text-sm text-surface-500 line-clamp-2">
              {course.shortDescription}
            </p>

            <div className="flex items-center gap-4 text-sm text-surface-400">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(course.durationMinutes)}</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
