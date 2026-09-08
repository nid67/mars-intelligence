import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Zap,
  Wind,
  Compass,
  ChevronRight,
  Radio,
  Menu,
} from 'lucide-react';
import {
  SIMULATED_SHIPS,
  INDIAN_SCENARIOS,
  type IndianSimulatedVessel,
  type IndianSpillScenario,
} from '../../data/indianMaritimeData';
import { IndiaMaritimeMapSimulation } from '../gis/IndiaMaritimeMapSimulation';
import { ShipSpeedTimelineGraph } from '../common/ShipSpeedTimelineGraph';

interface Props {
  onSelectIncident: (incidentId: string) => void;
  onToggleMenu?: () => void;
}

export function RegionalMonitoringScreen({ onSelectIncident, onToggleMenu }: Props) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [scenarioId, setScenarioId] = useState<string>('mumbai-high');
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>('vessel-indus-star');
  const [vesselWaypointIndices, setVesselWaypointIndices] = useState<Record<string, number>>({
    'vessel-indus-star': 3, // Initialized at speed-drop anomaly point
    'vessel-samudra-ratna': 3,
    'vessel-arabian-carrier': 2,
    'vessel-bay-navigator': 2,
    'vessel-chennai-express': 2,
    'vessel-gujarat-pride': 3,
    'vessel-al-zubarah': 3,
    'vessel-vishva-doot': 2,
  });

  // Forensic visualization layer toggles
  const [showEnvironmental, setShowEnvironmental] = useState(true);
  const [showBackwardTrace, setShowBackwardTrace] = useState(true);
  const [showForwardForecast, setShowForwardForecast] = useState(true);
  const [forecastHours, setForecastHours] = useState<6 | 12 | 24>(6);

  // Inspector panel tabs: 'spill' | 'ship' | 'origin'
  const [inspectorTab, setInspectorTab] = useState<'spill' | 'ship' | 'origin'>('spill');

  const activeScenario: IndianSpillScenario | null = INDIAN_SCENARIOS[scenarioId] || INDIAN_SCENARIOS['mumbai-high'];
  const selectedVessel: IndianSimulatedVessel | undefined = SIMULATED_SHIPS.find(s => s.id === selectedVesselId) || SIMULATED_SHIPS[0];

  // Simulation timer tick: moves ships along waypoints
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.max(800, 2400 / playbackSpeed);

    const timer = setInterval(() => {
      setVesselWaypointIndices(prev => {
        const next = { ...prev };
        SIMULATED_SHIPS.forEach(ship => {
          const currentIdx = prev[ship.id] !== undefined ? prev[ship.id] : 0;
          const maxIdx = ship.waypoints.length - 1;
          next[ship.id] = currentIdx >= maxIdx ? 0 : currentIdx + 1;
        });
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  // Handle triggering a new random spill event
  const handleTriggerRandomSpill = () => {
    const keys = Object.keys(INDIAN_SCENARIOS);
    const otherKeys = keys.filter(k => k !== scenarioId);
    const nextKey = otherKeys.length > 0 ? otherKeys[Math.floor(Math.random() * otherKeys.length)] : keys[0];
    setScenarioId(nextKey);
    const scenario = INDIAN_SCENARIOS[nextKey];
    setSelectedVesselId(scenario.suspectVesselId);
    setInspectorTab('spill');
  };

  // Check how many vessels were in or near the probable origin zone
  const originVessels = SIMULATED_SHIPS.filter(v => {
    return (
      v.id === activeScenario?.suspectVesselId ||
      v.id === 'vessel-arabian-carrier' ||
      v.id === 'vessel-bay-navigator'
    );
  });

  const suspectVessel = SIMULATED_SHIPS.find(v => v.id === activeScenario?.suspectVesselId);
  const currentWaypointIdx = vesselWaypointIndices[selectedVessel.id] || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#f8fafc' }}>
      {/* ── TOP CONTROL BAR ── */}
      <div
        style={{
          padding: '10px 18px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}
      >
        {/* Left: Menu Trigger + Platform Title & Region Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onToggleMenu && (
            <button
              onClick={onToggleMenu}
              aria-label="Toggle Features Menu"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                padding: '6px 11px',
                color: '#0f172a',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#e2e8f0';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc';
              }}
            >
              <Menu size={16} />
              <span>Features</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', letterSpacing: -0.2 }}>
              Maritime Surveillance & Spill Reconstruction
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                padding: '3px 9px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <Radio size={12} />
              <span>Arabian Sea & Bay of Bengal</span>
            </span>
          </div>

          <span style={{ color: '#cbd5e1' }}>|</span>

          {/* Active Scenario Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Active Incident:</span>
            <select
              value={scenarioId}
              onChange={e => {
                setScenarioId(e.target.value);
                const s = INDIAN_SCENARIOS[e.target.value];
                if (s) setSelectedVesselId(s.suspectVesselId);
              }}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                color: '#0f172a',
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-ui)',
                outline: 'none',
              }}
            >
              <option value="mumbai-high">Mumbai High Offshore (Arabian Sea — 8.7 km²)</option>
              <option value="chennai-ennore">Kamarajar / Ennore Coast (Bay of Bengal — 12.4 km²)</option>
            </select>
          </div>
        </div>

        {/* Right: Simulation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              background: isPlaying ? '#eff6ff' : '#ffffff',
              border: `1px solid ${isPlaying ? '#93c5fd' : '#cbd5e1'}`,
              borderRadius: 6,
              color: isPlaying ? '#1d4ed8' : '#0f172a',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isPlaying ? <Pause size={13} fill="#1d4ed8" /> : <Play size={13} fill="#0f172a" />}
            <span>{isPlaying ? 'Pause Simulation' : 'Resume Simulation'}</span>
          </button>

          {/* Playback Speed Multiplier */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: 2, borderRadius: 6, border: '1px solid #e2e8f0' }}>
            {[1, 2, 5].map(s => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                style={{
                  padding: '3px 9px',
                  fontSize: 11,
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  background: playbackSpeed === s ? '#ffffff' : 'transparent',
                  color: playbackSpeed === s ? '#1d4ed8' : '#64748b',
                  boxShadow: playbackSpeed === s ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Trigger Spill Anomaly Action */}
          <button
            onClick={handleTriggerRandomSpill}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              background: '#dc2626',
              border: 'none',
              borderRadius: 6,
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(220,38,38,0.25)',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#b91c1c';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#dc2626';
            }}
          >
            <Zap size={13} />
            <span>Trigger Slick Anomaly</span>
          </button>
        </div>
      </div>

      {/* ── MAIN WORKSPACE AREA: MAP + FLOATING INSPECTION DRAWERS ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Full-bleed Indian Maritime Map Simulation */}
        <IndiaMaritimeMapSimulation
          ships={SIMULATED_SHIPS}
          activeScenario={activeScenario}
          selectedVesselId={selectedVesselId}
          onSelectVessel={id => {
            setSelectedVesselId(id);
            setInspectorTab('ship');
          }}
          onSelectSpill={id => {
            setScenarioId(id);
            setInspectorTab('spill');
          }}
          showEnvironmentalVectors={showEnvironmental}
          showBackwardTrace={showBackwardTrace}
          showForwardForecast={showForwardForecast}
          selectedForecastHours={forecastHours}
          vesselWaypointIndices={vesselWaypointIndices}
        />

        {/* ── LEFT DRAWER: INDIAN MARITIME ZONES & SHIP RADAR ── */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: 14,
            zIndex: 1000,
            width: 300,
            maxHeight: 'calc(100% - 28px)',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                Indian Shipping Radar
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', background: '#f0fdf4', padding: '2px 8px', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                {SIMULATED_SHIPS.length} Live Tracks
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
              Select any vessel to inspect speed profile & trajectory
            </div>
          </div>

          {/* Ships List */}
          <div style={{ padding: '10px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SIMULATED_SHIPS.map(v => {
              const isSelected = v.id === selectedVesselId;
              const isSuspect = v.id === activeScenario?.suspectVesselId;
              const wpIdx = vesselWaypointIndices[v.id] || 0;
              const currentWp = v.waypoints[wpIdx] || v.waypoints[0];
              const isSpeedDrop = currentWp.speedAnomaly || currentWp.sogKnots < 4;

              return (
                <div
                  key={v.id}
                  onClick={() => {
                    setSelectedVesselId(v.id);
                    setInspectorTab('ship');
                  }}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 6,
                    background: isSelected ? '#eff6ff' : isSuspect ? '#fef2f2' : '#ffffff',
                    border: `1px solid ${isSelected ? '#93c5fd' : isSuspect ? '#fecaca' : '#e2e8f0'}`,
                    borderLeft: `3px solid ${isSuspect ? '#dc2626' : isSelected ? '#2563eb' : v.routeColor}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                      {v.name}
                    </span>
                    <span
                      className="data"
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: isSpeedDrop ? '#dc2626' : '#0f172a',
                      }}
                    >
                      {currentWp.sogKnots} kn
                    </span>
                  </div>

                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{v.vesselType}</span>
                    <span>{v.destination.split(',')[0]}</span>
                  </div>

                  {isSpeedDrop && (
                    <div style={{ fontSize: 10, color: '#dc2626', fontWeight: 600, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>⚠️ Sudden speed reduction ({currentWp.sogKnots} kn)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT FORENSIC INVESTIGATION DRAWER ── */}
        <div
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 1000,
            width: 410,
            maxHeight: 'calc(100% - 28px)',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header Tabs */}
          <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                  Forensic Investigation & Attribution
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                  Lagrangian drift & AIS speed anomaly audit
                </div>
              </div>
              <button
                onClick={() => {
                  const caseId = activeScenario?.id === 'chennai-ennore' ? 'case-ennore-optional-004' : 'case-arabian-sea-001';
                  onSelectIncident(caseId);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '5px 10px',
                  background: '#1d4ed8',
                  border: 'none',
                  borderRadius: 6,
                  color: '#ffffff',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(29,78,216,0.2)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#1e40af';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8';
                }}
              >
                <span>Full Case Dossier</span>
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Tab buttons */}
            <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 6 }}>
              {[
                { id: 'spill', label: '1. Slick & Drift' },
                { id: 'origin', label: '2. Origin Census' },
                { id: 'ship', label: '3. Speed Scrubber' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setInspectorTab(t.id as any)}
                  style={{
                    flex: 1,
                    padding: '6px 4px',
                    fontSize: 11,
                    fontWeight: 600,
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    background: inspectorTab === t.id ? '#ffffff' : 'transparent',
                    color: inspectorTab === t.id ? '#1d4ed8' : '#64748b',
                    boxShadow: inspectorTab === t.id ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div style={{ padding: '14px 16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* ── TAB 1: SLICK & ENVIRONMENTAL CURRENTS ── */}
            {inspectorTab === 'spill' && activeScenario && (
              <>
                <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>
                      {activeScenario.caseCode}: Detected Oil Slick
                    </span>
                    <span className="data" style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
                      {activeScenario.slickAreaKm2} km²
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
                    Observed in <strong>{activeScenario.seaArea}</strong> ({activeScenario.regionName}).
                  </div>
                </div>

                {/* Environmental Conditions at Slick Location */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Environmental Vectors
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, cursor: 'pointer', color: '#1d4ed8', fontWeight: 500 }}>
                      <input
                        type="checkbox"
                        checked={showEnvironmental}
                        onChange={e => setShowEnvironmental(e.target.checked)}
                      />
                      <span>Show Vector Arrows</span>
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ background: '#eff6ff', padding: '10px 12px', borderRadius: 6, border: '1px solid #bfdbfe' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#1d4ed8', fontSize: 11, fontWeight: 600 }}>
                        <Wind size={14} />
                        <span>Atmospheric Wind</span>
                      </div>
                      <div className="data" style={{ fontSize: 13, fontWeight: 700, color: '#1e3a8a', marginTop: 4 }}>
                        {activeScenario.environmental.windSpeedKnots} kn @ {activeScenario.environmental.windDirectionDeg}°
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{activeScenario.environmental.windSource}</div>
                    </div>

                    <div style={{ background: '#f0fdfa', padding: '10px 12px', borderRadius: 6, border: '1px solid #99f6e4' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#0f766e', fontSize: 11, fontWeight: 600 }}>
                        <Compass size={14} />
                        <span>Surface Current</span>
                      </div>
                      <div className="data" style={{ fontSize: 13, fontWeight: 700, color: '#115e59', marginTop: 4 }}>
                        {activeScenario.environmental.currentSpeedKnots} kn @ {activeScenario.environmental.currentDirectionDeg}°
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{activeScenario.environmental.currentSource}</div>
                    </div>
                  </div>
                </div>

                {/* Forward Dispersion Forecast Selector */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Forward Spill Trajectory
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, cursor: 'pointer', color: '#1d4ed8', fontWeight: 500 }}>
                      <input
                        type="checkbox"
                        checked={showForwardForecast}
                        onChange={e => setShowForwardForecast(e.target.checked)}
                      />
                      <span>Show Spread Bounds</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {([6, 12, 24] as const).map(h => (
                      <button
                        key={h}
                        onClick={() => setForecastHours(h)}
                        style={{
                          flex: 1,
                          padding: '7px 4px',
                          border: `1px solid ${forecastHours === h ? '#93c5fd' : '#cbd5e1'}`,
                          borderRadius: 6,
                          background: forecastHours === h ? '#eff6ff' : '#ffffff',
                          color: forecastHours === h ? '#1d4ed8' : '#475569',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        +{h}h ({activeScenario.forwardForecast[`h${h}`].areaKm2} km²)
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action button to proceed to step 2 */}
                <button
                  onClick={() => setInspectorTab('origin')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '9px 14px',
                    background: '#1d4ed8',
                    border: 'none',
                    borderRadius: 6,
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: 4,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#1e40af';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8';
                  }}
                >
                  <span>Trace Origin Point & Inspect Census Ships →</span>
                </button>
              </>
            )}

            {/* ── TAB 2: PROBABLE ORIGIN & SHIP CENSUS ── */}
            {inspectorTab === 'origin' && activeScenario && (
              <>
                <div style={{ background: '#fffbeb', padding: '12px 14px', borderRadius: 6, border: '1px solid #fde68a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309' }}>
                      Reconstructed Origin Zone & Release Window
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, cursor: 'pointer', color: '#b45309', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={showBackwardTrace}
                        onChange={e => setShowBackwardTrace(e.target.checked)}
                      />
                      <span>Show Particles</span>
                    </label>
                  </div>
                  <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.4 }}>
                    Origin Centroid: <strong className="data">{activeScenario.originCentroid.lat.toFixed(4)}°N, {activeScenario.originCentroid.lng.toFixed(4)}°E</strong>
                    <br />
                    Estimated Window: <strong>{activeScenario.releaseWindow.start} – {activeScenario.releaseWindow.end}</strong>
                  </div>
                </div>

                {/* Origin Point Vessel Census */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Vessels Present at Origin ({originVessels.length})
                    </span>
                    <span style={{ fontSize: 10, color: '#b45309', fontWeight: 600, background: '#fffbeb', border: '1px solid #fef08a', padding: '1px 6px', borderRadius: 4 }}>
                      Spatiotemporal Overlap
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {originVessels.map(v => {
                      const isSuspect = v.id === activeScenario.suspectVesselId;
                      return (
                        <div
                          key={v.id}
                          onClick={() => {
                            setSelectedVesselId(v.id);
                            setInspectorTab('ship');
                          }}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 6,
                            background: isSuspect ? '#fef2f2' : '#ffffff',
                            border: `1px solid ${isSuspect ? '#fecaca' : '#e2e8f0'}`,
                            borderLeft: `3px solid ${isSuspect ? '#dc2626' : '#2563eb'}`,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
                              {v.name}
                            </span>
                            {isSuspect ? (
                              <span style={{ fontSize: 10, fontWeight: 600, color: '#dc2626', background: '#fee2e2', border: '1px solid #fca5a5', padding: '2px 6px', borderRadius: 4 }}>
                                Primary Suspect (84/100)
                              </span>
                            ) : (
                              <span style={{ fontSize: 10, color: '#64748b' }}>Score 38/100</span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                            {v.vesselType} · {v.flag}
                          </div>
                          {isSuspect && (
                            <div style={{ fontSize: 11, color: '#991b1b', marginTop: 4, fontWeight: 500 }}>
                              👉 Reduced speed to 2.1 kn directly inside origin zone at {activeScenario.releaseWindow.peak}.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (suspectVessel) setSelectedVesselId(suspectVessel.id);
                    setInspectorTab('ship');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '9px 14px',
                    background: '#dc2626',
                    border: 'none',
                    borderRadius: 6,
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#b91c1c';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#dc2626';
                  }}
                >
                  <span>Scrub Suspect Speed Profile Timeline →</span>
                </button>
              </>
            )}

            {/* ── TAB 3: SHIP SPEED TIMELINE & TRAJECTORY SCRUBBER ── */}
            {inspectorTab === 'ship' && selectedVessel && (
              <>
                <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                        {selectedVessel.name}
                      </h4>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {selectedVessel.vesselType} · {selectedVessel.flag}
                      </div>
                    </div>
                    {selectedVessel.id === activeScenario?.suspectVesselId && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', padding: '3px 8px', borderRadius: 4 }}>
                        Attribution Score: 84/100
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, lineHeight: 1.5 }}>
                    Destination: <strong style={{ color: '#0f172a' }}>{selectedVessel.destination}</strong>
                    <br />
                    MMSI: <span className="data">{selectedVessel.mmsi}</span> · IMO: <span className="data">{selectedVessel.imo}</span>
                  </div>
                </div>

                {/* Interactive Speed Profile Timeline Graph */}
                <ShipSpeedTimelineGraph
                  vessel={selectedVessel}
                  currentWaypointIndex={currentWaypointIdx}
                  onSelectWaypointIndex={idx => {
                    setVesselWaypointIndices(prev => ({
                      ...prev,
                      [selectedVessel.id]: idx,
                    }));
                  }}
                />

                {/* Forensic Speed Drop Diagnostic */}
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, color: '#334155', lineHeight: 1.5 }}>
                  <strong style={{ color: '#0f172a' }}>Speed Profile Diagnostic:</strong>
                  {selectedVessel.id === activeScenario?.suspectVesselId ? (
                    <div style={{ color: '#991b1b', marginTop: 4 }}>
                      ⚠️ Speed dropped drastically from <strong>13.8 kn to 2.1 kn</strong> between 04:45 UTC and 05:30 UTC while passing within 0.3 km of the reconstructed origin centroid.
                    </div>
                  ) : (
                    <div style={{ color: '#166534', marginTop: 4 }}>
                      ✓ Steady speed profile (11.6–13.5 kn) maintained throughout corridor. No anomalous engine halts detected.
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    const caseId = activeScenario?.id === 'chennai-ennore' ? 'case-ennore-optional-004' : 'case-arabian-sea-001';
                    onSelectIncident(caseId);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 14px',
                    background: '#1d4ed8',
                    border: 'none',
                    borderRadius: 6,
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(29,78,216,0.25)',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#1e40af';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8';
                  }}
                >
                  <span>Open Full Attribution & Legal Evidence Dossier →</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
