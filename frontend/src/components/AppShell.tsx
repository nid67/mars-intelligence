import { useState, useEffect } from 'react';
import { Sidebar, type ScreenId } from './layout/Sidebar';
import { CaseHeader } from './layout/CaseHeader';
import { RegionalMonitoringScreen } from './screens/RegionalMonitoringScreen';
import { OverviewScreen } from './screens/OverviewScreen';
import { SpillDetectionScreen } from './screens/SpillDetectionScreen';
import { ReconstructionScreen } from './screens/ReconstructionScreen';
import { AttributionScreen } from './screens/AttributionScreen';
import { EvidenceChainScreen } from './screens/EvidenceChainScreen';
import { ReportScreen } from './screens/InvestigationReportScreen';
import { StatusScreen } from './screens/DataSystemStatusScreen';
import { fetchInvestigationsList, fetchFullInvestigation, seedDemoData } from '../api';
import type { Investigation } from '../types/investigation';
import { INCIDENT_REGISTRY } from '../data/incidentRegistry';

export function AppShell() {
  const [screen, setScreen] = useState<ScreenId>('monitoring');
  const [activeIncidentId, setActiveIncidentId] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [investigationsList, setInvestigationsList] = useState<any[]>([]);
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadList() {
      try {
        let list = await fetchInvestigationsList();
        if (list.length === 0) {
          // Seed demo data if DB is empty
          await seedDemoData();
          list = await fetchInvestigationsList();
        }
        setInvestigationsList(list);
        if (list.length > 0 && !activeIncidentId) {
          setActiveIncidentId(list[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch investigations", err);
      }
    }
    loadList();
  }, []);

  useEffect(() => {
    async function loadActive() {
      if (!activeIncidentId) return;
      setLoading(true);
      try {
        const data = await fetchFullInvestigation(activeIncidentId);
        setInvestigation(data);
      } catch (err) {
        console.error("Failed to fetch full investigation", err);
        // Fallback to mock data on error
        setInvestigation(INCIDENT_REGISTRY['slick-2026-0042']);
      }
      setLoading(false);
    }
    loadActive();
  }, [activeIncidentId]);

  const handleSelectIncident = (id: string) => {
    // If id is a mock ID like slick-2026-0042, find the actual UUID from the backend list
    const realInv = investigationsList.find(inv => 
      inv.id === id || 
      (inv.pipeline_params && inv.pipeline_params.case_id === id)
    );
    setActiveIncidentId(realInv ? realInv.id : id);
    setScreen('overview');
  };

  const renderScreen = () => {
    if (screen === 'monitoring') {
      return (
        <RegionalMonitoringScreen
          onSelectIncident={handleSelectIncident}
          onToggleMenu={() => setIsMenuOpen(prev => !prev)}
        />
      );
    }

    if (loading || !investigation) {
      return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>Loading backend investigation data...</div>;
    }

    switch (screen) {
      case 'overview':
        return <OverviewScreen investigation={investigation} />;
      case 'spill-detection':
        return <SpillDetectionScreen investigation={investigation} />;
      case 'reconstruction':
        return <ReconstructionScreen investigation={investigation} />;
      case 'vessel-attribution':
        return <AttributionScreen investigation={investigation} onNavigateEvidence={() => setScreen('evidence-chain')} />;
      case 'evidence-chain':
        return <EvidenceChainScreen investigation={investigation} />;
      case 'report':
        return <ReportScreen investigation={investigation} />;
      case 'status':
        return <StatusScreen investigation={investigation} />;
      default:
        return <div>Unknown Screen</div>;
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      {/* Translucent overlay drawer */}
      <Sidebar
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        current={screen}
        onNavigate={s => {
          setScreen(s);
          setIsMenuOpen(false);
        }}
        activeInvestigation={investigation}
      />

      {/* Main Full-Width Application View */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
        {screen !== 'monitoring' && investigation && (
          <CaseHeader
            investigation={investigation}
            allIncidents={investigationsList.map(inv => ({ id: inv.id, code: inv.name, locationName: inv.region } as Investigation))}
            onSelectIncident={id => {
              setActiveIncidentId(id);
            }}
            onGoToMonitoring={() => setScreen('monitoring')}
            onToggleMenu={() => setIsMenuOpen(prev => !prev)}
          />
        )}
        <main style={{ flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}

