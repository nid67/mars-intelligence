import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface TimelineBarProps {
  value: string; // ISO timestamp
  onChange: (iso: string) => void;
  releaseStart: string;
  releaseEnd: string;
  sarTime: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function TimelineBar({ value, onChange, releaseStart, releaseEnd, sarTime }: TimelineBarProps) {
  const [playing, setPlaying] = useState(false);

  // Compute dynamic time boundaries from observation/release times
  const sarMs = new Date(sarTime).getTime();
  const T0 = isNaN(sarMs) ? new Date('2026-09-08T00:00:00Z').getTime() : sarMs - 16 * 3600 * 1000;
  const T1 = isNaN(sarMs) ? new Date('2026-09-08T18:00:00Z').getTime() : sarMs + 4 * 3600 * 1000;
  const RANGE = Math.max(1, T1 - T0);

  const cur = new Date(value).getTime();
  const pct = Math.min(100, Math.max(0, ((cur - T0) / RANGE) * 100));

  const relS = Math.min(100, Math.max(0, ((new Date(releaseStart).getTime() - T0) / RANGE) * 100));
  const relE = Math.min(100, Math.max(0, ((new Date(releaseEnd).getTime() - T0) / RANGE) * 100));
  const sarP = Math.min(100, Math.max(0, ((new Date(sarTime).getTime() - T0) / RANGE) * 100));

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const next = cur + 15 * 60_000;
      if (next > T1) { setPlaying(false); return; }
      onChange(new Date(next).toISOString());
    }, 400);
    return () => clearInterval(id);
  }, [playing, cur, onChange, T1]);

  const step = (dir: 1 | -1) => {
    const next = Math.min(T1, Math.max(T0, cur + dir * 30 * 60_000));
    onChange(new Date(next).toISOString());
  };

  const fmt = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')} UTC`;
  };

  return (
    <div
      style={{
        height: 48,
        flexShrink: 0,
        background: '#ffffff',
        borderTop: '1px solid var(--chart-line)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 16px',
        fontSize: 11,
        boxShadow: '0 -1px 3px rgba(0,0,0,0.02)',
      }}
    >
      {/* Controls */}
      <button onClick={() => step(-1)} style={btnStyle} title="Step back 30 min"><ChevronLeft size={14} /></button>
      <button onClick={() => setPlaying(!playing)} style={{ ...btnStyle, width: 28 }} title={playing ? "Pause replay" : "Play timeline replay"}>
        {playing ? <Pause size={12} /> : <Play size={12} />}
      </button>
      <button onClick={() => step(1)} style={btnStyle} title="Step forward 30 min"><ChevronRight size={14} /></button>

      {/* Track */}
      <div style={{ flex: 1, position: 'relative', height: 16 }}>
        {/* Track bg */}
        <div style={{
          position: 'absolute', top: 6, left: 0, right: 0, height: 5,
          background: '#f1f5f9', borderRadius: 3, border: '1px solid #cbd5e1',
        }} />

        {/* Release window band */}
        <div style={{
          position: 'absolute', top: 5, height: 7, borderRadius: 2,
          left: `${relS}%`, width: `${Math.max(1, relE - relS)}%`,
          background: 'var(--uncertain-bg)',
          border: '1px solid #f59e0b',
        }} title="Estimated Release Window" />

        {/* SAR observation tick */}
        <div style={{
          position: 'absolute', top: 2, height: 12, width: 3,
          left: `${sarP}%`, background: '#2563eb', borderRadius: 1.5,
        }} title="Satellite SAR Pass" />

        {/* Current position indicator */}
        <div style={{
          position: 'absolute', top: 1, width: 10, height: 14, borderRadius: 3,
          left: `calc(${pct}% - 5px)`,
          background: '#1d4ed8', border: '1.5px solid #ffffff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />

        {/* Hidden input */}
        <input
          type="range" min={0} max={100} step={0.1} value={pct}
          onChange={e => {
            const ms = T0 + (parseFloat(e.target.value) / 100) * RANGE;
            onChange(new Date(ms).toISOString());
          }}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: 16,
            opacity: 0, cursor: 'pointer', margin: 0,
          }}
        />
      </div>

      {/* Readout */}
      <span className="data" style={{ minWidth: 150, textAlign: 'right', fontSize: 11, color: '#0f172a', fontWeight: 600 }}>
        {fmt(value)}
      </span>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 26, height: 26, border: '1px solid #cbd5e1',
  borderRadius: 4, background: '#ffffff', color: '#1e293b',
  cursor: 'pointer', padding: 0,
};
