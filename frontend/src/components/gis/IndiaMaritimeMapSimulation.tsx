import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Polyline, Marker, Popup, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  INDIAN_PORTS,
  type IndianSimulatedVessel,
  type IndianSpillScenario,
} from '../../data/indianMaritimeData';

interface Props {
  ships: IndianSimulatedVessel[];
  activeScenario: IndianSpillScenario | null;
  selectedVesselId: string | null;
  onSelectVessel: (id: string) => void;
  onSelectSpill: (scenarioId: string) => void;
  showEnvironmentalVectors: boolean;
  showBackwardTrace: boolean;
  showForwardForecast: boolean;
  selectedForecastHours: 6 | 12 | 24;
  vesselWaypointIndices: Record<string, number>;
}

// Directional vessel SVG icon with heading rotation
function vesselMapIcon(vessel: IndianSimulatedVessel, isSelected: boolean, isSuspect: boolean, heading: number, speed: number) {
  const sz = isSelected ? 26 : isSuspect ? 22 : 18;
  const fill = isSuspect ? '#dc2626' : isSelected ? '#1d4ed8' : vessel.routeColor;
  const isStopped = speed < 4;

  return L.divIcon({
    html: `
      <div style="transform: rotate(${heading}deg); transform-origin: center; display: flex; align-items: center; justify-content: center; position: relative;">
        <svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="${fill}" stroke="#ffffff" stroke-width="2.5" style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.25));">
          <polygon points="12,2 22,22 12,17 2,22"/>
        </svg>
        ${isStopped ? `<div style="position: absolute; top: -6px; right: -6px; width: 9px; height: 9px; border-radius: 50%; background: #dc2626; border: 1.5px solid #fff;"></div>` : ''}
      </div>
    `,
    className: '',
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz / 2],
  });
}

function MapViewController({ scenarioId, targetCenter, targetZoom }: { scenarioId?: string; targetCenter: [number, number]; targetZoom: number }) {
  const map = useMap();
  const prevScenarioIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Only recenter and zoom when the user explicitly switches the incident/scenario or on initial mount
    if (prevScenarioIdRef.current !== scenarioId) {
      prevScenarioIdRef.current = scenarioId;
      map.setView(targetCenter, targetZoom, { animate: true });
    }
  }, [scenarioId, targetCenter, targetZoom, map]);

  return null;
}

export function IndiaMaritimeMapSimulation({
  ships,
  activeScenario,
  selectedVesselId,
  onSelectVessel,
  onSelectSpill,
  showEnvironmentalVectors,
  showBackwardTrace,
  showForwardForecast,
  selectedForecastHours,
  vesselWaypointIndices,
}: Props) {
  const initialCenter: [number, number] = activeScenario
    ? [activeScenario.slickCentroid.lat, activeScenario.slickCentroid.lng]
    : [17.5, 78.5]; // Central India / Bay of Bengal view
  const initialZoom = activeScenario ? 7 : 5;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        scrollWheelZoom
        zoomControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <MapViewController
          scenarioId={activeScenario?.id}
          targetCenter={initialCenter}
          targetZoom={initialZoom}
        />
        <ZoomControl position="bottomleft" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* ── INDIAN MAJOR PORTS ── */}
        {INDIAN_PORTS.map(port => (
          <CircleMarker
            key={port.id}
            center={[port.coordinates.lat, port.coordinates.lng]}
            radius={4.5}
            pathOptions={{
              color: '#0f172a',
              fillColor: '#ffffff',
              fillOpacity: 1,
              weight: 2,
            }}
          >
            <Tooltip direction="right" offset={[6, 0]}>
              <span style={{ fontWeight: 600 }}>{port.name}</span> ({port.type})
            </Tooltip>
          </CircleMarker>
        ))}

        {/* ── DETECTED OIL SPILL SCENARIO ── */}
        {activeScenario && (
          <>
            {/* Slick Polygon */}
            <Polygon
              positions={activeScenario.slickPolygon.map(p => [p.lat, p.lng])}
              pathOptions={{
                color: '#dc2626',
                weight: 3,
                fillColor: '#ef4444',
                fillOpacity: 0.4,
              }}
              eventHandlers={{ click: () => onSelectSpill(activeScenario.id) }}
            >
              <Popup>
                <div style={{ fontSize: 12 }}>
                  <strong style={{ color: '#dc2626' }}>{activeScenario.title}</strong>
                  <br />
                  Area: <strong>{activeScenario.slickAreaKm2} km²</strong>
                  <br />
                  Detected: <span className="data">{activeScenario.detectionTime}</span>
                  <br />
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>Click to reverse-engineer origin & currents</span>
                </div>
              </Popup>
            </Polygon>

            {/* Slick Centroid with Radar Pulse */}
            <CircleMarker
              center={[activeScenario.slickCentroid.lat, activeScenario.slickCentroid.lng]}
              radius={6}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#dc2626',
                fillOpacity: 1,
                weight: 2,
              }}
              eventHandlers={{ click: () => onSelectSpill(activeScenario.id) }}
            >
              <Tooltip permanent direction="top" offset={[0, -8]}>
                ⚠️ Detected Oil Slick ({activeScenario.slickAreaKm2} km²)
              </Tooltip>
            </CircleMarker>

            {/* ── BACKWARD TRACE & PROBABLE ORIGIN ── */}
            {showBackwardTrace && (
              <>
                {/* Probable Origin Zone */}
                <Polygon
                  positions={activeScenario.originRegion.map(p => [p.lat, p.lng])}
                  pathOptions={{
                    color: '#d97706',
                    weight: 2.5,
                    dashArray: '6,4',
                    fillColor: '#f59e0b',
                    fillOpacity: 0.2,
                  }}
                >
                  <Tooltip permanent direction="right" offset={[10, 0]}>
                    Probable Origin Region ({activeScenario.releaseWindow.peak})
                  </Tooltip>
                </Polygon>

                {/* Backward Particle Cloud */}
                {activeScenario.backwardParticles.map((pt, idx) => (
                  <CircleMarker
                    key={idx}
                    center={[pt.lat, pt.lng]}
                    radius={3}
                    pathOptions={{
                      color: '#d97706',
                      fillColor: '#f59e0b',
                      fillOpacity: pt.probability * 0.9,
                      weight: 0,
                    }}
                  />
                ))}

                {/* Reverse drift path line */}
                <Polyline
                  positions={[
                    [activeScenario.slickCentroid.lat, activeScenario.slickCentroid.lng],
                    [activeScenario.originCentroid.lat, activeScenario.originCentroid.lng],
                  ]}
                  pathOptions={{
                    color: '#d97706',
                    weight: 2,
                    dashArray: '4,4',
                    opacity: 0.8,
                  }}
                />
              </>
            )}

            {/* ── FORWARD DISPERSION FORECAST ── */}
            {showForwardForecast && (
              <Polygon
                positions={activeScenario.forwardForecast[`h${selectedForecastHours}`].polygon.map(p => [p.lat, p.lng])}
                pathOptions={{
                  color: '#2563eb',
                  weight: 2,
                  dashArray: '6,6',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.18,
                }}
              >
                <Tooltip direction="top">+{selectedForecastHours}h Forward Forecast ({activeScenario.forwardForecast[`h${selectedForecastHours}`].areaKm2} km²)</Tooltip>
              </Polygon>
            )}

            {/* ── ENVIRONMENTAL VECTORS AT SLICK LOCATION ── */}
            {showEnvironmentalVectors && (
              <>
                {/* Wind Flow Vector Line */}
                <Polyline
                  positions={[
                    [activeScenario.slickCentroid.lat, activeScenario.slickCentroid.lng],
                    [
                      activeScenario.slickCentroid.lat + Math.cos((activeScenario.environmental.windDirectionDeg * Math.PI) / 180) * 0.35,
                      activeScenario.slickCentroid.lng + Math.sin((activeScenario.environmental.windDirectionDeg * Math.PI) / 180) * 0.35,
                    ],
                  ]}
                  pathOptions={{ color: '#2563eb', weight: 3 }}
                />
                {/* Ocean Current Vector Line */}
                <Polyline
                  positions={[
                    [activeScenario.slickCentroid.lat, activeScenario.slickCentroid.lng],
                    [
                      activeScenario.slickCentroid.lat + Math.cos((activeScenario.environmental.currentDirectionDeg * Math.PI) / 180) * 0.25,
                      activeScenario.slickCentroid.lng + Math.sin((activeScenario.environmental.currentDirectionDeg * Math.PI) / 180) * 0.25,
                    ],
                  ]}
                  pathOptions={{ color: '#0891b2', weight: 2.5, dashArray: '5,3' }}
                />
              </>
            )}
          </>
        )}

        {/* ── SIMULATED SHIPS & LIVE TRAJECTORIES ── */}
        {ships.map(vessel => {
          const isSelected = vessel.id === selectedVesselId;
          const isSuspect = activeScenario?.suspectVesselId === vessel.id;
          const wpIdx = vesselWaypointIndices[vessel.id] !== undefined
            ? vesselWaypointIndices[vessel.id]
            : vessel.currentSpeedIndex;
          const currentWp = vessel.waypoints[wpIdx] || vessel.waypoints[0];

          return (
            <div key={vessel.id}>
              {/* Route Trail */}
              <Polyline
                positions={vessel.waypoints.map(w => [w.lat, w.lng])}
                pathOptions={{
                  color: isSelected ? '#1d4ed8' : isSuspect ? '#dc2626' : vessel.routeColor,
                  weight: isSelected ? 3.5 : 2,
                  opacity: isSelected ? 0.95 : 0.6,
                  dashArray: isSuspect ? '4,4' : undefined,
                }}
                eventHandlers={{ click: () => onSelectVessel(vessel.id) }}
              />

              {/* Animated Ship Marker */}
              <Marker
                position={[currentWp.lat, currentWp.lng]}
                icon={vesselMapIcon(vessel, isSelected, isSuspect, currentWp.cogDeg, currentWp.sogKnots)}
                eventHandlers={{ click: () => onSelectVessel(vessel.id) }}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <div style={{ textAlign: 'center' }}>
                    <strong>{vessel.name}</strong>
                    <br />
                    <span className="data">{currentWp.sogKnots} kn · {vessel.vesselType}</span>
                    {currentWp.speedAnomaly && (
                      <div style={{ color: '#dc2626', fontWeight: 700, fontSize: 10 }}>⚠️ SPEED DROP: {currentWp.sogKnots} kn</div>
                    )}
                  </div>
                </Tooltip>
                <Popup>
                  <div style={{ fontSize: 12 }}>
                    <strong>{vessel.name}</strong> ({vessel.flag})
                    <br />
                    Type: <strong>{vessel.vesselType}</strong>
                    <br />
                    Speed Over Ground: <strong style={{ color: currentWp.speedAnomaly ? '#dc2626' : '#1d4ed8' }}>{currentWp.sogKnots} knots</strong>
                    <br />
                    Destination: {vessel.destination}
                    <br />
                    <span className="data">MMSI: {vessel.mmsi} · IMO: {vessel.imo}</span>
                  </div>
                </Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
