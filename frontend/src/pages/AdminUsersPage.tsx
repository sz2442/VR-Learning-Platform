import { useState, useEffect, useMemo } from 'react';
import { adminApi } from '@/api/admin';
import type { AdminUser } from '@/api/admin';

const ROLES = ['Student', 'Instructor', 'Admin'] as const;

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [confirmDeactivate, setConfirmDeactivate] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await adminApi.getUsers());
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const matchSearch = !q || u.email.toLowerCase().includes(q);
      const matchRole = !roleFilter || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  const handleRoleChange = async (user: AdminUser, newRole: string) => {
    setBusy(user.userId);
    try {
      await adminApi.updateUserRole(user.userId, newRole);
      setUsers((prev) => prev.map((u) => u.userId === user.userId ? { ...u, role: newRole } : u));
    } catch {
      setError(`Failed to update role for ${user.email}`);
    } finally {
      setBusy(null);
    }
  };

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return;
    setBusy(confirmDeactivate.userId);
    setConfirmDeactivate(null);
    try {
      await adminApi.deactivateUser(confirmDeactivate.userId);
      setUsers((prev) => prev.map((u) => u.userId === confirmDeactivate.userId ? { ...u, isActive: false } : u));
    } catch {
      setError(`Failed to deactivate ${confirmDeactivate.email}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <h1 style={{ color: '#00e5c8', marginBottom: 4 }}>User Management</h1>
      <p style={{ color: '#475569', marginBottom: 24, fontSize: 13 }}>
        {users.length} total users · role changes take effect on next login
      </p>

      {error && (
        <div style={{ background: '#7f1d1d', padding: '10px 16px', borderRadius: 6, marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={inputStyle}
        >
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading ? (
        <p style={{ color: '#475569' }}>Loading…</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#64748b', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
                <th style={th}>Email</th>
                <th style={th}>Role</th>
                <th style={th}>Joined</th>
                <th style={th}>Sessions</th>
                <th style={th}>Status</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '16px 10px', color: '#475569' }}>No users match the filter.</td>
                </tr>
              ) : filtered.map((user, i) => (
                <tr
                  key={user.userId}
                  style={{
                    borderBottom: '1px solid #111827',
                    background: i % 2 === 0 ? '#0d1117' : 'transparent',
                    opacity: user.isActive ? 1 : 0.45,
                  }}
                >
                  <td style={td}>{user.email}</td>
                  <td style={td}>
                    <select
                      value={user.role}
                      disabled={!user.isActive || busy === user.userId}
                      onChange={(e) => handleRoleChange(user, e.target.value)}
                      style={{
                        ...selectStyle,
                        color: roleColor(user.role),
                        opacity: busy === user.userId ? 0.5 : 1,
                      }}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td style={{ ...td, color: '#94a3b8' }}>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td style={td}>{user.totalSessions}</td>
                  <td style={td}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      background: user.isActive ? '#14532d' : '#1c1917',
                      color: user.isActive ? '#22c55e' : '#78716c',
                    }}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={td}>
                    {user.isActive && (
                      <button
                        disabled={busy === user.userId}
                        onClick={() => setConfirmDeactivate(user)}
                        style={deactivateBtn}
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation dialog */}
      {confirmDeactivate && (
        <div style={overlay}>
          <div style={dialog}>
            <h3 style={{ color: '#e2e8f0', marginBottom: 8 }}>Deactivate user?</h3>
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
              <strong style={{ color: '#e2e8f0' }}>{confirmDeactivate.email}</strong> will be deactivated and lose access. This cannot be undone from this panel.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDeactivate(null)} style={cancelBtn}>Cancel</button>
              <button onClick={handleDeactivate} style={confirmBtn}>Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: '#111827',
  border: '1px solid #1e293b',
  borderRadius: 6,
  color: '#e2e8f0',
  fontFamily: 'monospace',
  fontSize: 13,
  padding: '6px 12px',
  outline: 'none',
  minWidth: 180,
};

const selectStyle: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 4,
  fontFamily: 'monospace',
  fontSize: 12,
  padding: '3px 6px',
  cursor: 'pointer',
};

const th: React.CSSProperties = { padding: '6px 10px', fontWeight: 600 };
const td: React.CSSProperties = { padding: '8px 10px', color: '#e2e8f0' };

const deactivateBtn: React.CSSProperties = {
  background: 'transparent',
  color: '#ef4444',
  border: '1px solid #ef4444',
  borderRadius: 4,
  padding: '3px 10px',
  fontFamily: 'monospace',
  fontSize: 11,
  cursor: 'pointer',
};

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
};

const dialog: React.CSSProperties = {
  background: '#111827', border: '1px solid #1e293b',
  borderRadius: 8, padding: 24, maxWidth: 400, width: '90%',
};

const cancelBtn: React.CSSProperties = {
  background: 'transparent', color: '#64748b', border: '1px solid #334155',
  borderRadius: 4, padding: '6px 16px', fontFamily: 'monospace', fontSize: 13, cursor: 'pointer',
};

const confirmBtn: React.CSSProperties = {
  background: '#ef4444', color: '#fff', border: 'none',
  borderRadius: 4, padding: '6px 16px', fontFamily: 'monospace', fontSize: 13, cursor: 'pointer',
};

function roleColor(role: string) {
  if (role === 'Admin') return '#f59e0b';
  if (role === 'Instructor') return '#a78bfa';
  return '#e2e8f0';
}
