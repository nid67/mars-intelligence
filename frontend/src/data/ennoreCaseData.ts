import type { Investigation } from '../types/investigation';

// Ennore Coast Coordinates
// Latitude ~ 13.2350 N, Longitude ~ 80.3320 E
export const ENNORE_CASE: Investigation = {
  id: 'case-ennore-2017-01',
  code: 'ENNORE-2017-01',
  title: 'Potential Oil Spill Investigation — Ennore / Chennai',
  locationName: 'Chennai Coast, Kamarajar Port (Ennore)',
  region: 'Bay of Bengal, India',
  startDate: '28 Jan 2017',
  endDate: '29 Jan 2017',
  observationTimestamp: '2017-01-29T06:12:00Z',
  status: 'INVESTIGATION COMPLETE',
  dataMode: 'DEMONSTRATION',
  modelVersion: 'MARS v0.1',
  lastProcessedTimestamp: '2026-09-08T18:45:12Z',
  boundingBox: {
    minLat: 13.150,
    maxLat: 13.350,
    minLng: 80.250,
    maxLng: 80.450
  },
  mapBounds: [[13.13, 80.27], [13.35, 80.43]],
  spillDetection: {
    id: 'spill-det-001',
    caseId: 'case-ennore-2017-01',
    observation: {
      id: 'sat-obs-sentinel1a',
      satellite: 'Sentinel-1A SAR',
      sensor: 'C-Band Synthetic Aperture Radar',
      mode: 'IW (Interferometric Wide Swath)',
      polarization: 'VV',
      acquisitionTime: '2017-01-29T06:12:00Z',
      orbitDirection: 'DESCENDING',
      incidenceAngleDeg: 34.2,
      resolutionMeters: 10,
      tileId: 'S1A_IW_GRDH_1SDV_20170129T061200_CHENNAI',
      qualityScore: 'HIGH'
    },
    characteristics: {
      areaKm2: 12.4,
      perimeterKm: 28.6,
      centroid: { lat: 13.2350, lng: 80.3410 },
      majorAxisKm: 7.2,
      minorAxisKm: 2.1,
      orientationDeg: 42,
      meanBackscatterDb: -22.4,
      minBackscatterDb: -28.9,
      contrastDb: 9.8,
      smoothnessIndex: 0.86,
      lookAlikeRisk: 'LOW',
      slickTypeHypothesis: 'Heavy Fuel Oil / Marine Bunker Spill (Bunker C)'
    },
    polygon: [
      { lat: 13.2100, lng: 80.3200 },
      { lat: 13.2250, lng: 80.3350 },
      { lat: 13.2450, lng: 80.3500 },
      { lat: 13.2600, lng: 80.3620 },
      { lat: 13.2550, lng: 80.3550 },
      { lat: 13.2380, lng: 80.3400 },
      { lat: 13.2180, lng: 80.3250 },
      { lat: 13.2100, lng: 80.3200 }
    ],
    detectionConfidence: 'HIGH',
    modelName: 'DeepSAR-SpillSegmenter',
    modelVersion: '2.4.1-rc',
    inferenceTimeMs: 420
  },
  environmentalData: {
    timestamp: '2017-01-29T06:12:00Z',
    windSpeedKnots: 12.5,
    windDirectionDeg: 35.0, // NNE
    windSource: 'ECMWF ERA5 Reanalysis (0.1 deg)',
    currentSpeedKnots: 0.82,
    currentDirectionDeg: 195.0, // SSW alongshore current
    currentSource: 'INCOIS High-Resolution Coastal Ocean Model',
    seaSurfaceTempC: 26.4,
    waveHeightMeters: 1.1
  },
  driftRun: {
    simulationId: 'SIM-ENN-20170129-001',
    durationHours: 28,
    particleCount: 120,
    windagePercentage: 3.5,
    diffusionEnabled: true,
    forcingSources: ['ERA5 Atmospheric Wind (10m)', 'INCOIS Hydrodynamic Currents (Surface)'],
    probableOriginRegion: [
      { lat: 13.2620, lng: 80.3320 },
      { lat: 13.2750, lng: 80.3450 },
      { lat: 13.2680, lng: 80.3580 },
      { lat: 13.2520, lng: 80.3420 }
    ],
    originCentroid: { lat: 13.2650, lng: 80.3440 },
    estimatedReleaseWindow: {
      startTime: '2017-01-28T02:00:00Z',
      endTime: '2017-01-28T06:00:00Z',
      confidence: 'MODERATE',
      mostProbableTime: '2017-01-28T03:45:00Z'
    },
    originConfidence: 'MODERATE',
    particles: Array.from({ length: 120 }).map((_, idx) => {
      // Generate particle density cloud around origin 13.265, 80.344
      const spreadLat = (Math.random() - 0.5) * 0.025;
      const spreadLng = (Math.random() - 0.5) * 0.025;
      return {
        id: idx + 1,
        lat: 13.2650 + spreadLat,
        lng: 80.3440 + spreadLng,
        probabilityDensity: Math.max(0.2, 1 - Math.sqrt(spreadLat*spreadLat + spreadLng*spreadLng)/0.02),
        releaseTime: '2017-01-28T03:30:00Z'
      };
    }),
    forecasts: {
      h6: {
        hoursOffset: 6,
        targetTimestamp: '2017-01-29T12:12:00Z',
        predictedCentroid: { lat: 13.2180, lng: 80.3320 },
        predictedAreaKm2: 15.2,
        confidencePolygon: [
          { lat: 13.1950, lng: 80.3120 },
          { lat: 13.2100, lng: 80.3280 },
          { lat: 13.2350, lng: 80.3450 },
          { lat: 13.2450, lng: 80.3520 },
          { lat: 13.2280, lng: 80.3400 },
          { lat: 13.2050, lng: 80.3220 }
        ],
        driftVectorDeg: 210,
        driftSpeedKnots: 1.1,
        shorelineImpactRisk: 'MODERATE'
      },
      h12: {
        hoursOffset: 12,
        targetTimestamp: '2017-01-29T18:12:00Z',
        predictedCentroid: { lat: 13.1920, lng: 80.3210 },
        predictedAreaKm2: 19.8,
        confidencePolygon: [
          { lat: 13.1650, lng: 80.3000 },
          { lat: 13.1850, lng: 80.3180 },
          { lat: 13.2150, lng: 80.3380 },
          { lat: 13.2250, lng: 80.3450 },
          { lat: 13.2020, lng: 80.3300 },
          { lat: 13.1780, lng: 80.3080 }
        ],
        driftVectorDeg: 205,
        driftSpeedKnots: 1.2,
        shorelineImpactRisk: 'HIGH'
      },
      h24: {
        hoursOffset: 24,
        targetTimestamp: '2017-01-30T06:12:00Z',
        predictedCentroid: { lat: 13.1400, lng: 80.3020 },
        predictedAreaKm2: 27.5,
        confidencePolygon: [
          { lat: 13.1100, lng: 80.2800 },
          { lat: 13.1350, lng: 80.2980 },
          { lat: 13.1680, lng: 80.3200 },
          { lat: 13.1780, lng: 80.3280 },
          { lat: 13.1520, lng: 80.3100 },
          { lat: 13.1250, lng: 80.2880 }
        ],
        driftVectorDeg: 200,
        driftSpeedKnots: 1.3,
        shorelineImpactRisk: 'HIGH'
      }
    }
  },
  vesselPipelineSummary: {
    totalConsidered: 147,
    spatiallyRelevant: 19,
    temporallyCompatible: 6,
    trajectoryCompatible: 3,
    finalCandidatesCount: 3
  },
  candidates: [
    {
      vesselId: 'vessel-bw-maple',
      rank: 1,
      vessel: {
        id: 'vessel-bw-maple',
        name: 'MT BW MAPLE',
        mmsi: 257853000,
        imo: 9322982,
        callsign: 'LAGE7',
        flag: 'Norway (NIS)',
        vesselType: 'LPG Tanker / Gas Carrier',
        lengthMeters: 226,
        beamMeters: 37,
        draftMeters: 10.8,
        trajectory: [
          { timestamp: '2017-01-28T01:30:00Z', lat: 13.2880, lng: 80.3650, sogKnots: 12.4, cogDeg: 198, headingDeg: 196, navStatus: 'Underway Using Engine' },
          { timestamp: '2017-01-28T02:15:00Z', lat: 13.2720, lng: 80.3510, sogKnots: 6.2, cogDeg: 215, headingDeg: 212, navStatus: 'Underway Using Engine', inOriginZone: true, distanceToOriginKm: 0.8 },
          { timestamp: '2017-01-28T03:00:00Z', lat: 13.2640, lng: 80.3420, sogKnots: 0.8, cogDeg: 140, headingDeg: 135, navStatus: 'Not Under Command', inOriginZone: true, distanceToOriginKm: 0.2 },
          { timestamp: '2017-01-28T04:30:00Z', lat: 13.2660, lng: 80.3450, sogKnots: 1.2, cogDeg: 80, headingDeg: 85, navStatus: 'Restricted Maneuverability', inOriginZone: true, distanceToOriginKm: 0.3 },
          { timestamp: '2017-01-28T06:00:00Z', lat: 13.2710, lng: 80.3550, sogKnots: 3.5, cogDeg: 45, headingDeg: 42, navStatus: 'Underway Using Engine' },
          { timestamp: '2017-01-28T09:00:00Z', lat: 13.2950, lng: 80.3800, sogKnots: 8.0, cogDeg: 30, headingDeg: 28, navStatus: 'Underway Using Engine' }
        ]
      },
      attributionScore: 82,
      investigativePriority: 'HIGH',
      qualitativeStates: {
        originCompatibility: 'STRONG',
        temporalCompatibility: 'STRONG',
        driftCompatibility: 'STRONG',
        trajectoryAlignment: 'STRONG',
        vesselType: 'MODERATE',
        aisQuality: 'STRONG'
      },
      factorBreakdown: {
        originCompatibility: 22,
        temporalCompatibility: 19,
        driftCompatibility: 18,
        trajectoryAlignment: 13,
        vesselType: 4,
        aisQuality: 4,
        behavioralEvidence: 2,
        aisGapPenalty: -5,
        routeUncertaintyPenalty: -2
      },
      supportingEvidence: [
        'Vessel trajectory intersected probable origin polygon at 02:45 UTC (distance < 0.3 km).',
        'Abrupt speed reduction from 12.4 knots to 0.8 knots within origin window.',
        'AIS Navigational Status changed to "Not Under Command" at 03:00 UTC.',
        'Physical collision event registered in maritime authority port log at 02:45 UTC.'
      ],
      contradictingEvidence: [
        '18-minute AIS transmission gap between 02:50 UTC and 03:08 UTC.',
        'Gas carrier primary cargo is LPG (fuel oil fuel line leak suspected rather than cargo discharge).'
      ],
      aisQualityScore: 'HIGH',
      lastKnownDistanceToSpillOriginKm: 0.2,
      closestApproachTimestamp: '2017-01-28T03:00:00Z'
    },
    {
      vesselId: 'vessel-dawn-kanchipuram',
      rank: 2,
      vessel: {
        id: 'vessel-dawn-kanchipuram',
        name: 'MT DAWN KANCHIPURAM',
        mmsi: 419000124,
        imo: 9114866,
        callsign: 'AWVY',
        flag: 'India',
        vesselType: 'Oil/Chemical Tanker',
        lengthMeters: 182,
        beamMeters: 32,
        draftMeters: 11.2,
        trajectory: [
          { timestamp: '2017-01-28T01:30:00Z', lat: 13.2450, lng: 80.3200, sogKnots: 8.1, cogDeg: 25, headingDeg: 22, navStatus: 'Underway Using Engine' },
          { timestamp: '2017-01-28T02:15:00Z', lat: 13.2580, lng: 80.3360, sogKnots: 5.4, cogDeg: 35, headingDeg: 32, navStatus: 'Underway Using Engine', inOriginZone: true, distanceToOriginKm: 1.1 },
          { timestamp: '2017-01-28T03:00:00Z', lat: 13.2630, lng: 80.3430, sogKnots: 0.2, cogDeg: 0, headingDeg: 140, navStatus: 'Stopped / Anchored', inOriginZone: true, distanceToOriginKm: 0.3 },
          { timestamp: '2017-01-28T04:30:00Z', lat: 13.2620, lng: 80.3440, sogKnots: 0.1, cogDeg: 0, headingDeg: 155, navStatus: 'Restricted Maneuverability', inOriginZone: true, distanceToOriginKm: 0.1 },
          { timestamp: '2017-01-28T06:00:00Z', lat: 13.2610, lng: 80.3450, sogKnots: 0.0, cogDeg: 0, headingDeg: 160, navStatus: 'At Anchor' },
          { timestamp: '2017-01-28T09:00:00Z', lat: 13.2610, lng: 80.3450, sogKnots: 0.0, cogDeg: 0, headingDeg: 160, navStatus: 'At Anchor' }
        ]
      },
      attributionScore: 67,
      investigativePriority: 'MODERATE',
      qualitativeStates: {
        originCompatibility: 'STRONG',
        temporalCompatibility: 'STRONG',
        driftCompatibility: 'STRONG',
        trajectoryAlignment: 'MODERATE',
        vesselType: 'STRONG',
        aisQuality: 'MODERATE'
      },
      factorBreakdown: {
        originCompatibility: 21,
        temporalCompatibility: 18,
        driftCompatibility: 17,
        trajectoryAlignment: 10,
        vesselType: 5,
        aisQuality: 3,
        behavioralEvidence: 1,
        aisGapPenalty: -6,
        routeUncertaintyPenalty: -2
      },
      supportingEvidence: [
        'Vessel carried heavy petroleum oil cargo (Heavy Fuel Oil / Lubricants).',
        'Stationary inside probable release zone during estimated release window (02:00-06:00 UTC).',
        'Port log confirms involvement in outward passage maneuver during MT BW MAPLE encounter.'
      ],
      contradictingEvidence: [
        '32-minute AIS blackout during collision event.',
        'Initial verbal port report claimed zero breach (later contradicted by shoreline oil washup).'
      ],
      aisQualityScore: 'MODERATE',
      lastKnownDistanceToSpillOriginKm: 0.1,
      closestApproachTimestamp: '2017-01-28T03:00:00Z'
    },
    {
      vesselId: 'vessel-ocean-ruby',
      rank: 3,
      vessel: {
        id: 'vessel-ocean-ruby',
        name: 'MV OCEAN RUBY',
        mmsi: 419088710,
        imo: 9410123,
        callsign: 'V7AB9',
        flag: 'Marshall Islands',
        vesselType: 'General Cargo',
        lengthMeters: 145,
        beamMeters: 22,
        draftMeters: 7.5,
        trajectory: [
          { timestamp: '2017-01-28T01:30:00Z', lat: 13.2000, lng: 80.3700, sogKnots: 13.8, cogDeg: 15, headingDeg: 15, navStatus: 'Underway Using Engine' },
          { timestamp: '2017-01-28T02:15:00Z', lat: 13.2350, lng: 80.3800, sogKnots: 13.6, cogDeg: 14, headingDeg: 15, navStatus: 'Underway Using Engine' },
          { timestamp: '2017-01-28T03:00:00Z', lat: 13.2700, lng: 80.3900, sogKnots: 13.7, cogDeg: 15, headingDeg: 15, navStatus: 'Underway Using Engine' },
          { timestamp: '2017-01-28T04:30:00Z', lat: 13.3400, lng: 80.4100, sogKnots: 13.5, cogDeg: 16, headingDeg: 16, navStatus: 'Underway Using Engine' },
          { timestamp: '2017-01-28T06:00:00Z', lat: 13.4100, lng: 80.4300, sogKnots: 13.8, cogDeg: 15, headingDeg: 15, navStatus: 'Underway Using Engine' }
        ]
      },
      attributionScore: 31,
      investigativePriority: 'LOW',
      qualitativeStates: {
        originCompatibility: 'WEAK',
        temporalCompatibility: 'MODERATE',
        driftCompatibility: 'WEAK',
        trajectoryAlignment: 'WEAK',
        vesselType: 'WEAK',
        aisQuality: 'STRONG'
      },
      factorBreakdown: {
        originCompatibility: 8,
        temporalCompatibility: 12,
        driftCompatibility: 6,
        trajectoryAlignment: 3,
        vesselType: 1,
        aisQuality: 4,
        behavioralEvidence: 0,
        aisGapPenalty: 0,
        routeUncertaintyPenalty: -3
      },
      supportingEvidence: [
        'Transit route within 4.2 km east of spill origin boundary at 02:50 UTC.'
      ],
      contradictingEvidence: [
        'Maintained constant transit speed (13.7 knots) with zero deviation or emergency maneuver.',
        'Continuous high-frequency AIS broadcasting with 0 missing packets.',
        'General cargo vessel with no bulk oil cargo onboard.'
      ],
      aisQualityScore: 'HIGH',
      lastKnownDistanceToSpillOriginKm: 4.2,
      closestApproachTimestamp: '2017-01-28T02:50:00Z'
    }
  ],
  evidenceChain: [
    {
      id: 'ev-01',
      nodeId: 'SAT',
      title: 'Satellite SAR Acquisition',
      source: 'Sentinel-1A C-Band SAR',
      timestamp: '2017-01-29T06:12:00Z',
      derivedValue: 'Raw SAR GRD VV Backscatter Image',
      confidence: 'HIGH',
      methodology: 'Synthetic Aperture Radar specular reflection damping over dark ocean slick.',
      supportingDetails: [
        '10m spatial resolution imagery acquired in IW mode.',
        'Low wind speed window (14 knots) optimal for SAR surface roughness damping detection.'
      ],
      limitations: ['Single frame acquisition; next satellite pass available +36 hours.'],
      auditableHash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    {
      id: 'ev-02',
      nodeId: 'SLICK',
      title: 'Oil Slick Segmentation',
      source: 'MARS-SAR-U-Net Segmentation',
      timestamp: '2017-01-29T06:12:00Z',
      derivedValue: '12.4 km² Surface Polygon',
      confidence: 'HIGH',
      methodology: 'Deep Convolutional U-Net trained on Sentinel-1 oil slick vs look-alike benchmarks.',
      supportingDetails: [
        'Mean backscatter depression: -22.4 dB (contrast: 9.8 dB vs clean water).',
        'Look-alike risk evaluated LOW (biogenic slicks and low-wind areas excluded).'
      ],
      limitations: ['Slick boundary subject to minor diffusion error along fringe pixels.'],
      auditableHash: 'sha256:f1d2d2f924e986ac86fdf7b36c94bcdf32beec15'
    },
    {
      id: 'ev-03',
      nodeId: 'CHAR',
      title: 'Slick Characterization',
      source: 'MARS Feature Extractor',
      timestamp: '2017-01-29T06:20:00Z',
      derivedValue: 'Elongated Shape (Ratio 3.4:1), Orient: 42°',
      confidence: 'HIGH',
      methodology: 'Spatial statistics, perimeter-to-area ratio, and backscatter histogram analysis.',
      supportingDetails: [
        'Elongation along 42° axis aligns with 65° ENE wind and 195° SSW current vector combination.',
        'High contrast indicates mineral oil emulsion layer.'
      ],
      limitations: ['Weathering status estimated based on backscatter attenuation.'],
      auditableHash: 'sha256:a209b1192e4e10d29486c757c32729a8'
    },
    {
      id: 'ev-04',
      nodeId: 'DRIFT',
      title: 'Backward Lagrangian Drift Modeling',
      source: 'OpenDrift / MARS Lagrangian Engine',
      timestamp: '2017-01-29T06:30:00Z',
      derivedValue: '500-Particle Reverse Drift Cloud (24h back-track)',
      confidence: 'MODERATE',
      methodology: 'Backward Monte Carlo particle tracking using ERA5 10m wind and INCOIS surface currents.',
      supportingDetails: [
        'Windage factor: 3.0% with turbulent horizontal diffusion enabled.',
        'Convergence of 85% particles into high-density origin zone.'
      ],
      limitations: ['Coastal boundary bathymetry grid resolution: 500 meters.'],
      auditableHash: 'sha256:7b9173d1f11e9f168b44ef91550c'
    },
    {
      id: 'ev-05',
      nodeId: 'ORIGIN',
      title: 'Probable Origin Identification',
      source: 'MARS Spatial Density Engine',
      timestamp: '2017-01-29T06:40:00Z',
      derivedValue: 'Origin Polygon Centroid: 13.2650° N, 80.3440° E',
      confidence: 'MODERATE',
      methodology: 'K-Means clustering and kernel density estimation on particle convergence points.',
      supportingDetails: [
        'Origin region situated 2.8 km northeast of Kamarajar Port (Ennore) entrance channel.'
      ],
      limitations: ['Represented as uncertainty region polygon rather than a discrete point.'],
      auditableHash: 'sha256:4d60c4103138b1f8'
    },
    {
      id: 'ev-06',
      nodeId: 'RELEASE',
      title: 'Release Window Estimation',
      source: 'Temporal Hydrodynamic Analysis',
      timestamp: '2017-01-29T06:50:00Z',
      derivedValue: '28 Jan 2017, 02:00 – 06:00 UTC',
      confidence: 'MODERATE',
      methodology: 'Back-projected drift age calculation combined with slick thickness dissipation rates.',
      supportingDetails: [
        'Peak probability density corresponds to 02:30–03:45 UTC release timeframe.'
      ],
      limitations: ['Discharge rate assumed continuous over estimated window.'],
      auditableHash: 'sha256:9c129e9921b7'
    },
    {
      id: 'ev-07',
      nodeId: 'AIS',
      title: 'AIS Trajectory Reconstruction',
      source: 'MARS AIS Pipeline & Terrestrial Receivers',
      timestamp: '2017-01-29T07:10:00Z',
      derivedValue: '147 Total Vessels -> 19 Spatial -> 3 Candidate Tracks',
      confidence: 'HIGH',
      methodology: 'Linear interpolation, kalman filtering, and anomaly flag detection on MMSI streams.',
      supportingDetails: [
        'High-density AIS coverage off Chennai port limits.',
        'Identified 2 collision-involved vessels and 1 transit vessel in immediate vicinity.'
      ],
      limitations: ['18-min AIS gap on Candidate A; 32-min gap on Candidate B.'],
      auditableHash: 'sha256:5ef49a888c'
    },
    {
      id: 'ev-08',
      nodeId: 'CANDIDATE',
      title: 'Candidate Vessel Identification',
      source: 'MARS Multi-Criteria Filter',
      timestamp: '2017-01-29T07:30:00Z',
      derivedValue: '3 Ranked Candidate Vessels',
      confidence: 'HIGH',
      methodology: 'Spatio-temporal trajectory intersection with origin polygon during release window.',
      supportingDetails: [
        'Candidate 1 (MT BW MAPLE): Distance 0.2 km at 03:00 UTC.',
        'Candidate 2 (MT DAWN KANCHIPURAM): Distance 0.1 km at 03:00 UTC.',
        'Candidate 3 (MV OCEAN RUBY): Distance 4.2 km at 02:50 UTC.'
      ],
      limitations: ['Vessel ballast tank status inferred from AIS draft telemetry.'],
      auditableHash: 'sha256:d87e0291ba'
    },
    {
      id: 'ev-09',
      nodeId: 'ATTRIBUTION',
      title: 'Attribution Assessment Matrix',
      source: 'MARS Attribution Scoring Model v1.2',
      timestamp: '2017-01-29T08:00:00Z',
      derivedValue: 'Rank 1: MT BW MAPLE (Score 82) | Rank 2: MT DAWN KANCHIPURAM (Score 67)',
      confidence: 'HIGH',
      methodology: 'Weighted multi-factor score evaluating origin, temporal, drift, trajectory, vessel type, and AIS quality evidence.',
      supportingDetails: [
        'Interpretable score breakdown with explicit positive and penalty factors.',
        'Physical port records and coast guard report validate collision event at 02:45 UTC.'
      ],
      limitations: [
        'Investigative lead assessment only. Does not establish legal liability or guilt.'
      ],
      auditableHash: 'sha256:3a91c89f1a0e'
    }
  ],
  dataQuality: {
    satelliteQuality: 'HIGH',
    aisQuality: 'HIGH',
    windModelQuality: 'MODERATE',
    currentModelQuality: 'MODERATE',
    driftModelQuality: 'MODERATE'
  }
};
