import {
  Globe,
  LayoutDashboard,
  Radar,
  Compass,
  Ship,
  GitBranch,
  FileText,
  Database,
  X,
  ChevronRight,
} from 'lucide-react';
import type { Investigation } from '../../types/investigation';

export type ScreenId =
  | 'monitoring'
  | 'overview'
  | 'spill-detection'
  | 'reconstruction'
  | 'vessel-attribution'
  | 'evidence-chain'
  | 'report'
  | 'status';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  current: ScreenId;
  onNavigate: (id: ScreenId) => void;
  activeInvestigation: Investigation | null;
}

const PRIMARY_FEATURES: { id: ScreenId; label: string; description: string; icon: typeof Globe }[] = [
  {
    id: 'monitoring',
    label: 'Live Maritime Radar & Spill Simulation',
    description: 'Real-time Indian EEZ traffic, anomaly triggers & particle drift',
    icon: Globe,
  },
];

const INVESTIGATION_FEATURES: { id: ScreenId; label: string; description: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Case Situation Room', description: 'Executive incident summary & candidate shortlist', icon: LayoutDashboard },
  { id: 'spill-detection', label: 'SAR & Spill Detection', description: 'Sentinel-1 SAR analysis & slick classification', icon: Radar },
  { id: 'reconstruction', label: 'Backward Drift & Origin Reversal', description: 'Lagrangian reverse particle trajectory modelling', icon: Compass },
  { id: 'vessel-attribution', label: 'Vessel Attribution & Ranking', description: 'Multi-criteria AIS candidate scoring matrix', icon: Ship },
  { id: 'evidence-chain', label: 'Evidence Chain & Legal Audit', description: 'Tamper-evident spatiotemporal forensic proof', icon: GitBranch },
  { id: 'report', label: 'Official Investigation Report', description: 'Executive summary & downloadable PDF dossier', icon: FileText },
  { id: 'status', label: 'Sensor Feeds & Data Health', description: 'Sentinel-1 Copernicus & AIS station uptime', icon: Database },
];

export function Sidebar({
  isOpen,
  onClose,
  current,
  onNavigate,
}: SidebarProps) {
  return (
    <>
      {/* ── BACKDROP OVERLAY ── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.35)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* ── TRANSLUCENT SLIDE-OVER DRAWER ── */}
      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 340,
          zIndex: 9999,
          background: 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRight: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '8px 0 32px rgba(15, 23, 42, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          userSelect: 'none',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: 1, color: '#1d4ed8' }}>
                MARS
              </span>
              <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>
                INTELLIGENCE
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontWeight: 500 }}>
              Platform Navigation & Features
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close navigation"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 6,
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              color: '#475569',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#e2e8f0';
              (e.currentTarget as HTMLButtonElement).style.color = '#0f172a';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9';
              (e.currentTarget as HTMLButtonElement).style.color = '#475569';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Features Navigation List */}
        <div style={{ flex: 1, padding: '14px 14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Section: Live Surveillance */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, paddingLeft: 6 }}>
              Live Surveillance
            </div>
            {PRIMARY_FEATURES.map(f => {
              const active = current === f.id;
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    onNavigate(f.id);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: active ? '#eff6ff' : 'rgba(255, 255, 255, 0.7)',
                    border: `1px solid ${active ? '#93c5fd' : 'rgba(226, 232, 240, 0.7)'}`,
                    borderLeft: `3px solid ${active ? '#2563eb' : 'transparent'}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    boxShadow: active ? '0 1px 3px rgba(37,99,235,0.08)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc';
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.7)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div
                      style={{
                        padding: 6,
                        borderRadius: 6,
                        background: active ? '#dbeafe' : '#f1f5f9',
                        color: active ? '#1d4ed8' : '#64748b',
                        marginTop: 1,
                      }}
                    >
                      <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: active ? '#1d4ed8' : '#0f172a' }}>
                        {f.label}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2, lineHeight: 1.3 }}>
                        {f.description}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={14} color={active ? '#1d4ed8' : '#94a3b8'} />
                </button>
              );
            })}
          </div>

          {/* Section: Investigation Phases */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, paddingLeft: 6 }}>
              Forensic Investigation Modules
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {INVESTIGATION_FEATURES.map(f => {
                const active = current === f.id;
                const Icon = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={() => {
                      onNavigate(f.id);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 8,
                      background: active ? '#eff6ff' : 'rgba(255, 255, 255, 0.7)',
                      border: `1px solid ${active ? '#93c5fd' : 'rgba(226, 232, 240, 0.7)'}`,
                      borderLeft: `3px solid ${active ? '#2563eb' : 'transparent'}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      boxShadow: active ? '0 1px 3px rgba(37,99,235,0.08)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc';
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.7)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div
                        style={{
                          padding: 6,
                          borderRadius: 6,
                          background: active ? '#dbeafe' : '#f1f5f9',
                          color: active ? '#1d4ed8' : '#64748b',
                          marginTop: 1,
                        }}
                      >
                        <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: active ? '#1d4ed8' : '#0f172a' }}>
                          {f.label}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 1, lineHeight: 1.3 }}>
                          {f.description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} color={active ? '#1d4ed8' : '#94a3b8'} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

