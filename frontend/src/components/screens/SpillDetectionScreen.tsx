import { useState } from 'react';
import type { Investigation } from '../../types/investigation';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';

interface Props {
  investigation: Investigation;
}

export function SpillDetectionScreen({ investigation }: Props) {
  const [tab, setTab] = useState<'raw' | 'processed' | 'detection'>('detection');
  const spill = investigation.spillDetection;
  const obs = spill.observation;
  const ch = spill.characteristics;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#f8fafc' }}>
      {/* SAR viewer */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff', borderRight: '1px solid var(--chart-line)' }}>
        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '10px 16px',
            borderBottom: '1px solid var(--chart-line)',
            background: '#ffffff',
          }}
        >
          {(['raw', 'processed', 'detection'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '6px 16px',
                border: '1px solid',
                borderColor: tab === t ? '#bfdbfe' : '#e2e8f0',
                borderRadius: 6,
                fontSize: 12,
                fontFamily: 'var(--font-ui)',
                cursor: 'pointer',
                background: tab === t ? '#eff6ff' : '#ffffff',
                color: tab === t ? '#1d4ed8' : 'var(--text-secondary)',
                fontWeight: tab === t ? 700 : 500,
                transition: 'all 0.15s',
              }}
            >
              {t === 'raw' ? 'Raw SAR (Sigma0)' : t === 'processed' ? 'Speckle Filtered (Lee Sigma)' : 'Neural Detection Mask'}
            </button>
          ))}
        </div>

        {/* Image canvas */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0f172a',
            position: 'relative',
            padding: 20,
          }}
        >
          <svg width="680" height="480" viewBox="0 0 680 480" style={{ background: '#1e293b', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            {/* Ocean backscatter texture */}
            <defs>
              <pattern id="sar-clutter" width="6" height="6" patternUnits="userSpaceOnUse">
                <rect width="6" height="6" fill="#334155" />
                <rect width="3" height="3" fill="#475569" />
                <rect x="3" y="3" width="3" height="3" fill="#1e293b" />
              </pattern>
            </defs>
            <rect width="680" height="480" fill={tab === 'raw' ? 'url(#sar-clutter)' : '#1e293b'} />

            {/* Slick dark region (capillary wave suppression) */}
            <path
              d="M 220 160 Q 320 120 440 190 T 500 320 Q 380 370 250 300 Z"
              fill="#090d16"
              stroke={tab === 'detection' ? '#ef4444' : '#0f172a'}
              strokeWidth={tab === 'detection' ? 2.5 : 1}
              strokeDasharray={tab === 'detection' ? '6,4' : 'none'}
              opacity={0.95}
            />

            {tab === 'detection' && (
              <>
                <path
                  d="M 220 160 Q 320 120 440 190 T 500 320 Q 380 370 250 300 Z"
                  fill="#dc2626"
                  fillOpacity="0.2"
                />
                {/* Centroid Reticle */}
                <circle cx="350" cy="245" r="6" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
                <line x1="334" y1="245" x2="366" y2="245" stroke="#ffffff" strokeWidth="1.5" />
                <line x1="350" y1="229" x2="350" y2="261" stroke="#ffffff" strokeWidth="1.5" />
                {/* Orientation axis line */}
                <line x1="240" y1="170" x2="480" y2="310" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4,4" />
              </>
            )}
          </svg>

          {/* Overlay telemetry labels */}
          <div
            style={{
              position: 'absolute',
              top: 32,
              left: 32,
              fontSize: 11,
              background: 'rgba(15,23,42,0.85)',
              padding: '6px 12px',
              borderRadius: 6,
              color: '#93c5fd',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div className="data" style={{ color: '#ffffff' }}>
              {obs.satellite} · {obs.mode} · {obs.polarization} · {obs.resolutionMeters}m res · {obs.incidenceAngleDeg}°
            </div>
          </div>
        </div>
      </div>

      {/* Analysis panel */}
      <div
        style={{
          width: 390,
          flexShrink: 0,
          background: '#ffffff',
          overflowY: 'auto',
          padding: 20,
        }}
      >
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
          SAR Spill Detection Summary
        </h3>

        <div style={rowStyle}>
          <span style={lbl}>Hypothesis</span>
          <span style={{ color: 'var(--alert)', fontWeight: 700 }}>{ch.slickTypeHypothesis}</span>
        </div>
        <div style={rowStyle}>
          <span style={lbl}>Observed Area</span>
          <span className="data" style={{ fontSize: 13, fontWeight: 700, color: 'var(--alert)' }}>{ch.areaKm2} km²</span>
        </div>
        <div style={rowStyle}>
          <span style={lbl}>Centroid Location</span>
          <span className="data" style={{ color: '#0f172a' }}>{ch.centroid.lat.toFixed(4)}° N, {ch.centroid.lng.toFixed(4)}° E</span>
        </div>
        <div style={rowStyle}>
          <span style={lbl}>Detection Confidence</span>
          <ConfidenceIndicator level={spill.detectionConfidence} size="sm" />
        </div>
        <div style={rowStyle}>
          <span style={lbl}>Look-Alike Risk</span>
          <ConfidenceIndicator level={ch.lookAlikeRisk} size="sm" />
        </div>

        <h4 style={{ margin: '20px 0 8px', fontSize: 11, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Morphology & Backscatter
        </h4>
        <div style={rowStyle}>
          <span style={lbl}>Perimeter</span>
          <span className="data" style={{ color: '#0f172a' }}>{ch.perimeterKm} km</span>
        </div>
        <div style={rowStyle}>
          <span style={lbl}>Major Axis / Minor Axis</span>
          <span className="data" style={{ color: '#0f172a' }}>{ch.majorAxisKm} km / {ch.minorAxisKm} km</span>
        </div>
        <div style={rowStyle}>
          <span style={lbl}>Orientation Azimuth</span>
          <span className="data" style={{ color: '#0f172a' }}>{ch.orientationDeg}°</span>
        </div>
        <div style={rowStyle}>
          <span style={lbl}>Mean Backscatter (Sigma0)</span>
          <span className="data" style={{ color: '#0f172a' }}>{ch.meanBackscatterDb} dB</span>
        </div>
        <div style={rowStyle}>
          <span style={lbl}>Contrast vs. Ambient Sea</span>
          <span className="data" style={{ color: 'var(--alert)', fontWeight: 700 }}>{ch.contrastDb} dB</span>
        </div>
        <div style={rowStyle}>
          <span style={lbl}>Smoothness Index</span>
          <span className="data" style={{ color: '#0f172a' }}>{ch.smoothnessIndex}</span>
        </div>

        <h4 style={{ margin: '20px 0 8px', fontSize: 11, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Neural Segmentation Engine
        </h4>
        <div style={rowStyle}>
          <span style={lbl}>Model Name</span>
          <span className="data" style={{ color: '#0f172a' }}>{spill.modelName}</span>
        </div>
        <div style={rowStyle}>
          <span style={lbl}>Version Tag</span>
          <span className="data" style={{ color: '#0f172a' }}>{spill.modelVersion}</span>
        </div>
        <div style={rowStyle}>
          <span style={lbl}>Input Polarization</span>
          <span>Sentinel-1 GRD ({obs.polarization})</span>
        </div>
        <div style={rowStyle}>
          <span style={lbl}>GPU Inference Latency</span>
          <span className="data" style={{ color: 'var(--confirmed)', fontWeight: 700 }}>{spill.inferenceTimeMs} ms</span>
        </div>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: 11, color: 'var(--text-secondary)' };
const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
  fontSize: 12,
  paddingBottom: 4,
  borderBottom: '1px solid #f1f5f9',
};
