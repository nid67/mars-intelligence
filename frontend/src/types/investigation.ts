export type DataMode = 'REAL' | 'DEMONSTRATION' | 'SIMULATION';
export type InvestigationStatus = 'ACTIVE' | 'INVESTIGATION COMPLETE' | 'ARCHIVED' | 'IN PROGRESS' | 'UNDER INVESTIGATION';
export type ConfidenceLevel = 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT';
export type AssessmentQualitative = 'STRONG' | 'MODERATE' | 'WEAK' | 'INSUFFICIENT';
export type DataProvenance = 'OBSERVED DATA' | 'RECONSTRUCTED DATA' | 'PREDICTED DATA';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface MonitoredRegion {
  id: string;
  name: string;
  seaArea: string;
  center: Coordinates;
  zoom: number;
  bounds: [[number, number], [number, number]];
  activeSlicksCount: number;
  lastSarPass: string;
  nextSarPass: string;
  windSpeedKnots: number;
  windDirectionDeg: number;
  currentSpeedKnots: number;
  currentDirectionDeg: number;
  vesselDensity: 'HIGH' | 'MODERATE' | 'LOW';
  status: 'NOMINAL' | 'ALERT' | 'PROCESSING';
}

export interface SarSceneAcquisition {
  id: string;
  regionId: string;
  satellite: 'Sentinel-1A' | 'Sentinel-1B' | 'Sentinel-1C';
  sensor: string;
  mode: string;
  polarization: 'VV' | 'VH' | 'HH' | 'HV' | 'VV+VH';
  acquisitionTime: string;
  orbitDirection: 'ASCENDING' | 'DESCENDING';
  relativeOrbit: number;
  incidenceAngleDeg: number;
  resolutionMeters: number;
  tileId: string;
  processingState: 'INGESTED' | 'PREPROCESSING' | 'DARK_SPOT_SEGMENTATION' | 'LOOKALIKE_FILTERED' | 'INCIDENT_GENERATED';
  detectedSlicks: number;
  lookAlikesRejected: number;
  slickIds?: string[];
  qualityScore: ConfidenceLevel;
}

export interface SpillCharacteristics {
  areaKm2: number;
  perimeterKm: number;
  centroid: Coordinates;
  majorAxisKm: number;
  minorAxisKm: number;
  orientationDeg: number;
  meanBackscatterDb: number;
  minBackscatterDb: number;
  contrastDb: number;
  smoothnessIndex: number;
  lookAlikeRisk: ConfidenceLevel;
  slickTypeHypothesis: string;
}

export interface SatelliteObservation {
  id: string;
  satellite: string;
  sensor: string;
  mode: string;
  polarization: 'VV' | 'VH' | 'HH' | 'HV' | 'VV+VH';
  acquisitionTime: string; // ISO / UTC string
  orbitDirection: 'ASCENDING' | 'DESCENDING';
  incidenceAngleDeg: number;
  resolutionMeters: number;
  tileId: string;
  qualityScore: ConfidenceLevel;
}

export interface SpillDetection {
  id: string;
  caseId: string;
  observation: SatelliteObservation;
  characteristics: SpillCharacteristics;
  polygon: Coordinates[];
  detectionConfidence: ConfidenceLevel;
  modelName: string;
  modelVersion: string;
  inferenceTimeMs: number;
}

export interface EnvironmentalData {
  timestamp: string;
  windSpeedKnots: number;
  windDirectionDeg: number;
  windSource: string;
  currentSpeedKnots: number;
  currentDirectionDeg: number;
  currentSource: string;
  seaSurfaceTempC: number;
  waveHeightMeters: number;
  stokesDriftKnots?: number;
  leewayFactor?: number;
}

export interface ParticleCloudPoint extends Coordinates {
  id: number;
  probabilityDensity: number; // 0-1
  releaseTime: string;
  trajectoryHoursBack?: number;
}

export interface ForwardForecastTrajectory {
  hoursOffset: 6 | 12 | 24;
  targetTimestamp: string;
  predictedCentroid: Coordinates;
  predictedAreaKm2: number;
  confidencePolygon: Coordinates[];
  driftVectorDeg: number;
  driftSpeedKnots: number;
  shorelineImpactRisk: 'HIGH' | 'MODERATE' | 'LOW' | 'NEGLIGIBLE';
}

export interface DriftRun {
  simulationId: string;
  durationHours: number;
  particleCount: number;
  windagePercentage: number;
  diffusionEnabled: boolean;
  forcingSources: string[];
  probableOriginRegion: Coordinates[];
  originCentroid: Coordinates;
  estimatedReleaseWindow: {
    startTime: string;
    endTime: string;
    confidence: ConfidenceLevel;
    mostProbableTime: string;
  };
  originConfidence: ConfidenceLevel;
  particles: ParticleCloudPoint[];
  forecasts: {
    h6: ForwardForecastTrajectory;
    h12: ForwardForecastTrajectory;
    h24: ForwardForecastTrajectory;
  };
}

export interface AISPosition extends Coordinates {
  timestamp: string;
  sogKnots: number; // Speed Over Ground
  cogDeg: number; // Course Over Ground
  headingDeg: number;
  navStatus: string;
  distanceToOriginKm?: number;
  inOriginZone?: boolean;
}

export interface Vessel {
  id: string;
  name: string;
  mmsi: number;
  imo: number;
  callsign: string;
  flag: string;
  vesselType: string;
  lengthMeters: number;
  beamMeters: number;
  draftMeters: number;
  trajectory: AISPosition[];
}

export interface FactorBreakdown {
  originCompatibility: number; // e.g. +22
  temporalCompatibility: number; // e.g. +19
  driftCompatibility: number; // e.g. +18
  trajectoryAlignment: number; // e.g. +13
  vesselType: number; // e.g. +04
  aisQuality: number; // e.g. +04
  behavioralEvidence: number; // e.g. +02
  aisGapPenalty: number; // e.g. -05
  routeUncertaintyPenalty: number; // e.g. -02
}

export interface CandidateAssessment {
  vesselId: string;
  rank: number;
  vessel: Vessel;
  attributionScore: number; // 0 - 100 score
  investigativePriority: ConfidenceLevel;
  qualitativeStates: {
    originCompatibility: AssessmentQualitative;
    temporalCompatibility: AssessmentQualitative;
    driftCompatibility: AssessmentQualitative;
    trajectoryAlignment: AssessmentQualitative;
    vesselType: AssessmentQualitative;
    aisQuality: AssessmentQualitative;
  };
  factorBreakdown: FactorBreakdown;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  aisQualityScore: ConfidenceLevel;
  lastKnownDistanceToSpillOriginKm: number;
  closestApproachTimestamp: string;
}

export interface EvidenceItem {
  id: string;
  nodeId: 'SAT' | 'SLICK' | 'CHAR' | 'DRIFT' | 'ORIGIN' | 'RELEASE' | 'AIS' | 'CANDIDATE' | 'ATTRIBUTION';
  title: string;
  source: string;
  timestamp: string;
  derivedValue: string;
  confidence: ConfidenceLevel;
  methodology: string;
  supportingDetails: string[];
  contradictingDetails?: string[];
  limitations: string[];
  auditableHash: string;
}

export interface DataQualitySummary {
  satelliteQuality: ConfidenceLevel;
  aisQuality: ConfidenceLevel;
  windModelQuality: ConfidenceLevel;
  currentModelQuality: ConfidenceLevel;
  driftModelQuality: ConfidenceLevel;
}

export interface Investigation {
  id: string;
  code: string;
  title: string;
  locationName: string;
  region: string;
  startDate: string;
  endDate: string;
  observationTimestamp: string;
  status: InvestigationStatus;
  dataMode: DataMode;
  modelVersion: string;
  lastProcessedTimestamp: string;
  boundingBox: BoundingBox;
  mapBounds: [[number, number], [number, number]];
  spillDetection: SpillDetection;
  environmentalData: EnvironmentalData;
  driftRun: DriftRun;
  candidates: CandidateAssessment[];
  evidenceChain: EvidenceItem[];
  dataQuality: DataQualitySummary;
  vesselPipelineSummary: {
    totalConsidered: number;
    spatiallyRelevant: number;
    temporallyCompatible: number;
    trajectoryCompatible: number;
    finalCandidatesCount: number;
  };
}
