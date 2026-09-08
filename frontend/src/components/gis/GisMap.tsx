import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Polyline, Marker, Popup, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Investigation, AISPosition } from '../../types/investigation';
import { Layers, Wind, Compass } from 'lucide-react';

interface GisMapProps {
  investigation: Investigation;
  selectedCandidateId: string | null;
  onSelectCandidate: (id: string) => void;
  scrubTimestamp: string;
  activeForecast?: 6 | 12 | 24 | null;
}

// Vessel marker: sharp directional triangle
function vesselIcon(color: string, selected: boolean) {
  const sz = selected ? 24 : 18;
  return L.divIcon({
    html: `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="2.5"><polygon points="12,2 22,22 12,17 2,22"/></svg>`,
    className: '',
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz / 2],
  });
}

function MapUpdater({ caseId, bounds }: { caseId: string; bounds: [[number, number], [number, number]] }) {
  const map = useMap();
  const prevCaseIdRef = useState<string | null>(null);

  useEffect(() => {
    if (bounds && bounds.length === 2 && prevCaseIdRef[0] !== caseId) {
      prevCaseIdRef[1](caseId);
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [35, 35], maxZoom: 13 });
    }
  }, [caseId, bounds, map, prevCaseIdRef]);
  return null;
}

export function GisMap({
  investigation,
  selectedCandidateId,
  onSelectCandidate,
  scrubTimestamp,
  activeForecast,
}: GisMapProps) {
  const [layers, setLayers] = useState({
    spill: true,
    origin: true,
    particles: true,
    forecast: true,
    vessels: true,
  });
  const [showPanel, setShowPanel] = useState(false);

  const spill = investigation.spillDetection;
  const drift = investigation.driftRun;
  const candidates = investigation.candidates;

  const spillPoly: [number, number][] = spill.polygon.map(p => [p.lat, p.lng]);
  const originPoly: [number, number][] = drift.probableOriginRegion.map(p => [p.lat, p.lng]);
  const center: [number, number] = [spill.characteristics.centroid.lat, spill.characteristics.centroid.lng];

  const nearest = (traj: AISPosition[], ts: string) => {
    if (!traj || traj.length === 0) return { lat: center[0], lng: center[1], timestamp: ts, sogKnots: 0, cogDeg: 0, headingDeg: 0, navStatus: '' };
    const t = new Date(ts).getTime();
    let best = traj[0];
    let bestD = Infinity;
    for (const p of traj) {
      const d = Math.abs(new Date(p.timestamp).getTime() - t);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    return best;
  };

  const trackColor = (rank: number, selected: boolean) => {
    if (selected) return '#1d4ed8'; // Primary Brand Blue
    if (rank === 1) return 'var(--confirmed)'; // Green
    if (rank === 2) return 'var(--uncertain)'; // Amber
    return '#64748b'; // Slate
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <MapUpdater caseId={investigation.id} bounds={investigation.mapBounds} />
        <ZoomControl position="bottomleft" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Spill polygon — alert red color, solid stroke */}
        {layers.spill && (
          <>
            <Polygon
              positions={spillPoly}
              pathOptions={{
                color: '#dc2626',
                weight: 2.5,
                fillColor: '#ef4444',
                fillOpacity: 0.35,
              }}
            >
              <Popup>
                <div style={{ fontSize: 12 }}>
                  <strong style={{ color: '#dc2626' }}>Potential Oil Slick: {investigation.code}</strong>
                  <br />
                  Area: <strong>{spill.characteristics.areaKm2} km²</strong> · Major axis: {spill.characteristics.majorAxisKm} km
                  <br />
                  Backscatter contrast: <strong>{spill.characteristics.contrastDb} dB</strong>
                  <br />
                  <span className="data">{spill.observation.acquisitionTime}</span>
                </div>
              </Popup>
            </Polygon>
            <CircleMarker
              center={[spill.characteristics.centroid.lat, spill.characteristics.centroid.lng]}
              radius={5}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#dc2626',
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -6]}>
                Observed Slick ({spill.characteristics.areaKm2} km²)
              </Tooltip>
            </CircleMarker>
          </>
        )}

        {/* Probable origin — amber color, dashed stroke (shows it's estimated) */}
        {layers.origin && (
          <Polygon
            positions={originPoly}
            pathOptions={{
              color: '#d97706',
              weight: 2.5,
              dashArray: '6,4',
              fillColor: '#f59e0b',
              fillOpacity: 0.18,
            }}
          >
            <Tooltip permanent direction="right" offset={[10, 0]}>
              Probable Origin Region
            </Tooltip>
          </Polygon>
        )}

        {/* Backward particle cloud — small amber dots */}
        {layers.particles &&
          drift.particles.map(pt => (
            <CircleMarker
              key={pt.id}
              center={[pt.lat, pt.lng]}
              radius={2.5}
              pathOptions={{
                color: '#d97706',
                fillColor: '#f59e0b',
                fillOpacity: pt.probabilityDensity * 0.85,
                weight: 0,
              }}
            />
          ))}

        {/* Forward forecast polygons — blue dashed bands */}
        {layers.forecast && (
          <>
            {(!activeForecast || activeForecast === 6) && (
              <Polygon
                positions={drift.forecasts.h6.confidencePolygon.map(p => [p.lat, p.lng])}
                pathOptions={{
                  color: '#2563eb',
                  weight: 2,
                  dashArray: '4,4',
                  fillColor: '#3b82f6',
                  fillOpacity: activeForecast === 6 ? 0.22 : 0.08,
                }}
              >
                <Tooltip direction="top">+6h Forecast</Tooltip>
              </Polygon>
            )}
            {(!activeForecast || activeForecast === 12) && (
              <Polygon
                positions={drift.forecasts.h12.confidencePolygon.map(p => [p.lat, p.lng])}
                pathOptions={{
                  color: '#2563eb',
                  weight: 1.5,
                  dashArray: '6,6',
                  fillColor: '#3b82f6',
                  fillOpacity: activeForecast === 12 ? 0.22 : 0.06,
                }}
              >
                <Tooltip direction="top">+12h Forecast</Tooltip>
              </Polygon>
            )}
            {(!activeForecast || activeForecast === 24) && (
              <Polygon
                positions={drift.forecasts.h24.confidencePolygon.map(p => [p.lat, p.lng])}
                pathOptions={{
                  color: '#2563eb',
                  weight: 1.5,
                  dashArray: '8,8',
                  fillColor: '#3b82f6',
                  fillOpacity: activeForecast === 24 ? 0.22 : 0.04,
                }}
              >
                <Tooltip direction="top">+24h Forecast</Tooltip>
              </Polygon>
            )}
          </>
        )}

        {/* AIS vessel tracks */}
        {layers.vessels &&
          candidates.map(c => {
            const sel = c.vessel.id === selectedCandidateId;
            const color = trackColor(c.rank, sel);
            const pos = nearest(c.vessel.trajectory, scrubTimestamp);
            return (
              <div key={c.vessel.id}>
                <Polyline
                  positions={c.vessel.trajectory.map(t => [t.lat, t.lng])}
                  pathOptions={{
                    color,
                    weight: sel ? 3.5 : 2,
                    opacity: sel ? 1 : 0.7,
                    dashArray: c.rank === 3 ? '4,4' : undefined,
                  }}
                  eventHandlers={{ click: () => onSelectCandidate(c.vessel.id) }}
                />
                <Marker
                  position={[pos.lat, pos.lng]}
                  icon={vesselIcon(color, sel)}
                  eventHandlers={{ click: () => onSelectCandidate(c.vessel.id) }}
                >
                  <Popup>
                    <div style={{ fontSize: 12 }}>
                      <strong>{c.vessel.name}</strong>
                      <br />
                      <span className="data">MMSI {c.vessel.mmsi}</span> · {c.vessel.vesselType}
                      <br />
                      Attribution Score: <strong style={{ color: '#1d4ed8' }}>{c.attributionScore}/100</strong> (Rank #{c.rank})
                    </div>
                  </Popup>
                </Marker>
              </div>
            );
          })}
      </MapContainer>

      {/* Layer toggle — compact, top-right */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 1000,
          background: '#ffffff',
          border: '1px solid var(--chart-line)',
          borderRadius: 6,
          padding: 8,
          fontSize: 11,
          boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
        }}
      >
        <button
          onClick={() => setShowPanel(!showPanel)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'none',
            border: 'none',
            color: '#1e293b',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '2px 4px',
            fontSize: 11,
            fontFamily: 'var(--font-ui)',
          }}
        >
          <Layers size={14} color="#1d4ed8" /> Layers
        </button>
        {showPanel && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
            {(
              [
                ['spill', 'Spill polygon', '#dc2626'],
                ['origin', 'Origin region', '#d97706'],
                ['particles', 'Particle cloud', '#d97706'],
                ['forecast', 'Drift forecast', '#2563eb'],
                ['vessels', 'AIS tracks', '#16a34a'],
              ] as const
            ).map(([k, label, color]) => (
              <label
                key={k}
                onClick={() => setLayers(l => ({ ...l, [k]: !l[k] }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  color: layers[k] ? '#0f172a' : '#94a3b8',
                  padding: '3px 4px',
                  borderRadius: 4,
                  fontWeight: layers[k] ? 600 : 400,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: layers[k] ? color : 'transparent',
                    border: `1.5px solid ${color}`,
                    flexShrink: 0,
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Environmental forcing — bottom-left, clean white pill */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          zIndex: 1000,
          background: '#ffffff',
          border: '1px solid var(--chart-line)',
          borderRadius: 6,
          padding: '6px 14px',
          fontSize: 11,
          color: '#334155',
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          fontWeight: 500,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Wind size={14} color="#2563eb" />
          <span>Wind: <strong>{investigation.environmentalData.windSpeedKnots} kn @ {investigation.environmentalData.windDirectionDeg}°</strong></span>
        </span>
        <span style={{ color: '#cbd5e1' }}>|</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Compass size={14} color="#0284c7" />
          <span>Current: <strong>{investigation.environmentalData.currentSpeedKnots} kn @ {investigation.environmentalData.currentDirectionDeg}°</strong></span>
        </span>
      </div>
    </div>
  );
}
