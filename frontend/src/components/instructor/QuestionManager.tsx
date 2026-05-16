import { useState } from 'react';
import { Plus, Pencil, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { QuestionForm } from './QuestionForm';
import { useCourseQuestions } from '@/hooks/useInstructor';
import type { CourseQuestionItem } from '@/types';

interface QuestionManagerProps {
  courses: { id: number; title: string }[];
}

function IncorrectRateBar({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const color = pct < 20 ? 'bg-green-500' : pct <= 50 ? 'bg-yellow-500' : 'bg-red-500';
  const label = pct < 20 ? 'text-green-400' : pct <= 50 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-700">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-medium ${label}`}>{pct}%</span>
    </div>
  );
}

export function QuestionManager({ courses }: QuestionManagerProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(
    courses.length > 0 ? courses[0].id : null
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<CourseQuestionItem | null>(null);
  const [editModuleId, setEditModuleId] = useState<number | null>(null);

  const { data: groups = [], isLoading } = useCourseQuestions(selectedCourseId);

  function openAdd(moduleId: number | null) {
    setEditQuestion(null);
    setEditModuleId(moduleId);
    setFormOpen(true);
  }

  function openEdit(q: CourseQuestionItem, moduleId: number) {
    setEditQuestion(q);
    setEditModuleId(moduleId);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Course selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-surface-400">Course:</label>
        <div className="relative">
          <select
            value={selectedCourseId ?? ''}
            onChange={e => setSelectedCourseId(Number(e.target.value))}
            className="appearance-none rounded-lg border border-surface-600 bg-surface-800 py-2 pl-3 pr-8 text-sm text-surface-100 focus:border-primary-500 focus:outline-none"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
        </div>
        <button
          onClick={() => openAdd(null)}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-600"
        >
          <Plus className="h-4 w-4" /> Add Question
        </button>
      </div>

      {/* Question groups */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : groups.length === 0 ? (
        <p className="py-10 text-center text-sm text-surface-500">No questions found for this course.</p>
      ) : (
        groups.map(group => (
          <div key={group.moduleId} className="rounded-xl border border-surface-700 overflow-hidden">
            <div className="flex items-center justify-between border-b border-surface-700 bg-surface-800 px-4 py-3">
              <h3 className="font-semibold text-surface-200">{group.moduleTitle}</h3>
              <button
                onClick={() => openAdd(group.moduleId || null)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary-400 hover:bg-primary-500/10"
              >
                <Plus className="h-3.5 w-3.5" /> Add to module
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b border-surface-800 bg-surface-900/60">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-surface-500 uppercase">Question</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-surface-500 uppercase">Diff.</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-surface-500 uppercase">Attempts</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-surface-500 uppercase">Incorrect Rate</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {group.questions.map((q, i) => (
                  <tr
                    key={q.questionId}
                    className={`border-b border-surface-800 ${i % 2 === 0 ? 'bg-surface-900/30' : 'bg-surface-800/30'}`}
                  >
                    <td className="max-w-xs px-4 py-3">
                      <p className="line-clamp-2 text-surface-200">{q.text}</p>
                      <span className="text-xs text-surface-500">{q.questionType.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-surface-400">{q.difficultyLevel}/10</td>
                    <td className="px-4 py-3 text-center text-surface-400">{q.totalAttempts}</td>
                    <td className="px-4 py-3"><IncorrectRateBar rate={q.incorrectRate} /></td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(q, group.moduleId)}
                        className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-700 hover:text-primary-400"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      {/* Form modal */}
      {formOpen && selectedCourseId && (
        <QuestionForm
          courseId={selectedCourseId}
          moduleId={editModuleId}
          editQuestion={editQuestion}
          onClose={() => { setFormOpen(false); setEditQuestion(null); }}
        />
      )}
    </div>
  );
}
