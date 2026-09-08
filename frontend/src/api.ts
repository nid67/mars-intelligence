import type { Investigation, CandidateAssessment } from './types/investigation';

const API_BASE = 'http://localhost:8000/api/v1';

export async function seedDemoData() {
  const res = await fetch(`${API_BASE}/demo/seed`, { method: 'POST' });
  return res.json();
}

export async function runInvestigationPipeline(id: string) {
  const res = await fetch(`${API_BASE}/investigations/${id}/run`, { method: 'POST' });
  return res.json();
}

export async function fetchInvestigationsList() {
  const res = await fetch(`${API_BASE}/investigations`);
  return res.json();
}

export async function deleteInvestigation(id: string) {
  const res = await fetch(`${API_BASE}/investigations/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function fetchFullInvestigation(id: string): Promise<Investigation> {
  const [invData, summaryData, reportData, mapData] = await Promise.all([
    fetch(`${API_BASE}/investigations/${id}`).then(r => r.json()),
    fetch(`${API_BASE}/investigations/${id}/summary`).then(r => r.json()),
    fetch(`${API_BASE}/investigations/${id}/report`).then(r => r.json()),
    fetch(`${API_BASE}/investigations/${id}/map`).then(r => r.json())
  ]);

  const mapLayers = mapData.layers || {};
  const spillGeo = mapLayers.spill?.features?.[0];
  const spillPoly = spillGeo?.geometry?.coordinates?.[0]?.map((c: any) => ({ lat: c[1], lng: c[0] })) || [];
  
  const originGeo = mapLayers.origin?.features?.[0];
  const originPoly = originGeo?.geometry?.coordinates?.[0]?.map((c: any) => ({ lat: c[1], lng: c[0] })) || [];

  const driftParticlesGeo = mapLayers.drift?.features?.find((f: any) => f.properties.layer === 'backward_particles');
  const particles = driftParticlesGeo?.geometry?.coordinates?.map((c: any, i: number) => ({
    id: i,
    lat: c[1],
    lng: c[0],
    probabilityDensity: 1.0 - (i * 0.01),
    releaseTime: summaryData.probable_origin_region?.release_window_start || '',
    trajectoryHoursBack: 12
  })) || [];

  const candidates: CandidateAssessment[] = summaryData.candidate_ranking?.map((c: any) => {
    const trackGeo = mapLayers.vessels?.features?.find((f: any) => f.properties.layer === 'vessel_track' && f.properties.mmsi === c.mmsi);
    const trajectory = trackGeo?.geometry?.coordinates?.map((coord: any) => ({
      lat: coord[1],
      lng: coord[0],
      timestamp: summaryData.observation_time,
      sogKnots: 10,
      cogDeg: 45,
      headingDeg: 45,
      navStatus: 'Underway'
    })) || [];

    return {
      vesselId: String(c.vessel_id),
      rank: c.candidate_rank,
      vessel: {
        id: String(c.vessel_id),
        name: c.name,
        mmsi: c.mmsi || 0,
        imo: c.mmsi || 0,
        callsign: '',
        flag: c.flag || 'UN',
        vesselType: c.vessel_type || 'Unknown',
        lengthMeters: 200,
        beamMeters: 30,
        draftMeters: 10,
        trajectory
      },
      attributionScore: c.attribution_score,
      investigativePriority: c.investigation_priority,
      qualitativeStates: {
        originCompatibility: scoreToQualitative(c.score_breakdown?.origin_compatibility || 0),
        temporalCompatibility: scoreToQualitative(c.score_breakdown?.temporal_compatibility || 0),
        driftCompatibility: scoreToQualitative(c.score_breakdown?.drift_compatibility || 0),
        trajectoryAlignment: scoreToQualitative(c.score_breakdown?.trajectory_compatibility || 0),
        vesselType: scoreToQualitative(c.score_breakdown?.vessel_type || 0),
        aisQuality: scoreToQualitative(c.score_breakdown?.ais_quality || 0)
      },
      factorBreakdown: {
        originCompatibility: c.score_breakdown?.origin_compatibility || 0,
        temporalCompatibility: c.score_breakdown?.temporal_compatibility || 0,
        driftCompatibility: c.score_breakdown?.drift_compatibility || 0,
        trajectoryAlignment: c.score_breakdown?.trajectory_compatibility || 0,
        vesselType: c.score_breakdown?.vessel_type || 0,
        aisQuality: c.score_breakdown?.ais_quality || 0,
        behavioralEvidence: 0,
        aisGapPenalty: 0,
        routeUncertaintyPenalty: 0
      },
      supportingEvidence: c.supporting_evidence?.map((e: any) => e.title) || [],
      contradictingEvidence: c.contradicting_evidence?.map((e: any) => e.title) || [],
      aisQualityScore: 'HIGH',
      lastKnownDistanceToSpillOriginKm: 5.0,
      closestApproachTimestamp: summaryData.observation_time
    };
  }) || [];

  return {
    id: invData.id,
    code: invData.id.split('-')[0].toUpperCase(),
    title: invData.name,
    locationName: invData.region,
    region: invData.region,
    startDate: invData.created_at,
    endDate: invData.created_at,
    observationTimestamp: invData.observation_time,
    status: invData.status,
    dataMode: invData.data_mode as any,
    modelVersion: 'MARS-UNet-SAR-v2.4',
    lastProcessedTimestamp: invData.updated_at,
    boundingBox: {
      minLng: invData.bbox[0],
      minLat: invData.bbox[1],
      maxLng: invData.bbox[2],
      maxLat: invData.bbox[3],
    },
    mapBounds: [[invData.bbox[1], invData.bbox[0]], [invData.bbox[3], invData.bbox[2]]],
    spillDetection: {
      id: summaryData.spill?.id || 'spill',
      caseId: invData.id,
      observation: {
        id: 'OBS',
        satellite: 'Sentinel-1',
        sensor: 'C-SAR',
        mode: 'IW',
        polarization: 'VV',
        acquisitionTime: invData.observation_time,
        orbitDirection: 'DESCENDING',
        incidenceAngleDeg: 37.4,
        resolutionMeters: 10,
        tileId: 'TILE',
        qualityScore: 'HIGH'
      },
      characteristics: {
        areaKm2: summaryData.spill?.estimated_area_sqkm || 0,
        perimeterKm: summaryData.spill?.perimeter_km || 0,
        centroid: { lat: summaryData.spill?.centroid?.[1] || 0, lng: summaryData.spill?.centroid?.[0] || 0 },
        majorAxisKm: 5,
        minorAxisKm: 1,
        orientationDeg: summaryData.spill?.orientation_deg || 0,
        meanBackscatterDb: -22,
        minBackscatterDb: -28,
        contrastDb: -8,
        smoothnessIndex: 0.9,
        lookAlikeRisk: 'LOW',
        slickTypeHypothesis: 'Hydrocarbon Slick'
      },
      polygon: spillPoly,
      detectionConfidence: 'HIGH',
      modelName: 'DeepSAR-SpillSegmenter',
      modelVersion: 'v2.4',
      inferenceTimeMs: 400
    },
    environmentalData: {
      timestamp: invData.observation_time,
      windSpeedKnots: (summaryData.environmental?.u_wind_mps || 5) * 1.94384,
      windDirectionDeg: 180,
      windSource: summaryData.environmental?.source || 'ERA5',
      currentSpeedKnots: (summaryData.environmental?.u_current_mps || 0.5) * 1.94384,
      currentDirectionDeg: 45,
      currentSource: 'CMEMS',
      seaSurfaceTempC: 28,
      waveHeightMeters: 1.5
    },
    driftRun: {
      simulationId: 'sim-1',
      durationHours: 12,
      particleCount: 500,
      windagePercentage: 3.0,
      diffusionEnabled: true,
      forcingSources: ['ERA5', 'CMEMS'],
      probableOriginRegion: originPoly,
      originCentroid: { lat: summaryData.probable_origin_region?.centroid?.[1] || 0, lng: summaryData.probable_origin_region?.centroid?.[0] || 0 },
      estimatedReleaseWindow: {
        startTime: summaryData.probable_origin_region?.release_window_start || '',
        endTime: summaryData.probable_origin_region?.release_window_end || '',
        confidence: 'HIGH',
        mostProbableTime: summaryData.probable_origin_region?.release_window_start || ''
      },
      originConfidence: 'HIGH',
      particles: particles,
      forecasts: {
        h6: { hoursOffset: 6, targetTimestamp: '', predictedCentroid: { lat: 0, lng: 0 }, predictedAreaKm2: 0, confidencePolygon: [], driftVectorDeg: 0, driftSpeedKnots: 0, shorelineImpactRisk: 'LOW' },
        h12: { hoursOffset: 12, targetTimestamp: '', predictedCentroid: { lat: 0, lng: 0 }, predictedAreaKm2: 0, confidencePolygon: [], driftVectorDeg: 0, driftSpeedKnots: 0, shorelineImpactRisk: 'LOW' },
        h24: { hoursOffset: 24, targetTimestamp: '', predictedCentroid: { lat: 0, lng: 0 }, predictedAreaKm2: 0, confidencePolygon: [], driftVectorDeg: 0, driftSpeedKnots: 0, shorelineImpactRisk: 'LOW' }
      }
    },
    candidates: candidates,
    evidenceChain: [],
    dataQuality: {
      satelliteQuality: 'HIGH',
      aisQuality: 'HIGH',
      windModelQuality: 'HIGH',
      currentModelQuality: 'HIGH',
      driftModelQuality: 'HIGH'
    },
    vesselPipelineSummary: {
      totalConsidered: 50,
      spatiallyRelevant: 10,
      temporallyCompatible: 5,
      trajectoryCompatible: 2,
      finalCandidatesCount: candidates.length
    }
  };
}

function scoreToQualitative(score: number): any {
  if (score > 15) return 'STRONG';
  if (score > 5) return 'MODERATE';
  return 'WEAK';
}
