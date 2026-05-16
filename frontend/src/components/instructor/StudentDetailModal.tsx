import { X, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { useStudentDetail } from '@/hooks/useInstructor';

interface StudentDetailModalProps {
  userId: number;
  onClose: () => void;
}

function AccuracyCell({ value }: { value: number }) {
  const color = value >= 80 ? 'text-green-400' : value >= 60 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-semibold ${color}`}>{value}%</span>;
}

export function StudentDetailModal({ userId, onClose }: StudentDetailModalProps) {
  const { data, isLoading } = useStudentDetail(userId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-surface-700 bg-surface-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-surface-100">Student Details</h2>
            {data && <p className="text-sm text-surface-400">{data.email}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-700 hover:text-surface-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
          </div>
        ) : data ? (
          <div className="space-y-8">
            {/* Session history */}
            <section>
              <h3 className="mb-3 text-sm font-semibold text-surface-300 uppercase tracking-wide">
                Session History
              </h3>
              {data.sessions.length === 0 ? (
                <p className="text-sm text-surface-500">No sessions yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-surface-700">
                  <table className="w-full text-sm">
                    <thead className="border-b border-surface-700 bg-surface-800">
                      <tr>
                        {['Date', 'Questions', 'Accuracy', 'Difficulty', 'Duration'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-surface-400 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.sessions.map((s, i) => (
                        <tr key={i} className="border-b border-surface-800 odd:bg-surface-900/40 even:bg-surface-800/40">
                          <td className="px-3 py-2 text-surface-400">
                            {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-3 py-2 text-surface-300">{s.questionsAnswered}</td>
                          <td className="px-3 py-2"><AccuracyCell value={s.accuracy} /></td>
                          <td className="px-3 py-2 text-surface-300">{s.finalDifficulty}/10</td>
                          <td className="px-3 py-2 text-surface-400">{s.durationMinutes}m</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Weak questions */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-surface-300 uppercase tracking-wide">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                Weak Questions (answered wrong ≥2×)
              </h3>
              {data.weakQuestions.length === 0 ? (
                <p className="text-sm text-surface-500">No consistent weak areas — great performance!</p>
              ) : (
                <div className="space-y-2">
                  {data.weakQuestions.map((q) => {
                    const errorPct = q.totalAttempts === 0 ? 0 : Math.round(q.incorrectCount / q.totalAttempts * 100);
                    return (
                      <div key={q.questionId} className="rounded-lg border border-surface-700 bg-surface-800/60 p-3">
                        <p className="mb-2 text-sm text-surface-200">{q.questionText}</p>
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-700">
                            <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${errorPct}%` }} />
                          </div>
                          <span className="text-xs text-red-400 shrink-0">
                            {q.incorrectCount}/{q.totalAttempts} wrong ({errorPct}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        ) : (
          <p className="text-sm text-surface-500">Student not found.</p>
        )}
      </div>
    </div>
  );
}
