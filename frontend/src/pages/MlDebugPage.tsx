import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/api/admin';
import type { PredictionLogEntry, MlStatusResponse } from '@/api/admin';

export function MlDebugPage() {
  const [predictions, setPredictions] = useState<PredictionLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<MlStatusResponse | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [loadingTest, setLoadingTest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [pred, stat] = await Promise.all([
        adminApi.getMlPredictions(20),
        adminApi.getMlStatus(),
      ]);
      setPredictions(pred.predictions);
      setTotal(pred.total);
      setStatus(stat);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleTestPrediction = async () => {
    setLoadingTest(true);
    setTestResult(null);
    try {
      const res = await adminApi.sendTestPrediction();
      setTestResult(res.success ? res.response ?? 'OK' : `Error: ${res.error}`);
    } catch (e) {
      setTestResult(`Error: ${e}`);
    } finally {
      setLoadingTest(false);
    }
  };

  const sourceColor = (source: string) =>
    source === 'ml_model' ? '#22c55e' : '#f59e0b';

  return (
    <div style={{ fontFamily: 'monospace', background: '#0a0c12', minHeight: '100vh', color: '#e2e8f0', padding: '24px' }}>
      <h1 style={{ color: '#00e5c8', marginBottom: 4 }}>ML Debug Dashboard</h1>
      <p style={{ color: '#475569', marginBottom: 24, fontSize: 13 }}>
        Admin-only · Predictions stored in memory (last 100) · Resets on backend restart
      </p>

      {error && (
        <div style={{ background: '#7f1d1d', padding: '10px 16px', borderRadius: 6, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Model status */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#a78bfa', marginBottom: 12 }}>ML Service Status</h2>
        {status ? (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <Stat label="Reachable" value={status.reachable ? '✓ Yes' : '✗ No'} color={status.reachable ? '#22c55e' : '#ef4444'} />
            <Stat label="Status" value={status.status} />
            <Stat label="Model Loaded" value={status.model_loaded ? 'Yes' : 'No'} color={status.model_loaded ? '#22c55e' : '#f59e0b'} />
            <Stat label="Model Version" value={status.model_version ?? '—'} />
            <Stat label="Uptime" value={status.uptime_seconds != null ? `${Math.round(status.uptime_seconds)}s` : '—'} />
          </div>
        ) : (
          <p style={{ color: '#475569' }}>Loading...</p>
        )}
      </section>

      {/* Test prediction button */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#a78bfa', marginBottom: 12 }}>Test Prediction</h2>
        <button
          onClick={handleTestPrediction}
          disabled={loadingTest}
          style={{
            background: loadingTest ? '#1e293b' : '#00e5c8',
            color: '#0a0c12',
            border: 'none',
            borderRadius: 6,
            padding: '8px 20px',
            fontFamily: 'monospace',
            fontWeight: 700,
            cursor: loadingTest ? 'not-allowed' : 'pointer',
          }}
        >
          {loadingTest ? 'Sending...' : 'Send Test Prediction'}
        </button>
        {testResult && (
          <pre style={{
            marginTop: 12,
            background: '#111827',
            padding: '10px 14px',
            borderRadius: 6,
            fontSize: 12,
            overflowX: 'auto',
            color: '#a3e635',
          }}>
            {testResult}
          </pre>
        )}
      </section>

      {/* Predictions table */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <h2 style={{ color: '#a78bfa', margin: 0 }}>Last Predictions</h2>
          <span style={{ color: '#475569', fontSize: 13 }}>Stored: {total} / 100</span>
          <button
            onClick={load}
            style={{
              background: 'transparent',
              color: '#00e5c8',
              border: '1px solid #00e5c8',
              borderRadius: 4,
              padding: '3px 10px',
              fontFamily: 'monospace',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>

        {predictions.length === 0 ? (
          <p style={{ color: '#475569' }}>No predictions recorded yet. Run a quiz session to populate this list.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: '#64748b', textAlign: 'left', borderBottom: '1px solid #1e293b' }}>
                  <th style={{ padding: '6px 10px' }}>Session</th>
                  <th style={{ padding: '6px 10px' }}>Current</th>
                  <th style={{ padding: '6px 10px' }}>Predicted</th>
                  <th style={{ padding: '6px 10px' }}>Confidence</th>
                  <th style={{ padding: '6px 10px' }}>Source</th>
                  <th style={{ padding: '6px 10px' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((p, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid #111827',
                      background: i % 2 === 0 ? '#0d1117' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '6px 10px', color: '#94a3b8' }}>{p.sessionId}</td>
                    <td style={{ padding: '6px 10px', color: '#e2e8f0' }}>{p.currentDifficulty}</td>
                    <td style={{ padding: '6px 10px', color: '#00e5c8', fontWeight: 700 }}>{p.predictedDifficulty}</td>
                    <td style={{ padding: '6px 10px', color: '#e2e8f0' }}>{(p.confidence * 100).toFixed(1)}%</td>
                    <td style={{ padding: '6px 10px', color: sourceColor(p.source), fontWeight: 600 }}>
                      {p.source === 'ml_model' ? 'ML Model' : 'Rule-based'}
                    </td>
                    <td style={{ padding: '6px 10px', color: '#475569', fontSize: 12 }}>
                      {new Date(p.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: '#111827', padding: '10px 16px', borderRadius: 6, minWidth: 120 }}>
      <div style={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ color: color ?? '#e2e8f0', fontWeight: 700, fontSize: 15 }}>{value}</div>
    </div>
  );
}
