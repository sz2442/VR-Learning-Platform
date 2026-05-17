import { useState, useEffect, useRef } from 'react';
import { Upload, Save, FileText, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Skeleton } from '@/components/ui';
import { useCourseStructure, useLessonContent } from '@/hooks/useCourseStructure';
import { useUpdateLessonContent } from '@/hooks/useInstructor';

interface Props {
  courses: { id: number; title: string }[];
}

export function LessonContentManager({ courses }: Props) {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [localContent, setLocalContent] = useState('');
  const [localVideoUrl, setLocalVideoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: structure, isLoading: structureLoading } = useCourseStructure(selectedCourseId ?? 0);
  const { data: lesson, isLoading: lessonLoading } = useLessonContent(selectedLessonId);
  const { mutate: updateContent, isPending: isSaving } = useUpdateLessonContent();

  // Sync fields when lesson loads
  useEffect(() => {
    if (lesson) {
      setLocalContent(lesson.contentText);
      setLocalVideoUrl(lesson.videoUrl ?? '');
    }
  }, [lesson]);

  // Reset when course changes
  useEffect(() => {
    setSelectedLessonId(null);
    setLocalContent('');
    setLocalVideoUrl('');
  }, [selectedCourseId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.md')) {
      toast.error('Please select a .md file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLocalContent(ev.target?.result as string ?? '');
      toast.success(`Loaded "${file.name}"`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSave = () => {
    if (!selectedLessonId) return;
    updateContent(
      {
        lessonId: selectedLessonId,
        contentText: localContent,
        videoUrl: localVideoUrl.trim() || null,
      },
      {
        onSuccess: () => toast.success('Lesson saved'),
        onError: () => toast.error('Failed to save — please try again'),
      },
    );
  };

  const isDirty = lesson
    ? localContent !== lesson.contentText || localVideoUrl !== (lesson.videoUrl ?? '')
    : localContent !== '' || localVideoUrl !== '';

  return (
    <div className="space-y-6">
      {/* Course selector */}
      <div className="space-y-1.5">
        <label className="label">Course</label>
        <select
          className="input"
          value={selectedCourseId ?? ''}
          onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">— Select a course —</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {selectedCourseId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Module / lesson tree */}
          <div className="lg:col-span-1 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-surface-500 mb-2">
              Lessons
            </p>
            {structureLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 rounded-lg" />
                ))}
              </div>
            ) : !structure?.modules.length ? (
              <p className="text-sm text-surface-500">No modules found.</p>
            ) : (
              structure.modules.map((mod) => (
                <div key={mod.id} className="mb-3">
                  <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide px-2 mb-1">
                    {mod.title}
                  </p>
                  {mod.lessons.map((ls) => (
                    <button
                      key={ls.id}
                      onClick={() => setSelectedLessonId(ls.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all ${
                        selectedLessonId === ls.id
                          ? 'bg-primary-500/20 text-primary-400 font-medium'
                          : 'text-surface-400 hover:text-surface-200 hover:bg-surface-700/50'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{ls.title}</span>
                      {selectedLessonId === ls.id && (
                        <ChevronRight className="h-3.5 w-3.5 ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Editor panel */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedLessonId ? (
              <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-surface-700 text-surface-500 text-sm">
                Select a lesson to edit its content
              </div>
            ) : lessonLoading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-surface-200">{lesson?.title}</p>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".md"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                      Upload .md
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSave}
                      isLoading={isSaving}
                      disabled={!isDirty}
                    >
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      Save
                    </Button>
                  </div>
                </div>

                {/* Video URL field */}
                <div className="space-y-1.5">
                  <label className="label">Video URL</label>
                  <input
                    type="url"
                    className="input text-sm"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={localVideoUrl}
                    onChange={(e) => setLocalVideoUrl(e.target.value)}
                  />
                </div>

                {/* Markdown content */}
                <div className="space-y-1.5">
                  <label className="label">Content (Markdown)</label>
                  <textarea
                    className="input font-mono text-sm resize-y min-h-[360px] leading-relaxed"
                    placeholder="Enter lesson content in Markdown..."
                    value={localContent}
                    onChange={(e) => setLocalContent(e.target.value)}
                    spellCheck={false}
                  />
                </div>

                {isDirty && (
                  <p className="text-xs text-amber-400">Unsaved changes</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
