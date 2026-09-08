import type { IndianSimulatedVessel } from '../../data/indianMaritimeData';
import { AlertCircle } from 'lucide-react';

interface Props {
  vessel: IndianSimulatedVessel;
  currentWaypointIndex: number;
  onSelectWaypointIndex: (idx: number) => void;
  releaseWindowPeak?: string;
}

export function ShipSpeedTimelineGraph({
  vessel,
  currentWaypointIndex,
  onSelectWaypointIndex,
}: Props) {
  const pts = vessel.waypoints;
  if (!pts || pts.length === 0) return null;

  const width = 340;
  const height = 110;
  const padL = 30;
  const padR = 15;
  const padT = 15;
  const padB = 25;

  const maxSpeed = 18;
  const graphW = width - padL - padR;
  const graphH = height - padT - padB;

  const getX = (idx: number) => padL + (idx / Math.max(1, pts.length - 1)) * graphW;
  const getY = (sog: number) => padT + (1 - Math.min(maxSpeed, Math.max(0, sog)) / maxSpeed) * graphH;

  // Build SVG polyline points
  const pointsStr = pts.map((p, idx) => `${getX(idx)},${getY(p.sogKnots)}`).join(' ');

  const currentPt = pts[currentWaypointIndex] || pts[0];
  const hasSpeedDrop = pts.some(p => p.speedAnomaly || p.sogKnots < 4);

  return (
    <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 6, border: '1px solid #e2e8f0', marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Speed Profile Timeline (SOG Knots)
        </span>
        <span className="data" style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 700 }}>
          {currentPt.sogKnots} kn @ {currentPt.timestamp.slice(11, 16)} UTC
        </span>
      </div>

      {hasSpeedDrop && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, padding: '5px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, fontSize: 11, color: '#991b1b', fontWeight: 600 }}>
          <AlertCircle size={14} color="#dc2626" />
          <span>Anomaly: Sudden speed drop detected (14.2 kn → 2.1 kn)</span>
        </div>
      )}

      {/* SVG Chart */}
      <svg width={width} height={height} style={{ overflow: 'visible', display: 'block', margin: '0 auto' }}>
        {/* Horizontal grid lines */}
        {[0, 5, 10, 15].map(s => {
          const y = getY(s);
          return (
            <g key={s}>
              <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#e2e8f0" strokeDasharray="3,3" />
              <text x={padL - 4} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="var(--font-data)">
                {s}
              </text>
            </g>
          );
        })}

        {/* Speed curve */}
        <polyline
          fill="none"
          stroke={vessel.routeColor || '#2563eb'}
          strokeWidth="2.5"
          points={pointsStr}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interactive Waypoint Nodes */}
        {pts.map((p, idx) => {
          const cx = getX(idx);
          const cy = getY(p.sogKnots);
          const isSelected = idx === currentWaypointIndex;
          const isAnomaly = p.speedAnomaly || p.sogKnots < 4;

          return (
            <g
              key={idx}
              onClick={() => onSelectWaypointIndex(idx)}
              style={{ cursor: 'pointer' }}
            >
              {/* Highlight halo */}
              {isSelected && (
                <circle cx={cx} cy={cy} r={9} fill="#3b82f6" fillOpacity={0.25} />
              )}
              <circle
                cx={cx}
                cy={cy}
                r={isAnomaly ? 6 : isSelected ? 5 : 3.5}
                fill={isAnomaly ? '#dc2626' : isSelected ? '#1d4ed8' : '#ffffff'}
                stroke={isAnomaly ? '#ffffff' : '#2563eb'}
                strokeWidth={isAnomaly ? 2 : 1.5}
              />
              {/* X Axis Time Labels for first and last */}
              {(idx === 0 || idx === pts.length - 1 || isAnomaly) && (
                <text
                  x={cx}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill={isAnomaly ? '#dc2626' : '#64748b'}
                  fontFamily="var(--font-data)"
                  fontWeight={isAnomaly ? 700 : 500}
                >
                  {p.timestamp.slice(11, 16)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Trajectory Scrubber Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <button
          onClick={() => onSelectWaypointIndex(Math.max(0, currentWaypointIndex - 1))}
          disabled={currentWaypointIndex <= 0}
          style={{
            padding: '3px 8px',
            fontSize: 10,
            fontWeight: 600,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 4,
            cursor: currentWaypointIndex <= 0 ? 'not-allowed' : 'pointer',
            color: '#1e293b',
          }}
        >
          ◀ Backward
        </button>

        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
          Position {currentWaypointIndex + 1} of {pts.length}
        </span>

        <button
          onClick={() => onSelectWaypointIndex(Math.min(pts.length - 1, currentWaypointIndex + 1))}
          disabled={currentWaypointIndex >= pts.length - 1}
          style={{
            padding: '3px 8px',
            fontSize: 10,
            fontWeight: 600,
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 4,
            cursor: currentWaypointIndex >= pts.length - 1 ? 'not-allowed' : 'pointer',
            color: '#1e293b',
          }}
        >
          Forward ▶
        </button>
      </div>
    </div>
  );
}
