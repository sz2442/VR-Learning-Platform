import { CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui';
import { useLessonContent, useMarkLessonComplete } from '@/hooks/useCourseStructure';
import { PageLoader } from '@/components/ui';

interface LessonViewProps {
  lessonId: number;
  moduleId: number;
  courseId: number;
  isCompleted: boolean;
  onComplete: () => void;
}

export function LessonView({ lessonId, moduleId, courseId, isCompleted, onComplete }: LessonViewProps) {
  const { data: lesson, isLoading } = useLessonContent(lessonId);
  const { mutate: markComplete, isPending } = useMarkLessonComplete(courseId);

  if (isLoading) return <PageLoader />;
  if (!lesson) return <div className="p-8 text-center text-surface-500">Lesson not found.</div>;

  const handleMarkComplete = () => {
    markComplete({ lessonId, moduleId }, { onSuccess: onComplete });
  };

  // Extract YouTube embed id for iframe
  const getYoutubeId = (url: string) => {
    const m = url.match(/(?:embed\/|v=|youtu\.be\/)([^&?/]+)/);
    return m ? m[1] : null;
  };

  return (
    <div className="max-w-3xl mx-auto p-6 lg:p-8">
      <h1 className="text-2xl font-bold font-display text-surface-900 dark:text-white mb-6">
        {lesson.title}
      </h1>

      {/* Video */}
      {lesson.videoUrl && (
        <div className="mb-8 rounded-xl overflow-hidden shadow-lg aspect-video bg-black">
          {lesson.videoUrl.includes('youtube') || lesson.videoUrl.includes('youtu.be') ? (
            <iframe
              src={lesson.videoUrl.replace('watch?v=', 'embed/')}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title={lesson.title}
            />
          ) : (
            <a
              href={lesson.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-full text-white gap-2 hover:underline"
            >
              <ExternalLink className="h-5 w-5" />
              Watch video
            </a>
          )}
        </div>
      )}

      {/* Lesson content — rendered as plain text with whitespace preserved */}
      <div className="prose prose-surface dark:prose-invert max-w-none">
        <div className="whitespace-pre-wrap text-surface-700 dark:text-surface-300 leading-relaxed text-base">
          {lesson.contentText}
        </div>
      </div>

      {/* Mark complete button */}
      <div className="mt-10 pt-6 border-t border-surface-200 dark:border-surface-700">
        {isCompleted ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
            <CheckCircle className="h-5 w-5" />
            Lesson completed
          </div>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={handleMarkComplete}
            isLoading={isPending}
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Mark as Complete
          </Button>
        )}
      </div>
    </div>
  );
}
