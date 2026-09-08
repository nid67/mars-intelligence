import { useState, useEffect } from 'react';
import type { Investigation } from '../../types/investigation';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { ScoreBar } from '../common/ScoreBar';

interface Props {
  investigation: Investigation;
  onNavigateEvidence: () => void;
}

export function AttributionScreen({ investigation, onNavigateEvidence }: Props) {
  const [selectedId, setSelectedId] = useState(
    investigation.candidates[0]?.vessel.id || ''
  );

  useEffect(() => {
    if (investigation.candidates.length > 0) {
      setSelectedId(investigation.candidates[0].vessel.id);
    }
  }, [investigation.id]);

  const candidates = investigation.candidates;
  const pipeline = investigation.vesselPipelineSummary;
  const selected =
    candidates.find(c => c.vessel.id === selectedId) ||
    candidates[0] || {
      vessel: { id: '', name: 'No Candidates', mmsi: 0, imo: 0, flag: '', vesselType: '', lengthMeters: 0, beamMeters: 0, draftMeters: 0, trajectory: [], callsign: '' },
      rank: 0,
      attributionScore: 0,
      investigativePriority: 'INSUFFICIENT',
      qualitativeStates: {},
      factorBreakdown: { originCompatibility: 0, temporalCompatibility: 0, driftCompatibility: 0, trajectoryAlignment: 0, vesselType: 0, aisQuality: 0, behavioralEvidence: 0, aisGapPenalty: 0, routeUncertaintyPenalty: 0 },
      supportingEvidence: [],
      contradictingEvidence: [],
      aisQualityScore: 'INSUFFICIENT',
      lastKnownDistanceToSpillOriginKm: 0,
      closestApproachTimestamp: '',
    };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#f8fafc' }}>
      {/* Left: pipeline + table */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
          Candidate Vessel Attribution & Trajectory Correlation
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
          Multi-factor scoring synthesizing spatiotemporal origin overlap, drift vector agreement, vessel type risk, and AIS broadcast continuity.
        </p>

        {/* Filtering pipeline — clean cards */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            marginBottom: 20,
            background: '#ffffff',
            border: '1px solid var(--chart-line)',
            borderRadius: 6,
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          {[
            { n: pipeline.totalConsidered, label: 'AIS In Range' },
            { n: pipeline.spatiallyRelevant, label: 'Spatial Filter' },
            { n: pipeline.temporallyCompatible, label: 'Release Window' },
            { n: pipeline.trajectoryCompatible, label: 'Drift Aligned' },
            { n: pipeline.finalCandidatesCount, label: 'Final Ranked' },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                textAlign: 'center',
                padding: '12px 8px',
                borderRight: i < 4 ? '1px solid var(--chart-line)' : 'none',
                background: i === 4 ? 'var(--confirmed-bg)' : '#ffffff',
              }}
            >
              <div
                className="data"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: i === 4 ? 'var(--confirmed)' : '#0f172a',
                }}
              >
                {s.n}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid var(--chart-line)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--chart-line)', background: '#f8fafc' }}>
                {['#', 'Vessel Name', 'Origin Match', 'Temporal Match', 'Drift Align', 'Track Vector', 'AIS Quality', 'Score'].map(h => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 12px',
                      textAlign: h === 'Score' ? 'right' : 'left',
                      fontWeight: 700,
                      color: '#475569',
                      fontSize: 11,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.map(c => {
                const sel = c.vessel.id === selectedId;
                const q = c.qualitativeStates;
                return (
                  <tr
                    key={c.vessel.id}
                    onClick={() => setSelectedId(c.vessel.id)}
                    style={{
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--chart-line)',
                      background: sel ? '#eff6ff' : '#ffffff',
                      borderLeft: sel ? '3px solid #2563eb' : '3px solid transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <td style={cellStyle}>#{c.rank}</td>
                    <td style={{ ...cellStyle, fontWeight: 700, color: sel ? '#1d4ed8' : '#0f172a' }}>{c.vessel.name}</td>
                    <td style={cellStyle}><ConfidenceIndicator level={q.originCompatibility} size="sm" /></td>
                    <td style={cellStyle}><ConfidenceIndicator level={q.temporalCompatibility} size="sm" /></td>
                    <td style={cellStyle}><ConfidenceIndicator level={q.driftCompatibility} size="sm" /></td>
                    <td style={cellStyle}><ConfidenceIndicator level={q.trajectoryAlignment} size="sm" /></td>
                    <td style={cellStyle}><ConfidenceIndicator level={q.aisQuality} size="sm" /></td>
                    <td style={{ ...cellStyle, textAlign: 'right' }}>
                      <span className="data" style={{ fontSize: 16, fontWeight: 700, color: c.rank === 1 ? 'var(--confirmed)' : '#0f172a' }}>
                        {c.attributionScore}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>/100</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* AIS telemetry table for selected candidate */}
        {selected.vessel.id && (
          <div style={{ marginTop: 24 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
              Reconstructed AIS Trajectory Positions — {selected.vessel.name}
            </h4>
            <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid var(--chart-line)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--chart-line)', background: '#f8fafc' }}>
                    {['Timestamp (UTC)', 'Latitude', 'Longitude', 'SOG (kn)', 'COG (°)', 'Nav Status', 'Dist. to Origin'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 10 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.vessel.trajectory.map((p, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: p.inOriginZone ? 'var(--uncertain-bg)' : '#ffffff',
                      }}
                    >
                      <td className="data" style={tcell}>{p.timestamp.replace('T', ' ').replace('Z', '')}</td>
                      <td className="data" style={tcell}>{p.lat.toFixed(4)}°N</td>
                      <td className="data" style={tcell}>{p.lng.toFixed(4)}°E</td>
                      <td className="data" style={tcell}>{p.sogKnots} kn</td>
                      <td className="data" style={tcell}>{p.cogDeg}°</td>
                      <td style={{ ...tcell, fontSize: 11, color: '#334155' }}>{p.navStatus}</td>
                      <td
                        className="data"
                        style={{
                          ...tcell,
                          color: p.inOriginZone ? '#b45309' : 'var(--text-secondary)',
                          fontWeight: p.inOriginZone ? 700 : 500,
                        }}
                      >
                        {p.distanceToOriginKm !== undefined ? `${p.distanceToOriginKm} km` : '—'}
                        {p.inOriginZone ? ' (IN ORIGIN ZONE)' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Right panel: selected candidate detail */}
      {selected.vessel.id && (
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              {selected.vessel.name}
            </h3>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: selected.rank === 1 ? 'var(--confirmed)' : '#b45309',
                background: selected.rank === 1 ? 'var(--confirmed-bg)' : 'var(--uncertain-bg)',
                border: `1px solid ${selected.rank === 1 ? '#bbf7d0' : '#fde68a'}`,
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              RANK #{selected.rank}
            </span>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>
            <span className="data">MMSI {selected.vessel.mmsi}</span> · <span className="data">IMO {selected.vessel.imo}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
            {selected.vessel.vesselType} · {selected.vessel.flag} · {selected.vessel.lengthMeters}m LOA
          </div>

          <ScoreBar breakdown={selected.factorBreakdown} total={selected.attributionScore} />

          <div style={{ marginTop: 16 }}>
            <h4 style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#166534' }}>
              Supporting Evidence
            </h4>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#1e293b', lineHeight: 1.6 }}>
              {selected.supportingEvidence.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: 12 }}>
            <h4 style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#991b1b' }}>
              Contradicting Evidence & Gaps
            </h4>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#1e293b', lineHeight: 1.6 }}>
              {selected.contradictingEvidence.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>

          {/* Data quality */}
          <h4 style={{ margin: '16px 0 8px', fontSize: 11, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Data Quality Assessment
          </h4>
          {(
            [
              ['Sentinel-1 SAR Geometry', investigation.dataQuality.satelliteQuality],
              ['AIS Stream Integrity', investigation.dataQuality.aisQuality],
              ['ECMWF ERA5 Wind Field', investigation.dataQuality.windModelQuality],
              ['CMEMS Marine Hydrodynamics', investigation.dataQuality.currentModelQuality],
              ['Lagrangian Particle Dispersion', investigation.dataQuality.driftModelQuality],
            ] as const
          ).map(([label, level]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 4,
                fontSize: 11,
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <ConfidenceIndicator level={level} size="sm" />
            </div>
          ))}

          <button
            onClick={onNavigateEvidence}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '9px 0',
              border: '1px solid #bfdbfe',
              borderRadius: 6,
              background: '#eff6ff',
              color: '#1d4ed8',
              cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Audit Evidence Chain →
          </button>

          <p style={{ marginTop: 12, fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Attribution scores prioritize investigative leads based on observational, hydrodynamic, and AIS evidence. They do not constitute legal determinations of liability.
          </p>
        </div>
      )}
    </div>
  );
}

const cellStyle: React.CSSProperties = { padding: '10px 12px' };
const tcell: React.CSSProperties = { padding: '7px 10px' };
