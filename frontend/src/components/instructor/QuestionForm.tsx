import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui';
import { useAddQuestion, useUpdateQuestion } from '@/hooks/useInstructor';
import type { CourseQuestionItem, SaveAnswerItem } from '@/types';
import toast from 'react-hot-toast';

interface QuestionFormProps {
  courseId: number;
  moduleId?: number | null;
  editQuestion?: CourseQuestionItem | null;
  onClose: () => void;
}

const defaultAnswers: SaveAnswerItem[] = [
  { text: '', isCorrect: true },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
];

export function QuestionForm({ courseId, moduleId, editQuestion, onClose }: QuestionFormProps) {
  const addQuestion = useAddQuestion();
  const updateQuestion = useUpdateQuestion();
  const isEdit = !!editQuestion;

  const [text, setText] = useState('');
  const [difficulty, setDifficulty] = useState(5);
  const [category, setCategory] = useState('');
  const [questionType, setQuestionType] = useState<'mcq' | 'dragdrop'>('mcq');
  const [quizType, setQuizType] = useState<string>('miniquiz');
  const [answers, setAnswers] = useState<SaveAnswerItem[]>(defaultAnswers);

  useEffect(() => {
    if (editQuestion) {
      setText(editQuestion.text);
      setDifficulty(editQuestion.difficultyLevel);
      setQuestionType(editQuestion.questionType as 'mcq' | 'dragdrop');
      setAnswers(
        editQuestion.answers.length > 0
          ? editQuestion.answers.map(a => ({ text: a.text, isCorrect: a.isCorrect }))
          : defaultAnswers
      );
    }
  }, [editQuestion]);

  function setCorrect(idx: number) {
    setAnswers(answers.map((a, i) => ({ ...a, isCorrect: i === idx })));
  }

  function updateAnswerText(idx: number, val: string) {
    setAnswers(answers.map((a, i) => i === idx ? { ...a, text: val } : a));
  }

  function addAnswer() {
    setAnswers([...answers, { text: '', isCorrect: false }]);
  }

  function removeAnswer(idx: number) {
    if (answers.length <= 2) return;
    const next = answers.filter((_, i) => i !== idx);
    // ensure at least one correct
    if (!next.some(a => a.isCorrect)) next[0].isCorrect = true;
    setAnswers(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return toast.error('Question text is required');
    if (questionType === 'mcq' && answers.some(a => !a.text.trim())) {
      return toast.error('All answer fields must be filled');
    }

    const payload = {
      courseId,
      moduleId: moduleId ?? null,
      text: text.trim(),
      difficultyLevel: difficulty,
      category: category.trim(),
      questionType,
      quizType: quizType || null,
      answers: questionType === 'mcq' ? answers : [],
    };

    try {
      if (isEdit) {
        await updateQuestion.mutateAsync({ id: editQuestion!.questionId, payload });
        toast.success('Question updated');
      } else {
        await addQuestion.mutateAsync(payload);
        toast.success('Question added');
      }
      onClose();
    } catch {
      toast.error('Failed to save question');
    }
  }

  const isPending = addQuestion.isPending || updateQuestion.isPending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-surface-700 bg-surface-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-surface-100">
            {isEdit ? 'Edit Question' : 'Add Question'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Question text */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-surface-400 uppercase tracking-wide">Question Text</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder-surface-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
              placeholder="Enter question text..."
              required
            />
          </div>

          {/* Row: difficulty + type + quiz type */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-surface-400 uppercase tracking-wide">
                Difficulty: {difficulty}
              </label>
              <input
                type="range" min={1} max={10} value={difficulty}
                onChange={e => setDifficulty(Number(e.target.value))}
                className="w-full accent-primary-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-surface-400 uppercase tracking-wide">Type</label>
              <select
                value={questionType}
                onChange={e => setQuestionType(e.target.value as 'mcq' | 'dragdrop')}
                className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-sm text-surface-100 focus:border-primary-500 focus:outline-none"
              >
                <option value="mcq">MCQ</option>
                <option value="dragdrop">Drag-Drop</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-surface-400 uppercase tracking-wide">Quiz Type</label>
              <select
                value={quizType}
                onChange={e => setQuizType(e.target.value)}
                className="w-full rounded-lg border border-surface-600 bg-surface-800 px-3 py-2 text-sm text-surface-100 focus:border-primary-500 focus:outline-none"
              >
                <option value="miniquiz">Mini Quiz</option>
                <option value="finalquiz">Final Quiz</option>
              </select>
            </div>
          </div>

          {/* Category */}
          <Input
            label="Category (optional)"
            value={category}
            onChange={e => setCategory(e.target.value)}
            placeholder="e.g. VR Fundamentals"
          />

          {/* Answers (MCQ only) */}
          {questionType === 'mcq' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-surface-400 uppercase tracking-wide">
                  Answers (select correct)
                </label>
                <button type="button" onClick={addAnswer}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary-400 hover:bg-primary-500/10">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              {answers.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio" name="correct" checked={a.isCorrect}
                    onChange={() => setCorrect(i)}
                    className="accent-primary-500 shrink-0"
                  />
                  <input
                    type="text" value={a.text}
                    onChange={e => updateAnswerText(i, e.target.value)}
                    placeholder={`Answer ${i + 1}`}
                    className="flex-1 rounded-lg border border-surface-600 bg-surface-800 px-3 py-1.5 text-sm text-surface-100 placeholder-surface-500 focus:border-primary-500 focus:outline-none"
                  />
                  <button type="button" onClick={() => removeAnswer(i)}
                    className="shrink-0 rounded p-1 text-surface-500 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {questionType === 'dragdrop' && (
            <p className="rounded-lg border border-surface-700 bg-surface-800/50 p-3 text-xs text-surface-400">
              Drag-drop question saved without answers — configure the drag-drop JSON directly in the database or use the default empty template.
            </p>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-surface-600 px-4 py-2 text-sm text-surface-400 hover:bg-surface-700">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50">
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
