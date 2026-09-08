import type { FactorBreakdown } from '../../types/investigation';

interface ScoreBarProps {
  breakdown: FactorBreakdown;
  total: number;
}

const FACTOR_LABELS: { key: keyof FactorBreakdown; label: string; type: 'pos' | 'neg' }[] = [
  { key: 'originCompatibility', label: 'Origin Match', type: 'pos' },
  { key: 'temporalCompatibility', label: 'Temporal Window', type: 'pos' },
  { key: 'driftCompatibility', label: 'Hydrodynamic Drift', type: 'pos' },
  { key: 'trajectoryAlignment', label: 'Track Alignment', type: 'pos' },
  { key: 'vesselType', label: 'Cargo Risk Profile', type: 'pos' },
  { key: 'aisQuality', label: 'AIS Continuity', type: 'pos' },
  { key: 'behavioralEvidence', label: 'Speed / Course', type: 'pos' },
  { key: 'aisGapPenalty', label: 'AIS Gap Penalty', type: 'neg' },
  { key: 'routeUncertaintyPenalty', label: 'Route Uncertainty', type: 'neg' },
];

export function ScoreBar({ breakdown, total }: ScoreBarProps) {
  // Sum positives for the bar width basis
  const posSum = FACTOR_LABELS
    .filter(f => f.type === 'pos')
    .reduce((s, f) => s + Math.max(0, breakdown[f.key]), 0);

  const negSum = FACTOR_LABELS
    .filter(f => f.type === 'neg')
    .reduce((s, f) => s + Math.abs(Math.min(0, breakdown[f.key])), 0);

  const barMax = Math.max(1, posSum + negSum); // full conceptual width

  return (
    <div>
      {/* Score total */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: total >= 70 ? 'var(--confirmed)' : '#0f172a', fontFamily: 'var(--font-data)' }}>
          {total}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>/ 100 attribution score</span>
      </div>

      {/* Stacked bar */}
      <div
        style={{
          display: 'flex',
          height: 12,
          borderRadius: 4,
          overflow: 'hidden',
          background: '#f1f5f9',
          border: '1px solid #cbd5e1',
          marginBottom: 12,
        }}
      >
        {FACTOR_LABELS.map(f => {
          const val = breakdown[f.key];
          const absVal = Math.abs(val);
          if (absVal === 0) return null;
          const pct = (absVal / barMax) * 100;
          return (
            <div
              key={f.key}
              title={`${f.label}: ${val > 0 ? '+' : ''}${val}`}
              style={{
                width: `${pct}%`,
                background: f.type === 'pos' ? '#16a34a' : '#dc2626',
                opacity: f.type === 'pos' ? (0.6 + (absVal / (posSum || 1)) * 0.4) : 0.8,
                minWidth: absVal > 0 ? 3 : 0,
              }}
            />
          );
        })}
      </div>

      {/* Factor list */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '3px 12px', fontSize: 11 }}>
        {FACTOR_LABELS.map(f => {
          const val = breakdown[f.key];
          if (val === 0) return null;
          return (
            <div key={f.key} style={{ display: 'contents' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
              <span
                className="data"
                style={{
                  textAlign: 'right',
                  color: val > 0 ? '#16a34a' : '#dc2626',
                  fontWeight: 700,
                }}
              >
                {val > 0 ? '+' : ''}{val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
