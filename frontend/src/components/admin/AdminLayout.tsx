import { NavLink, Outlet } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Platform Stats', to: '/admin/ml-debug' },
  { label: 'Users', to: '/admin/users' },
  { label: 'Courses', to: '/admin/courses' },
];

export function AdminLayout() {
  return (
    <div style={{ fontFamily: 'monospace', background: '#0a0c12', minHeight: '100vh', color: '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
      {/* Top navbar */}
      <nav style={{
        background: '#0d1117',
        borderBottom: '1px solid #1e293b',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        height: 48,
        flexShrink: 0,
      }}>
        <span style={{ color: '#00e5c8', fontWeight: 700, fontSize: 14, letterSpacing: '0.05em', marginRight: 16 }}>
          ADMIN
        </span>
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              color: isActive ? '#00e5c8' : '#64748b',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: isActive ? 700 : 400,
              borderBottom: isActive ? '2px solid #00e5c8' : '2px solid transparent',
              paddingBottom: 2,
              transition: 'color 0.15s',
            })}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Page content */}
      <div style={{ flex: 1, padding: '24px' }}>
        <Outlet />
      </div>
    </div>
  );
}
