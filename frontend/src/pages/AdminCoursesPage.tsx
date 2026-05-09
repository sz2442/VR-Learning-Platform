import { useState, useEffect } from 'react';
import { adminApi } from '@/api/admin';
import type { AdminCourse } from '@/api/admin';

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setCourses(await adminApi.getCourses());
    } catch {
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleTogglePublish = async (course: AdminCourse) => {
    setBusy(course.courseId);
    try {
      const result = await adminApi.togglePublish(course.courseId);
      setCourses((prev) =>
        prev.map((c) => c.courseId === course.courseId ? { ...c, isPublished: result.isPublished } : c)
      );
    } catch {
      setError(`Failed to update publish status for "${course.title}"`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <h1 style={{ color: '#00e5c8', marginBottom: 4 }}>Course Management</h1>
      <p style={{ color: '#475569', marginBottom: 24, fontSize: 13 }}>
        {courses.length} courses · toggle publish status below
      </p>

      {error && (
        <div style={{ background: '#7f1d1d', padding: '10px 16px', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: '#475569' }}>Loading…</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#64748b', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
                <th style={th}>Title</th>
                <th style={th}>Published</th>
                <th style={th}>Students Enrolled</th>
                <th style={th}>Avg Accuracy</th>
                <th style={th}>Toggle</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '16px 10px', color: '#475569' }}>No courses found.</td>
                </tr>
              ) : courses.map((course, i) => (
                <tr
                  key={course.courseId}
                  style={{
                    borderBottom: '1px solid #111827',
                    background: i % 2 === 0 ? '#0d1117' : 'transparent',
                  }}
                >
                  <td style={{ ...td, maxWidth: 300 }}>{course.title}</td>
                  <td style={td}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      background: course.isPublished ? '#14532d' : '#1c1917',
                      color: course.isPublished ? '#22c55e' : '#78716c',
                    }}>
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ ...td, color: '#94a3b8' }}>{course.totalStudents}</td>
                  <td style={{ ...td, color: course.averageAccuracy >= 70 ? '#22c55e' : '#f59e0b' }}>
                    {course.averageAccuracy > 0 ? `${course.averageAccuracy}%` : '—'}
                  </td>
                  <td style={td}>
                    <Toggle
                      checked={course.isPublished}
                      disabled={busy === course.courseId}
                      onChange={() => handleTogglePublish(course)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ── Toggle switch component ────────────────────────────────────────────────

function Toggle({ checked, disabled, onChange }: { checked: boolean; disabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      aria-pressed={checked}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: 40,
        height: 22,
        borderRadius: 11,
        border: 'none',
        background: checked ? '#00e5c8' : '#334155',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 0.2s',
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute',
        left: checked ? 20 : 2,
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: '#0a0c12',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const th: React.CSSProperties = { padding: '6px 10px', fontWeight: 600 };
const td: React.CSSProperties = { padding: '8px 10px', color: '#e2e8f0' };
