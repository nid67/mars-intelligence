import { useState, useEffect } from 'react';
import type { Investigation } from '../../types/investigation';
import { GisMap } from '../gis/GisMap';
import { TimelineBar } from '../common/TimelineBar';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { ScoreBar } from '../common/ScoreBar';

interface Props {
  investigation: Investigation;
}

export function OverviewScreen({ investigation }: Props) {
  const [selectedId, setSelectedId] = useState(
    investigation.candidates[0]?.vessel.id || ''
  );
  const [scrub, setScrub] = useState(investigation.observationTimestamp);

  // Sync selected vessel when investigation changes
  useEffect(() => {
    if (investigation.candidates.length > 0) {
      setSelectedId(investigation.candidates[0].vessel.id);
      setScrub(investigation.observationTimestamp);
    }
  }, [investigation.id, investigation.observationTimestamp]);

  const drift = investigation.driftRun;
  const selected =
    investigation.candidates.find(c => c.vessel.id === selectedId) ||
    investigation.candidates[0] || {
      vessel: { id: '', name: 'No candidates', mmsi: 0, imo: 0, flag: '', vesselType: '', lengthMeters: 0, beamMeters: 0, draftMeters: 0, trajectory: [], callsign: '' },
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

  if (investigation.status === 'CREATED') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Investigation Pending Execution</h2>
        <p style={{ color: '#475569', marginBottom: 24, textAlign: 'center', maxWidth: 400 }}>
          This incident scenario has been seeded but the forensic pipeline has not yet been executed.
        </p>
        <button
          onClick={async () => {
             const { runInvestigationPipeline } = await import('../../api');
             alert('Pipeline started! This might take a minute...');
             await runInvestigationPipeline(investigation.id);
             window.location.reload();
          }}
          style={{
            padding: '10px 20px',
            background: '#1d4ed8',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Execute Forensic Pipeline (21-Step Process)
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
      {/* Epistemic Provenance Bar */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid var(--chart-line)',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 11,
          color: 'var(--text-secondary)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span>
            Incident: <strong style={{ color: '#1d4ed8' }}>{investigation.code}</strong> ({investigation.locationName})
          </span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span>
            SAR Pass: <span className="data">{fmtTime(investigation.observationTimestamp)}</span>
          </span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span>
            Detected Area: <span className="data" style={{ color: 'var(--alert)', fontWeight: 700 }}>{investigation.spillDetection.characteristics.areaKm2} km²</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            Lagrangian 500-Particle Monte Carlo Drift Simulation
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── MAP (full-bleed, takes remaining space) ── */}
        <div style={{ flex: 1, position: 'relative' }}>
          <GisMap
            investigation={investigation}
            selectedCandidateId={selectedId}
            onSelectCandidate={setSelectedId}
            scrubTimestamp={scrub}
          />
        </div>

        {/* ── EVIDENCE PANEL (390px right) ── */}
        <div
          style={{
            width: 390,
            flexShrink: 0,
            background: '#ffffff',
            borderLeft: '1px solid var(--chart-line)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Investigation summary */}
          <section style={{ padding: 16, borderBottom: '1px solid var(--chart-line)' }}>
            <h3
              style={{
                margin: 0,
                fontSize: 11,
                fontWeight: 700,
                color: '#1e293b',
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Incident Forensic Summary
            </h3>
            <div style={rowStyle}>
              <span style={labelStyle}>Observation Sensor</span>
              <span className="data" style={{ color: '#0f172a' }}>
                {investigation.spillDetection.observation.satellite} ({investigation.spillDetection.observation.polarization})
              </span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Slick Polygon Area</span>
              <span className="data" style={{ fontWeight: 700, color: 'var(--alert)' }}>
                {investigation.spillDetection.characteristics.areaKm2} km²
              </span>
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Detection Confidence</span>
              <ConfidenceIndicator level={investigation.spillDetection.detectionConfidence} size="sm" />
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Probable Origin Region</span>
              <ConfidenceIndicator level={drift.originConfidence} size="sm" />
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Estimated Release Window</span>
              <span className="data" style={{ color: '#0f172a' }}>
                {fmtTime(drift.estimatedReleaseWindow.startTime)} – {fmtHour(drift.estimatedReleaseWindow.endTime)} UTC
              </span>
            </div>
          </section>

          {/* Candidate vessels */}
          <section style={{ padding: 16, borderBottom: '1px solid var(--chart-line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#1e293b',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Candidate Vessels ({investigation.candidates.length})
              </h3>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Sorted by Attribution Score</span>
            </div>

            {investigation.candidates.map(c => {
              const sel = c.vessel.id === selectedId;
              return (
                <button
                  key={c.vessel.id}
                  onClick={() => setSelectedId(c.vessel.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '9px 12px',
                    marginBottom: 6,
                    border: `1px solid ${sel ? '#93c5fd' : '#e2e8f0'}`,
                    borderRadius: 6,
                    background: sel ? '#eff6ff' : '#ffffff',
                    borderLeft: sel ? '3px solid #2563eb' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-ui)',
                    fontSize: 12,
                    textAlign: 'left',
                    color: '#0f172a',
                    transition: 'all 0.1s',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: '#2563eb', marginRight: 8 }}>
                      #{c.rank}
                    </span>
                    <span style={{ fontWeight: sel ? 700 : 600 }}>{c.vessel.name}</span>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {c.vessel.vesselType} · {c.vessel.flag}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="data" style={{ fontSize: 16, fontWeight: 700, color: c.rank === 1 ? 'var(--confirmed)' : '#0f172a' }}>
                      {c.attributionScore}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block' }}>/100</span>
                  </div>
                </button>
              );
            })}
          </section>

          {/* Selected candidate detail */}
          {selected.vessel.id && (
            <section style={{ padding: 16, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  {selected.vessel.name}
                </h3>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: selected.rank === 1 ? 'var(--confirmed)' : '#b45309',
                    background: selected.rank === 1 ? 'var(--confirmed-bg)' : 'var(--uncertain-bg)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    border: `1px solid ${selected.rank === 1 ? '#bbf7d0' : '#fde68a'}`,
                  }}
                >
                  RANK #{selected.rank}
                </span>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                <span className="data">MMSI {selected.vessel.mmsi}</span> · <span className="data">IMO {selected.vessel.imo}</span> · {selected.vessel.flag}
              </div>

              {/* Score breakdown */}
              <ScoreBar breakdown={selected.factorBreakdown} total={selected.attributionScore} />

              {/* Supporting evidence */}
              <div style={{ marginTop: 16 }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>Supporting Evidence</span>
                </h4>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#1e293b', lineHeight: 1.6 }}>
                  {selected.supportingEvidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>

              {/* Contradicting evidence */}
              <div style={{ marginTop: 12 }}>
                <h4 style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>Contradicting Evidence & Gaps</span>
                </h4>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#1e293b', lineHeight: 1.6 }}>
                  {selected.contradictingEvidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>

              {/* Disclaimer */}
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
                Attribution scores indicate investigative priority based on available observational and reconstructed evidence. They do not establish legal culpability.
              </p>
            </section>
          )}
        </div>
      </div>

      {/* ── TIMELINE BAR (bottom) ── */}
      <TimelineBar
        value={scrub}
        onChange={setScrub}
        releaseStart={drift.estimatedReleaseWindow.startTime}
        releaseEnd={drift.estimatedReleaseWindow.endTime}
        sarTime={investigation.observationTimestamp}
      />
    </div>
  );
}

// ── helpers ──
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtTime = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
};

const fmtHour = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};

const labelStyle: React.CSSProperties = { fontSize: 11, color: 'var(--text-secondary)' };
const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 6,
};
