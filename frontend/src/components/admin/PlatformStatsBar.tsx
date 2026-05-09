import { useState, useEffect } from 'react';
import { adminApi } from '@/api/admin';
import type { PlatformStats } from '@/api/admin';

export function PlatformStatsBar() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    adminApi.getPlatformStats().then(setStats).catch(() => null);
  }, []);

  if (!stats) {
    return (
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ background: '#111827', borderRadius: 6, padding: '10px 16px', minWidth: 130, height: 54, opacity: 0.4 }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
      <StatCard label="Total Users"    value={String(stats.totalUsers)} />
      <StatCard label="Students"       value={String(stats.totalStudents)} />
      <StatCard label="Active Today"   value={String(stats.activeSessionsToday)} color="#22c55e" />
      <StatCard label="Total Sessions" value={String(stats.totalSessionsAllTime)} />
      <StatCard label="Platform Avg"   value={`${stats.averageAccuracyPlatform}%`} color="#00e5c8" />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: '#111827', padding: '10px 16px', borderRadius: 6, minWidth: 130 }}>
      <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ color: color ?? '#e2e8f0', fontWeight: 700, fontSize: 18 }}>{value}</div>
    </div>
  );
}
