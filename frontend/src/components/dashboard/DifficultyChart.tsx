import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { AccuracyPoint } from '@/types';

interface DifficultyChartProps {
  data: AccuracyPoint[];
}

export function DifficultyChart({ data }: DifficultyChartProps) {
  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800/60">
      <h3 className="mb-4 text-sm font-semibold text-surface-700 dark:text-surface-300">
        Difficulty Progression
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="sessionNumber"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Session', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }}
          />
          <YAxis
            domain={[1, 10]}
            ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#e2e8f0',
              fontSize: 12,
            }}
            formatter={(value) => [value, 'Difficulty']}
            labelFormatter={(label) => `Session ${label}`}
          />
          <Line
            type="monotone"
            dataKey="difficulty"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={{ fill: '#a78bfa', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
