import { useState } from 'react';
import type { Investigation } from '../../types/investigation';
import { GisMap } from '../gis/GisMap';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';

interface Props {
  investigation: Investigation;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtDateAndHour = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
};

const fmtHour = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};

export function ReconstructionScreen({ investigation }: Props) {
  const [forecast, setForecast] = useState<6 | 12 | 24>(6);
  const drift = investigation.driftRun;
  const env = investigation.environmentalData;
  const fc = drift.forecasts[`h${forecast}`];

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#f8fafc' }}>
      {/* Map with backward drift + forecast layers active */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <GisMap
            investigation={investigation}
            selectedCandidateId={null}
            onSelectCandidate={() => {}}
            scrubTimestamp={investigation.observationTimestamp}
            activeForecast={forecast}
          />
        </div>

        {/* Forecast selector bar */}
        <div
          style={{
            height: 48,
            flexShrink: 0,
            background: '#ffffff',
            borderTop: '1px solid var(--chart-line)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 8,
            fontSize: 12,
            boxShadow: '0 -1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <span style={{ color: '#1e293b', marginRight: 8, fontWeight: 600 }}>
            Forward Dispersion Forecast:
          </span>
          {([6, 12, 24] as const).map(h => (
            <button
              key={h}
              onClick={() => setForecast(h)}
              style={{
                padding: '5px 14px',
                border: `1px solid ${forecast === h ? '#93c5fd' : '#cbd5e1'}`,
                borderRadius: 6,
                background: forecast === h ? '#eff6ff' : '#ffffff',
                color: forecast === h ? '#1d4ed8' : '#64748b',
                fontWeight: forecast === h ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                boxShadow: forecast === h ? '0 1px 3px rgba(37,99,235,0.1)' : 'none',
              }}
            >
              +{h} Hours
            </button>
          ))}
          <span className="data" style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: 11 }}>
            Predicted area: <strong style={{ color: '#0f172a' }}>{fc.predictedAreaKm2} km²</strong> · Shoreline Risk: <strong style={{ color: fc.shorelineImpactRisk === 'HIGH' ? 'var(--alert)' : '#166534' }}>{fc.shorelineImpactRisk}</strong>
          </span>
        </div>
      </div>

      {/* Right panel: drift model params + results */}
      <div
        style={{
          width: 390,
          flexShrink: 0,
          borderLeft: '1px solid var(--chart-line)',
          background: '#ffffff',
          overflowY: 'auto',
          padding: 20,
        }}
      >
        <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
          Physics-Based Backward Drift Reconstruction
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Simulates Lagrangian particle trajectories backward in time using coupled ERA5 surface winds (3.2% windage leeway factor) and Copernicus CMEMS ocean current fields.
        </p>

        {/* Result */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div style={rowStyle}>
            <span style={lbl}>Probable Origin Centroid</span>
            <span className="data" style={{ color: '#0f172a' }}>
              {drift.originCentroid.lat.toFixed(4)}° N, {drift.originCentroid.lng.toFixed(4)}° E
            </span>
          </div>
          <div style={rowStyle}>
            <span style={lbl}>Estimated Release Window</span>
            <span className="data" style={{ color: '#0f172a' }}>
              {fmtHour(drift.estimatedReleaseWindow.startTime)}–{fmtHour(drift.estimatedReleaseWindow.endTime)} UTC ({fmtDateAndHour(drift.estimatedReleaseWindow.startTime).split(',')[0]})
            </span>
          </div>
          <div style={rowStyle}>
            <span style={lbl}>Origin Spatial Confidence</span>
            <ConfidenceIndicator level={drift.originConfidence} size="sm" />
          </div>
          <div style={{ ...rowStyle, marginBottom: 0, borderBottom: 'none' }}>
            <span style={lbl}>Release-Time Window Confidence</span>
            <ConfidenceIndicator level={drift.estimatedReleaseWindow.confidence} size="sm" />
          </div>
        </div>

        {/* Model config */}
        <h4 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Drift Model Parameters
        </h4>
        <div style={rowStyle}>
          <span style={lbl}>Backward Duration</span>
          <span style={{ fontWeight: 600 }}>{drift.durationHours} hours</span>
        </div>
        <div style={rowStyle}>
          <span style={lbl}>Monte Carlo Particles</span>
          <span className="data" style={{ color: '#0f172a' }}>{drift.particleCount}</span>
        </div>
        <div style={rowStyle}>
          <span style={lbl}>Windage Leeway Coefficient</span>
          <span style={{ fontWeight: 600 }}>{drift.windagePercentage}% (Stokes Drift coupled)</span>
        </div>
        <div style={rowStyle}>
          <span style={lbl}>Turbulent Horizontal Diffusion</span>
          <span style={{ fontWeight: 600 }}>Enabled (Smagorinsky 0.1)</span>
        </div>

        {/* Environmental forcing */}
        <h4 style={{ margin: '16px 0 8px', fontSize: 11, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Environmental Forcing Telemetry
        </h4>
        <div style={rowStyle}>
          <span style={lbl}>Atmospheric Wind</span>
          <span className="data" style={{ color: '#0f172a' }}>
            {env.windSpeedKnots} kn @ {env.windDirectionDeg}°
          </span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 6 }}>{env.windSource}</div>
        <div style={rowStyle}>
          <span style={lbl}>Ocean Surface Current</span>
          <span className="data" style={{ color: '#0f172a' }}>
            {env.currentSpeedKnots} kn @ {env.currentDirectionDeg}°
          </span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 6 }}>{env.currentSource}</div>

        {/* Forecast detail */}
        <h4 style={{ margin: '16px 0 8px', fontSize: 11, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          +{forecast}h Forward Trajectory Forecast
        </h4>
        <div style={rowStyle}>
          <span style={lbl}>Predicted Centroid</span>
          <span className="data" style={{ color: '#0f172a' }}>
            {fc.predictedCentroid.lat.toFixed(4)}°N, {fc.predictedCentroid.lng.toFixed(4)}°E
          </span>
        </div>
        <div style={rowStyle}>
          <span style={lbl}>Predicted Slick Area</span>
          <span className="data" style={{ color: '#0f172a' }}>{fc.predictedAreaKm2} km²</span>
        </div>
        <div style={rowStyle}>
          <span style={lbl}>Drift Vector & Speed</span>
          <span className="data" style={{ color: '#0f172a' }}>
            {fc.driftVectorDeg}° @ {fc.driftSpeedKnots} kn
          </span>
        </div>
        <div style={rowStyle}>
          <span style={lbl}>Shoreline Proximity Risk</span>
          <span style={{ fontWeight: 700, color: fc.shorelineImpactRisk === 'HIGH' ? 'var(--alert)' : '#166534' }}>
            {fc.shorelineImpactRisk}
          </span>
        </div>

        <p
          style={{
            marginTop: 16,
            fontSize: 10,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            borderTop: '1px solid var(--chart-line)',
            paddingTop: 10,
          }}
        >
          The origin is estimated as a probabilistic density region and release window, not an absolute single point. Dashed boundaries denote mathematical uncertainty bounds.
        </p>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: 11, color: 'var(--text-secondary)' };
const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 6,
  fontSize: 12,
  paddingBottom: 4,
  borderBottom: '1px solid #f1f5f9',
};
