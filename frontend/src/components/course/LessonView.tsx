import { CheckCircle, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
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

      {/* Lesson content rendered as Markdown */}
      <div className="prose prose-surface dark:prose-invert max-w-none
        prose-headings:font-display prose-headings:text-surface-900 dark:prose-headings:text-white
        prose-p:text-surface-700 dark:prose-p:text-surface-300 prose-p:leading-relaxed
        prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
        prose-strong:text-surface-900 dark:prose-strong:text-white
        prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-surface-100 dark:prose-code:bg-surface-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-transparent prose-pre:p-0
        prose-blockquote:border-primary-400 prose-blockquote:text-surface-600 dark:prose-blockquote:text-surface-400
        prose-ul:text-surface-700 dark:prose-ul:text-surface-300
        prose-ol:text-surface-700 dark:prose-ol:text-surface-300
        prose-table:text-surface-700 dark:prose-table:text-surface-300
        prose-th:bg-surface-100 dark:prose-th:bg-surface-800
        prose-tr:border-surface-200 dark:prose-tr:border-surface-700">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {lesson.contentText}
        </ReactMarkdown>
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
