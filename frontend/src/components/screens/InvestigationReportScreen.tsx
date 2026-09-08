import type { Investigation } from '../../types/investigation';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { Printer } from 'lucide-react';

interface Props {
  investigation: Investigation;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const fmtDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`;
};

const fmtHoursOnly = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};

export function ReportScreen({ investigation }: Props) {
  const spill = investigation.spillDetection;
  const drift = investigation.driftRun;
  const candidates = investigation.candidates;
  const topCandidate = candidates[0];

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24, background: '#f8fafc' }}>
      <div
        style={{
          maxWidth: 840,
          margin: '0 auto',
          background: '#ffffff',
          padding: 36,
          borderRadius: 8,
          border: '1px solid var(--chart-line)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: '#1d4ed8',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  padding: '3px 8px',
                  borderRadius: 4,
                }}
              >
                OFFICIAL FORENSIC DOSSIER
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>MARS-Intelligence Platform</span>
            </div>
            <h1 style={{ margin: '4px 0', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
              Maritime Oil-Spill Investigation Report
            </h1>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Incident: <strong style={{ color: '#1d4ed8' }}>{investigation.code}</strong> · {investigation.title}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => window.print()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                background: '#ffffff',
                color: '#0f172a',
                cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
                fontSize: 12,
                fontWeight: 700,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <Printer size={14} /> Print / Export PDF
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        <Section title="1. Executive Summary & Attribution Finding">
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, lineHeight: 1.6, color: '#1e293b' }}>
            On <strong>{fmtDate(investigation.observationTimestamp)}</strong>, a potential oil slick covering approximately <strong>{spill.characteristics.areaKm2} km²</strong> was detected in the <strong>{investigation.region}</strong> via <strong>{spill.observation.satellite}</strong> C-band SAR observations. Physics-based backward drift trajectory modelling resolved the probable release window to <strong>{fmtDate(drift.estimatedReleaseWindow.startTime)} – {fmtHoursOnly(drift.estimatedReleaseWindow.endTime)} UTC</strong> around centroid <strong>({drift.originCentroid.lat.toFixed(4)}°N, {drift.originCentroid.lng.toFixed(4)}°E)</strong>. Spatiotemporal correlation against historical AIS traffic identified <strong>{topCandidate ? topCandidate.vessel.name : 'N/A'}</strong> as the primary candidate vessel with an Attribution Score of <strong>{topCandidate ? topCandidate.attributionScore : 0}/100</strong>.
          </div>
        </Section>

        {/* Case overview */}
        <Section title="2. Case & Regional Metadata">
          <Grid>
            <KV label="Incident Reference" value={investigation.code} data />
            <KV label="Maritime Region" value={investigation.region} />
            <KV label="Incident Location" value={investigation.locationName} />
            <KV label="Observation Time" value={fmtDate(investigation.observationTimestamp)} data />
            <KV label="Investigation Status" value={<ConfidenceIndicator level={investigation.status} size="sm" />} />
            <KV label="Data Classification" value={investigation.dataMode} />
          </Grid>
        </Section>

        {/* Spill detection */}
        <Section title="3. Satellite SAR Evidence & Slick Characterization">
          <Grid>
            <KV label="Sensor / Satellite" value={`${spill.observation.satellite} (${spill.observation.sensor})`} />
            <KV label="Acquisition Polarization" value={`${spill.observation.polarization} (IW Mode)`} data />
            <KV label="Observed Slick Area" value={`${spill.characteristics.areaKm2} km²`} data />
            <KV label="Major / Minor Axis" value={`${spill.characteristics.majorAxisKm} km / ${spill.characteristics.minorAxisKm} km`} data />
            <KV label="Backscatter Contrast" value={`${spill.characteristics.contrastDb} dB`} data />
            <KV label="Mean Backscatter (Sigma0)" value={`${spill.characteristics.meanBackscatterDb} dB`} data />
            <KV label="Orientation Azimuth" value={`${spill.characteristics.orientationDeg}°`} data />
            <KV label="Detection Confidence" value={<ConfidenceIndicator level={spill.detectionConfidence} size="sm" />} />
          </Grid>
        </Section>

        {/* Source reconstruction */}
        <Section title="4. Physics-Based Backward Drift Reconstruction">
          <Grid>
            <KV label="Probable Origin Centroid" value={`${drift.originCentroid.lat.toFixed(4)}° N, ${drift.originCentroid.lng.toFixed(4)}° E`} data />
            <KV label="Estimated Release Window" value={`${fmtDate(drift.estimatedReleaseWindow.startTime)} – ${fmtHoursOnly(drift.estimatedReleaseWindow.endTime)} UTC`} data />
            <KV label="Origin Probability Confidence" value={<ConfidenceIndicator level={drift.originConfidence} size="sm" />} />
            <KV label="Drift Engine" value={`Lagrangian ${drift.particleCount}-particle Monte Carlo`} />
            <KV label="Atmospheric Wind Forcing" value={`${investigation.environmentalData.windSpeedKnots} kn @ ${investigation.environmentalData.windDirectionDeg}° (${investigation.environmentalData.windSource})`} />
            <KV label="Ocean Current Forcing" value={`${investigation.environmentalData.currentSpeedKnots} kn @ ${investigation.environmentalData.currentDirectionDeg}° (${investigation.environmentalData.currentSource})`} />
          </Grid>
        </Section>

        {/* Candidate vessels */}
        <Section title="5. Candidate Vessel Filtering & Attribution Scoring">
          <div style={{ marginBottom: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
            Pipeline filtered {investigation.vesselPipelineSummary.totalConsidered} AIS tracks down to {candidates.length} final ranked candidates:
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 4 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                {['Rank', 'Vessel Name', 'MMSI / IMO', 'Type', 'Flag', 'Score', 'Priority'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.map(c => (
                <tr key={c.vessel.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tcell}>#{c.rank}</td>
                  <td style={{ ...tcell, fontWeight: 700, color: '#0f172a' }}>{c.vessel.name}</td>
                  <td className="data" style={tcell}>{c.vessel.mmsi} / {c.vessel.imo}</td>
                  <td style={tcell}>{c.vessel.vesselType}</td>
                  <td style={tcell}>{c.vessel.flag}</td>
                  <td className="data" style={{ ...tcell, fontWeight: 700, color: c.rank === 1 ? 'var(--confirmed)' : '#0f172a' }}>
                    {c.attributionScore}/100
                  </td>
                  <td style={tcell}>
                    <ConfidenceIndicator level={c.investigativePriority} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* Top candidate detail */}
        {topCandidate && (
          <Section title={`6. Detailed Evidence Breakdown: ${topCandidate.vessel.name} (Rank #1)`}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 8 }}>
              <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 6, border: '1px solid #bbf7d0' }}>
                <h5 style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#166534' }}>
                  Supporting Evidence
                </h5>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#14532d', lineHeight: 1.6 }}>
                  {topCandidate.supportingEvidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>

              <div style={{ background: '#fef2f2', padding: 14, borderRadius: 6, border: '1px solid #fecaca' }}>
                <h5 style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#991b1b' }}>
                  Contradicting Evidence & Limitations
                </h5>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: '#7f1d1d', lineHeight: 1.6 }}>
                  {topCandidate.contradictingEvidence.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>
        )}

        {/* Forward Forecast */}
        <Section title="7. Forward Spill Trajectory Forecast (+6h, +12h, +24h)">
          <Grid>
            <KV label="+6h Predicted Centroid" value={`${drift.forecasts.h6.predictedCentroid.lat.toFixed(4)}°N, ${drift.forecasts.h6.predictedCentroid.lng.toFixed(4)}°E (${drift.forecasts.h6.predictedAreaKm2} km²)`} data />
            <KV label="+6h Shoreline Risk" value={drift.forecasts.h6.shorelineImpactRisk} />
            <KV label="+12h Predicted Centroid" value={`${drift.forecasts.h12.predictedCentroid.lat.toFixed(4)}°N, ${drift.forecasts.h12.predictedCentroid.lng.toFixed(4)}°E (${drift.forecasts.h12.predictedAreaKm2} km²)`} data />
            <KV label="+12h Shoreline Risk" value={drift.forecasts.h12.shorelineImpactRisk} />
            <KV label="+24h Predicted Centroid" value={`${drift.forecasts.h24.predictedCentroid.lat.toFixed(4)}°N, ${drift.forecasts.h24.predictedCentroid.lng.toFixed(4)}°E (${drift.forecasts.h24.predictedAreaKm2} km²)`} data />
            <KV label="+24h Shoreline Risk" value={drift.forecasts.h24.shorelineImpactRisk} />
          </Grid>
        </Section>

        {/* Disclaimer */}
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            fontSize: 11,
            color: '#475569',
            lineHeight: 1.6,
          }}
        >
          <strong>Forensic Notice & Legal Disclaimer:</strong> This investigation report is generated using automated satellite SAR dark-spot detection, hydrodynamic Lagrangian particle trajectory modelling, and coastal/satellite AIS correlation. Attribution Scores indicate investigative priority and probabilistic correlation; they do not constitute legal determinations of culpability. Independent physical sampling, aerial reconnaissance, and vessel inspection are recommended for statutory enforcement.
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h3
        style={{
          margin: '0 0 10px',
          fontSize: 13,
          fontWeight: 700,
          paddingBottom: 6,
          borderBottom: '1px solid #e2e8f0',
          color: '#0f172a',
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 12 }}>
      {children}
    </div>
  );
}

function KV({ label, value, data }: { label: string; value: React.ReactNode; data?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{label}</span>
      <span className={data ? 'data' : undefined} style={{ fontSize: 11, color: '#0f172a', fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}

const tcell: React.CSSProperties = { padding: '8px 10px' };
