import type { Coordinates } from '../types/investigation';

export interface IndianMaritimePort {
  id: string;
  name: string;
  state: string;
  coordinates: Coordinates;
  type: 'Major Port' | 'Oil Terminal' | 'Container Hub';
}

export interface ShipWaypoint extends Coordinates {
  timestamp: string; // ISO / UTC
  sogKnots: number;
  cogDeg: number;
  navStatus: string;
  speedAnomaly?: boolean;
  notes?: string;
}

export interface IndianSimulatedVessel {
  id: string;
  name: string;
  mmsi: number;
  imo: number;
  callsign: string;
  flag: string;
  vesselType: 'Crude Oil Tanker' | 'Product Tanker' | 'Bulk Carrier' | 'Container Ship' | 'LPG Tanker' | 'Offshore Supply';
  lengthMeters: number;
  beamMeters: number;
  draftMeters: number;
  destination: string;
  originPort: string;
  routeColor: string;
  waypoints: ShipWaypoint[];
  currentSpeedIndex: number; // For live animation playback
}

export interface IndianSpillScenario {
  id: string;
  caseCode: string;
  title: string;
  regionName: string;
  seaArea: string;
  incidentTime: string;
  detectionTime: string;
  slickPolygon: Coordinates[];
  slickCentroid: Coordinates;
  slickAreaKm2: number;
  suspectVesselId: string;
  releaseWindow: {
    start: string;
    end: string;
    peak: string;
  };
  originRegion: Coordinates[];
  originCentroid: Coordinates;
  environmental: {
    windSpeedKnots: number;
    windDirectionDeg: number;
    windSource: string;
    currentSpeedKnots: number;
    currentDirectionDeg: number;
    currentSource: string;
    seaSurfaceTempC: number;
    waveHeightMeters: number;
  };
  backwardParticles: {
    lat: number;
    lng: number;
    probability: number;
    releaseTime: string;
  }[];
  forwardForecast: {
    h6: { lat: number; lng: number; areaKm2: number; polygon: Coordinates[]; risk: 'LOW' | 'MODERATE' | 'HIGH' };
    h12: { lat: number; lng: number; areaKm2: number; polygon: Coordinates[]; risk: 'LOW' | 'MODERATE' | 'HIGH' };
    h24: { lat: number; lng: number; areaKm2: number; polygon: Coordinates[]; risk: 'LOW' | 'MODERATE' | 'HIGH' };
  };
}

// ── INDIAN MAJOR PORTS ──
export const INDIAN_PORTS: IndianMaritimePort[] = [
  { id: 'mumbai', name: 'Mumbai / JNPT Port', state: 'Maharashtra', coordinates: { lat: 18.950, lng: 72.850 }, type: 'Major Port' },
  { id: 'kandla', name: 'Deendayal (Kandla) Oil Terminal', state: 'Gujarat', coordinates: { lat: 23.000, lng: 70.220 }, type: 'Oil Terminal' },
  { id: 'mormugao', name: 'Mormugao Port', state: 'Goa', coordinates: { lat: 15.415, lng: 73.800 }, type: 'Major Port' },
  { id: 'kochi', name: 'Cochin Port & Oil Refineries', state: 'Kerala', coordinates: { lat: 9.965, lng: 76.265 }, type: 'Major Port' },
  { id: 'chennai', name: 'Chennai Port', state: 'Tamil Nadu', coordinates: { lat: 13.085, lng: 80.295 }, type: 'Major Port' },
  { id: 'ennore', name: 'Kamarajar (Ennore) Port', state: 'Tamil Nadu', coordinates: { lat: 13.275, lng: 80.340 }, type: 'Oil Terminal' },
  { id: 'visakhapatnam', name: 'Visakhapatnam Port', state: 'Andhra Pradesh', coordinates: { lat: 17.685, lng: 83.295 }, type: 'Major Port' },
  { id: 'paradip', name: 'Paradip Crude Oil Terminal', state: 'Odisha', coordinates: { lat: 20.260, lng: 86.680 }, type: 'Oil Terminal' },
  { id: 'haldia', name: 'Haldia Dock Complex', state: 'West Bengal', coordinates: { lat: 22.020, lng: 88.060 }, type: 'Major Port' },
  { id: 'port-blair', name: 'Port Blair Harbour', state: 'Andaman & Nicobar', coordinates: { lat: 11.670, lng: 92.740 }, type: 'Major Port' },
];

// ── INDIAN-CENTRIC SIMULATED SHIPS ACROSS ARABIAN SEA & BAY OF BENGAL ──
export const SIMULATED_SHIPS: IndianSimulatedVessel[] = [
  {
    id: 'vessel-indus-star',
    name: 'MT Indus Star',
    mmsi: 419001284,
    imo: 9384912,
    callsign: 'AUIS',
    flag: 'India (IN)',
    vesselType: 'Crude Oil Tanker',
    lengthMeters: 244.0,
    beamMeters: 42.0,
    draftMeters: 14.8,
    destination: 'Mumbai High Oil Terminal',
    originPort: 'Sikka Refinery, Gujarat',
    routeColor: '#ef4444',
    currentSpeedIndex: 3,
    waypoints: [
      { lat: 19.4500, lng: 71.3500, timestamp: '2026-09-08T01:00:00Z', sogKnots: 14.6, cogDeg: 142.0, navStatus: 'Underway' },
      { lat: 19.1200, lng: 71.6500, timestamp: '2026-09-08T02:30:00Z', sogKnots: 14.2, cogDeg: 140.0, navStatus: 'Underway' },
      { lat: 18.8800, lng: 71.8800, timestamp: '2026-09-08T03:45:00Z', sogKnots: 13.8, cogDeg: 138.0, navStatus: 'Underway' },
      // SPEED DROP ANOMALY IN ORIGIN ZONE
      { lat: 18.7980, lng: 71.9760, timestamp: '2026-09-08T04:45:00Z', sogKnots: 2.1, cogDeg: 85.0, navStatus: 'Not Under Command', speedAnomaly: true, notes: 'Drastic speed drop to 2.1 kn (Suspicious bilge/tank discharge window)' },
      { lat: 18.8100, lng: 71.9950, timestamp: '2026-09-08T05:30:00Z', sogKnots: 3.4, cogDeg: 110.0, navStatus: 'Restricted Maneuverability', speedAnomaly: true, notes: 'Low speed drifting in origin area' },
      { lat: 18.8650, lng: 72.0480, timestamp: '2026-09-08T06:30:00Z', sogKnots: 11.2, cogDeg: 135.0, navStatus: 'Underway' },
      { lat: 18.9480, lng: 72.1380, timestamp: '2026-09-08T08:00:00Z', sogKnots: 13.9, cogDeg: 136.0, navStatus: 'Underway' },
      { lat: 19.0420, lng: 72.2420, timestamp: '2026-09-08T10:30:00Z', sogKnots: 13.7, cogDeg: 135.0, navStatus: 'Underway' },
      { lat: 19.1800, lng: 72.4800, timestamp: '2026-09-08T14:32:00Z', sogKnots: 12.0, cogDeg: 120.0, navStatus: 'Underway' },
    ],
  },
  {
    id: 'vessel-samudra-ratna',
    name: 'MT Samudra Ratna',
    mmsi: 419002550,
    imo: 9456781,
    callsign: 'AUSR',
    flag: 'India (IN)',
    vesselType: 'Product Tanker',
    lengthMeters: 183.0,
    beamMeters: 32.2,
    draftMeters: 11.2,
    destination: 'Kochi Port (CPCL)',
    originPort: 'Mundra, Gujarat',
    routeColor: '#2563eb',
    currentSpeedIndex: 4,
    waypoints: [
      { lat: 21.2000, lng: 69.4000, timestamp: '2026-09-08T00:00:00Z', sogKnots: 13.5, cogDeg: 155.0, navStatus: 'Underway' },
      { lat: 19.8000, lng: 70.4000, timestamp: '2026-09-08T03:00:00Z', sogKnots: 13.6, cogDeg: 154.0, navStatus: 'Underway' },
      { lat: 18.5000, lng: 71.3500, timestamp: '2026-09-08T06:00:00Z', sogKnots: 13.4, cogDeg: 155.0, navStatus: 'Underway' },
      { lat: 17.2000, lng: 72.1000, timestamp: '2026-09-08T09:00:00Z', sogKnots: 13.5, cogDeg: 156.0, navStatus: 'Underway' },
      { lat: 15.6000, lng: 73.1000, timestamp: '2026-09-08T12:00:00Z', sogKnots: 13.2, cogDeg: 155.0, navStatus: 'Underway' },
      { lat: 13.8000, lng: 74.2000, timestamp: '2026-09-08T14:32:00Z', sogKnots: 13.4, cogDeg: 154.0, navStatus: 'Underway' },
    ],
  },
  {
    id: 'vessel-arabian-carrier',
    name: 'MV Arabian Carrier',
    mmsi: 419003892,
    imo: 9412089,
    callsign: 'AWBC',
    flag: 'Panama (PA)',
    vesselType: 'Bulk Carrier',
    lengthMeters: 189.0,
    beamMeters: 30.5,
    draftMeters: 10.2,
    destination: 'JNPT Mumbai',
    originPort: 'Salalah, Oman',
    routeColor: '#059669',
    currentSpeedIndex: 3,
    waypoints: [
      { lat: 18.2000, lng: 70.5000, timestamp: '2026-09-08T01:30:00Z', sogKnots: 11.8, cogDeg: 68.0, navStatus: 'Underway' },
      { lat: 18.4500, lng: 71.2000, timestamp: '2026-09-08T03:30:00Z', sogKnots: 11.7, cogDeg: 66.0, navStatus: 'Underway' },
      { lat: 18.7200, lng: 71.9750, timestamp: '2026-09-08T05:00:00Z', sogKnots: 11.6, cogDeg: 65.0, navStatus: 'Underway' },
      { lat: 18.8250, lng: 72.0350, timestamp: '2026-09-08T06:45:00Z', sogKnots: 11.9, cogDeg: 66.0, navStatus: 'Underway' },
      { lat: 18.9450, lng: 72.5500, timestamp: '2026-09-08T10:00:00Z', sogKnots: 11.8, cogDeg: 64.0, navStatus: 'Underway' },
      { lat: 18.9500, lng: 72.8200, timestamp: '2026-09-08T14:32:00Z', sogKnots: 4.5, cogDeg: 70.0, navStatus: 'At Anchor' },
    ],
  },
  {
    id: 'vessel-bay-navigator',
    name: 'MV Bay Navigator',
    mmsi: 419002930,
    imo: 9320145,
    callsign: 'AUBN',
    flag: 'India (IN)',
    vesselType: 'Product Tanker',
    lengthMeters: 182.0,
    beamMeters: 29.0,
    draftMeters: 10.5,
    destination: 'Haldia Dock, West Bengal',
    originPort: 'Chennai Port',
    routeColor: '#d97706',
    currentSpeedIndex: 3,
    waypoints: [
      { lat: 14.5000, lng: 81.2000, timestamp: '2026-09-08T00:00:00Z', sogKnots: 12.8, cogDeg: 38.0, navStatus: 'Underway' },
      { lat: 16.8000, lng: 83.4000, timestamp: '2026-09-08T04:00:00Z', sogKnots: 12.6, cogDeg: 36.0, navStatus: 'Underway' },
      { lat: 18.5000, lng: 85.2000, timestamp: '2026-09-08T08:00:00Z', sogKnots: 12.7, cogDeg: 35.0, navStatus: 'Underway' },
      { lat: 19.7540, lng: 86.8090, timestamp: '2026-09-08T11:30:00Z', sogKnots: 12.5, cogDeg: 36.0, navStatus: 'Underway' },
      { lat: 20.8000, lng: 87.8000, timestamp: '2026-09-08T14:32:00Z', sogKnots: 12.4, cogDeg: 34.0, navStatus: 'Underway' },
    ],
  },
  {
    id: 'vessel-chennai-express',
    name: 'MV Chennai Express',
    mmsi: 419004112,
    imo: 9556100,
    callsign: 'AUCE',
    flag: 'India (IN)',
    vesselType: 'Container Ship',
    lengthMeters: 294.0,
    beamMeters: 38.0,
    draftMeters: 12.8,
    destination: 'Singapore Port',
    originPort: 'Chennai Container Terminal',
    routeColor: '#7c3aed',
    currentSpeedIndex: 2,
    waypoints: [
      { lat: 13.1500, lng: 80.4500, timestamp: '2026-09-08T02:00:00Z', sogKnots: 16.5, cogDeg: 120.0, navStatus: 'Underway' },
      { lat: 12.2000, lng: 82.5000, timestamp: '2026-09-08T05:30:00Z', sogKnots: 16.8, cogDeg: 122.0, navStatus: 'Underway' },
      { lat: 10.8000, lng: 85.5000, timestamp: '2026-09-08T09:30:00Z', sogKnots: 16.4, cogDeg: 121.0, navStatus: 'Underway' },
      { lat: 9.4000, lng: 88.8000, timestamp: '2026-09-08T14:32:00Z', sogKnots: 16.7, cogDeg: 120.0, navStatus: 'Underway' },
    ],
  },
  {
    id: 'vessel-gujarat-pride',
    name: 'MT Gujarat Pride',
    mmsi: 419006780,
    imo: 9678120,
    callsign: 'AUGP',
    flag: 'India (IN)',
    vesselType: 'Crude Oil Tanker',
    lengthMeters: 274.0,
    beamMeters: 48.0,
    draftMeters: 16.0,
    destination: 'Vadinar IOCL Terminal, Gulf of Kutch',
    originPort: 'Basrah, Iraq',
    routeColor: '#0891b2',
    currentSpeedIndex: 3,
    waypoints: [
      { lat: 21.8000, lng: 67.5000, timestamp: '2026-09-08T01:00:00Z', sogKnots: 13.8, cogDeg: 55.0, navStatus: 'Underway' },
      { lat: 22.2000, lng: 68.3000, timestamp: '2026-09-08T04:00:00Z', sogKnots: 13.7, cogDeg: 56.0, navStatus: 'Underway' },
      { lat: 22.4500, lng: 69.1000, timestamp: '2026-09-08T07:30:00Z', sogKnots: 13.5, cogDeg: 58.0, navStatus: 'Underway' },
      { lat: 22.6500, lng: 69.8000, timestamp: '2026-09-08T11:00:00Z', sogKnots: 11.2, cogDeg: 62.0, navStatus: 'Underway' },
      { lat: 22.5800, lng: 70.0500, timestamp: '2026-09-08T14:32:00Z', sogKnots: 3.2, cogDeg: 65.0, navStatus: 'Approaching Anchorage' },
    ],
  },
  {
    id: 'vessel-al-zubarah',
    name: 'MT Al-Zubarah',
    mmsi: 470129000,
    imo: 9128320,
    callsign: 'A6EZ',
    flag: 'UAE (AE)',
    vesselType: 'LPG Tanker',
    lengthMeters: 228.0,
    beamMeters: 36.0,
    draftMeters: 11.5,
    destination: 'Ennore LNG Terminal',
    originPort: 'Ras Laffan, Qatar',
    routeColor: '#9333ea',
    currentSpeedIndex: 3,
    waypoints: [
      { lat: 8.5000, lng: 76.5000, timestamp: '2026-09-08T00:00:00Z', sogKnots: 15.2, cogDeg: 88.0, navStatus: 'Underway' },
      { lat: 8.4000, lng: 78.5000, timestamp: '2026-09-08T04:00:00Z', sogKnots: 15.0, cogDeg: 85.0, navStatus: 'Underway' },
      { lat: 8.6000, lng: 80.5000, timestamp: '2026-09-08T08:00:00Z', sogKnots: 14.8, cogDeg: 55.0, navStatus: 'Underway' },
      { lat: 10.5000, lng: 81.6000, timestamp: '2026-09-08T12:00:00Z', sogKnots: 15.1, cogDeg: 35.0, navStatus: 'Underway' },
      { lat: 12.2000, lng: 81.9000, timestamp: '2026-09-08T14:32:00Z', sogKnots: 14.9, cogDeg: 35.0, navStatus: 'Underway' },
    ],
  },
  {
    id: 'vessel-vishva-doot',
    name: 'MV Vishva Doot',
    mmsi: 419001920,
    imo: 9345123,
    callsign: 'AUVD',
    flag: 'India (IN)',
    vesselType: 'Bulk Carrier',
    lengthMeters: 190.0,
    beamMeters: 32.0,
    draftMeters: 11.8,
    destination: 'Visakhapatnam Steel Jetty',
    originPort: 'Port Hedland, Australia',
    routeColor: '#ea580c',
    currentSpeedIndex: 3,
    waypoints: [
      { lat: 11.0000, lng: 86.5000, timestamp: '2026-09-08T01:00:00Z', sogKnots: 12.2, cogDeg: 325.0, navStatus: 'Underway' },
      { lat: 13.2000, lng: 85.2000, timestamp: '2026-09-08T05:30:00Z', sogKnots: 12.0, cogDeg: 326.0, navStatus: 'Underway' },
      { lat: 15.4000, lng: 84.1000, timestamp: '2026-09-08T10:00:00Z', sogKnots: 12.1, cogDeg: 328.0, navStatus: 'Underway' },
      { lat: 17.2000, lng: 83.6000, timestamp: '2026-09-08T14:32:00Z', sogKnots: 11.8, cogDeg: 325.0, navStatus: 'Underway' },
    ],
  },
];

// ── INDIAN SCENARIOS ──
export const INDIAN_SCENARIOS: Record<string, IndianSpillScenario> = {
  'mumbai-high': {
    id: 'mumbai-high',
    caseCode: 'SLICK-2026-0042',
    title: 'Arabian Sea — Mumbai High Offshore Oil Spill Incident',
    regionName: 'Mumbai Offshore Basin',
    seaArea: 'Arabian Sea (West Coast EEZ)',
    incidentTime: '08 Sep 2026 04:45 UTC',
    detectionTime: '08 Sep 2026 14:32 UTC (Sentinel-1A SAR Pass)',
    slickCentroid: { lat: 18.9215, lng: 72.1480 },
    slickAreaKm2: 8.72,
    suspectVesselId: 'vessel-indus-star',
    releaseWindow: {
      start: '08 Sep 2026 03:30 UTC',
      end: '08 Sep 2026 07:15 UTC',
      peak: '08 Sep 2026 04:45 UTC',
    },
    slickPolygon: [
      { lat: 18.9450, lng: 72.1280 },
      { lat: 18.9380, lng: 72.1520 },
      { lat: 18.9150, lng: 72.1680 },
      { lat: 18.8980, lng: 72.1550 },
      { lat: 18.9050, lng: 72.1320 },
      { lat: 18.9280, lng: 72.1210 },
      { lat: 18.9450, lng: 72.1280 },
    ],
    originCentroid: { lat: 18.7980, lng: 71.9760 },
    originRegion: [
      { lat: 18.8120, lng: 71.9450 },
      { lat: 18.8350, lng: 71.9920 },
      { lat: 18.7950, lng: 72.0310 },
      { lat: 18.7620, lng: 71.9780 },
      { lat: 18.7850, lng: 71.9320 },
      { lat: 18.8120, lng: 71.9450 },
    ],
    environmental: {
      windSpeedKnots: 14.2,
      windDirectionDeg: 235, // SW Monsoon
      windSource: 'ECMWF ERA5 (0.1° resolution)',
      currentSpeedKnots: 0.85,
      currentDirectionDeg: 35, // North-East drift
      currentSource: 'INCOIS Ocean Circulation Model (CMEMS Coupled)',
      seaSurfaceTempC: 28.4,
      waveHeightMeters: 1.6,
    },
    backwardParticles: [
      { lat: 18.798, lng: 71.976, probability: 0.98, releaseTime: '04:45 UTC' },
      { lat: 18.805, lng: 71.985, probability: 0.92, releaseTime: '05:00 UTC' },
      { lat: 18.790, lng: 71.968, probability: 0.89, releaseTime: '04:30 UTC' },
      { lat: 18.815, lng: 71.995, probability: 0.84, releaseTime: '05:15 UTC' },
      { lat: 18.780, lng: 71.955, probability: 0.81, releaseTime: '04:15 UTC' },
      { lat: 18.825, lng: 72.010, probability: 0.75, releaseTime: '05:45 UTC' },
    ],
    forwardForecast: {
      h6: {
        lat: 18.9820,
        lng: 72.2250,
        areaKm2: 12.8,
        polygon: [
          { lat: 19.0120, lng: 72.2010 },
          { lat: 19.0040, lng: 72.2420 },
          { lat: 18.9620, lng: 72.2540 },
          { lat: 18.9500, lng: 72.2150 },
          { lat: 19.0120, lng: 72.2010 },
        ],
        risk: 'LOW',
      },
      h12: {
        lat: 19.0480,
        lng: 72.3120,
        areaKm2: 18.4,
        polygon: [
          { lat: 19.0880, lng: 72.2820 },
          { lat: 19.0750, lng: 72.3480 },
          { lat: 19.0180, lng: 72.3450 },
          { lat: 19.0080, lng: 72.2780 },
          { lat: 19.0880, lng: 72.2820 },
        ],
        risk: 'MODERATE',
      },
      h24: {
        lat: 19.1650,
        lng: 72.4820,
        areaKm2: 29.5,
        polygon: [
          { lat: 19.2250, lng: 72.4350 },
          { lat: 19.2050, lng: 72.5350 },
          { lat: 19.1120, lng: 72.5280 },
          { lat: 19.1050, lng: 72.4280 },
          { lat: 19.2250, lng: 72.4350 },
        ],
        risk: 'HIGH',
      },
    },
  },
  'chennai-ennore': {
    id: 'chennai-ennore',
    caseCode: 'ENNORE-2017-01',
    title: 'Bay of Bengal — Kamarajar (Ennore) Tanker Collision Spill',
    regionName: 'Coromandel Coastal Corridor',
    seaArea: 'Bay of Bengal (East Coast EEZ)',
    incidentTime: '28 Jan 2017 04:00 UTC',
    detectionTime: '29 Jan 2017 06:12 UTC (Sentinel-1A SAR Pass)',
    slickCentroid: { lat: 13.2350, lng: 80.3410 },
    slickAreaKm2: 12.4,
    suspectVesselId: 'vessel-dawn-kanchipuram',
    releaseWindow: {
      start: '28 Jan 2017 02:00 UTC',
      end: '28 Jan 2017 06:00 UTC',
      peak: '28 Jan 2017 03:45 UTC',
    },
    slickPolygon: [
      { lat: 13.2100, lng: 80.3200 },
      { lat: 13.2250, lng: 80.3350 },
      { lat: 13.2450, lng: 80.3500 },
      { lat: 13.2600, lng: 80.3620 },
      { lat: 13.2550, lng: 80.3550 },
      { lat: 13.2380, lng: 80.3400 },
      { lat: 13.2180, lng: 80.3250 },
      { lat: 13.2100, lng: 80.3200 },
    ],
    originCentroid: { lat: 13.2650, lng: 80.3440 },
    originRegion: [
      { lat: 13.2620, lng: 80.3320 },
      { lat: 13.2750, lng: 80.3450 },
      { lat: 13.2680, lng: 80.3580 },
      { lat: 13.2520, lng: 80.3420 },
      { lat: 13.2620, lng: 80.3320 },
    ],
    environmental: {
      windSpeedKnots: 12.5,
      windDirectionDeg: 35, // NNE
      windSource: 'ECMWF ERA5 Reanalysis',
      currentSpeedKnots: 0.82,
      currentDirectionDeg: 195, // South-South-West alongshore current
      currentSource: 'INCOIS Coastal Hydrodynamic Model',
      seaSurfaceTempC: 26.4,
      waveHeightMeters: 1.1,
    },
    backwardParticles: [
      { lat: 13.265, lng: 80.344, probability: 0.95, releaseTime: '03:45 UTC' },
      { lat: 13.270, lng: 80.348, probability: 0.90, releaseTime: '04:00 UTC' },
      { lat: 13.260, lng: 80.339, probability: 0.85, releaseTime: '03:15 UTC' },
    ],
    forwardForecast: {
      h6: {
        lat: 13.2180,
        lng: 80.3320,
        areaKm2: 15.2,
        polygon: [
          { lat: 13.1950, lng: 80.3120 },
          { lat: 13.2100, lng: 80.3280 },
          { lat: 13.2350, lng: 80.3450 },
          { lat: 13.2450, lng: 80.3520 },
          { lat: 13.2280, lng: 80.3400 },
          { lat: 13.1950, lng: 80.3120 },
        ],
        risk: 'HIGH',
      },
      h12: {
        lat: 13.1920,
        lng: 80.3210,
        areaKm2: 19.8,
        polygon: [
          { lat: 13.1650, lng: 80.3000 },
          { lat: 13.1850, lng: 80.3180 },
          { lat: 13.2150, lng: 80.3380 },
          { lat: 13.2250, lng: 80.3450 },
          { lat: 13.1650, lng: 80.3000 },
        ],
        risk: 'HIGH',
      },
      h24: {
        lat: 13.1400,
        lng: 80.3020,
        areaKm2: 27.5,
        polygon: [
          { lat: 13.1100, lng: 80.2800 },
          { lat: 13.1350, lng: 80.2980 },
          { lat: 13.1680, lng: 80.3200 },
          { lat: 13.1780, lng: 80.3280 },
          { lat: 13.1100, lng: 80.2800 },
        ],
        risk: 'HIGH',
      },
    },
  },
};
