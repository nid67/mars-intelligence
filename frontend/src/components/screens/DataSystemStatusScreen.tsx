import type { Investigation } from '../../types/investigation';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';

interface Props {
  investigation: Investigation;
}

export function StatusScreen({ investigation }: Props) {
  const dq = investigation.dataQuality;

  const feeds = [
    { name: 'Sentinel-1A SAR (Copernicus)', status: 'Active', latency: '2.1h', quality: dq.satelliteQuality, updated: '2026-09-08T18:41:00Z' },
    { name: 'AIS terrestrial (DGLL / INCOIS)', status: 'Active', latency: '12s', quality: dq.aisQuality, updated: '2026-09-08T18:44:52Z' },
    { name: 'ECMWF ERA5 atmospheric wind', status: 'Active', latency: '6h', quality: dq.windModelQuality, updated: '2026-09-08T12:00:00Z' },
    { name: 'Copernicus CMEMS ocean currents', status: 'Active', latency: '3h', quality: dq.currentModelQuality, updated: '2026-09-08T15:30:00Z' },
    { name: 'Lagrangian OpenDrift Engine', status: 'Active', latency: '—', quality: dq.driftModelQuality, updated: '2026-09-08T18:45:12Z' },
  ];

  const models = [
    { name: 'DeepSAR-UNet Segmentation', version: investigation.spillDetection.modelVersion, purpose: 'Oil slick segmentation from SAR imagery', status: 'Loaded' },
    { name: 'MARS Lagrangian Engine', version: 'v2.4', purpose: 'Backward/forward particle drift tracking', status: 'Loaded' },
    { name: 'MARS Multi-Factor Attribution', version: 'v2.4', purpose: 'Multi-factor candidate vessel scoring', status: 'Loaded' },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 24, background: '#f8fafc' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
          Data Feeds & Infrastructure Telemetry
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: 12, color: 'var(--text-secondary)' }}>
          Real-time health status of Copernicus Sentinel-1 ingestors, hydrodynamic models, AIS receivers, and neural inference engines.
        </p>

        {/* Data feeds */}
        <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Upstream Data Feeds
        </h4>
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid var(--chart-line)', overflow: 'hidden', marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                {['Source Name', 'Operational Status', 'Quality Tier', 'Stream Latency', 'Last Ingest UTC'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {feeds.map(f => (
                <tr key={f.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{f.name}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--confirmed)', fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--confirmed)' }} />
                      {f.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}><ConfidenceIndicator level={f.quality} size="sm" /></td>
                  <td className="data" style={{ padding: '10px 12px', color: '#0f172a' }}>{f.latency}</td>
                  <td className="data" style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{f.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Models */}
        <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Neural Models & Simulation Engines
        </h4>
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid var(--chart-line)', overflow: 'hidden', marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                {['Engine / Model', 'Version Tag', 'Forensic Purpose', 'Engine State'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {models.map(m => (
                <tr key={m.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0f172a' }}>{m.name}</td>
                  <td className="data" style={{ padding: '10px 12px', color: '#1d4ed8', fontWeight: 600 }}>{m.version}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{m.purpose}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--confirmed)', fontWeight: 600 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--confirmed)' }} />
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* System */}
        <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Deployment Metadata
        </h4>
        <div style={{ background: '#ffffff', border: '1px solid var(--chart-line)', borderRadius: 8, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={rowStyle}>
            <span style={lbl}>Platform Version</span>
            <span className="data" style={{ color: '#0f172a', fontWeight: 600 }}>{investigation.modelVersion}</span>
          </div>
          <div style={rowStyle}>
            <span style={lbl}>Last Ingestion Cycle</span>
            <span className="data" style={{ color: '#0f172a' }}>{investigation.lastProcessedTimestamp}</span>
          </div>
          <div style={{ ...rowStyle, marginBottom: 0, borderBottom: 'none' }}>
            <span style={lbl}>Operational Data Mode</span>
            <span style={{ color: '#1d4ed8', fontWeight: 700, background: '#eff6ff', padding: '2px 8px', borderRadius: 4, border: '1px solid #bfdbfe' }}>
              {investigation.dataMode}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: 12, color: 'var(--text-secondary)' };
const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
  fontSize: 12,
  paddingBottom: 6,
  borderBottom: '1px solid #f1f5f9',
};
