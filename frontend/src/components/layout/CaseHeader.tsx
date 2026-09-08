import { Globe, ChevronDown, ArrowLeft, ShieldCheck, Menu } from 'lucide-react';
import type { Investigation } from '../../types/investigation';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';

interface CaseHeaderProps {
  investigation: Investigation;
  allIncidents: Investigation[];
  onSelectIncident: (id: string) => void;
  onGoToMonitoring: () => void;
  onToggleMenu?: () => void;
  isMonitoringView?: boolean;
}

export function CaseHeader({
  investigation,
  allIncidents,
  onSelectIncident,
  onGoToMonitoring,
  onToggleMenu,
}: CaseHeaderProps) {
  return (
    <header
      style={{
        height: 52,
        flexShrink: 0,
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        fontSize: 12,
        gap: 16,
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
      }}
    >
      {/* Left: Menu button + Return to radar + Incident switcher & observation info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onToggleMenu && (
          <button
            onClick={onToggleMenu}
            aria-label="Open Features Menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '6px 10px',
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
            <span>Menu</span>
          </button>
        )}

        <button
          onClick={onGoToMonitoring}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 6,
            padding: '6px 12px',
            color: '#1d4ed8',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-ui)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#dbeafe';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = '#eff6ff';
          }}
        >
          <ArrowLeft size={14} />
          <Globe size={14} />
          <span>Live Maritime Radar</span>
        </button>

        <span style={{ color: '#cbd5e1', fontWeight: 300 }}>|</span>

        {/* Dropdown for incident selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Case Dossier:
          </span>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <select
              value={investigation.id}
              onChange={e => onSelectIncident(e.target.value)}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                color: '#0f172a',
                padding: '6px 30px 6px 10px',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-ui)',
                cursor: 'pointer',
                appearance: 'none',
                outline: 'none',
              }}
            >
              {allIncidents.map(inc => (
                <option key={inc.id} value={inc.id}>
                  {inc.code} — {inc.locationName}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              style={{
                position: 'absolute',
                right: 8,
                pointerEvents: 'none',
                color: '#64748b',
              }}
            />
          </div>
        </div>

        <span style={{ color: '#cbd5e1', fontWeight: 300 }}>·</span>

        <span style={{ color: '#64748b', fontSize: 12 }}>
          Observation: <strong style={{ color: '#0f172a' }}>{investigation.spillDetection.observation.satellite}</strong> ({investigation.spillDetection.observation.polarization}) at{' '}
          <span className="data">{investigation.observationTimestamp.replace('T', ' ').replace('Z', ' UTC')}</span>
        </span>
      </div>

      {/* Right: Data Verification Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            fontWeight: 600,
            color: '#15803d',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 6,
            padding: '4px 10px',
          }}
        >
          <ShieldCheck size={14} />
          <span>Forensically Validated Evidence</span>
        </div>

        <ConfidenceIndicator level={investigation.status} size="sm" />

        {/* Delete Investigation Button */}
        <button
          onClick={async () => {
            if (confirm('Are you sure you want to delete this investigation and all its artifacts?')) {
               const { deleteInvestigation } = await import('../../api');
               await deleteInvestigation(investigation.id);
               window.location.reload();
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 6,
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#ef4444',
            cursor: 'pointer',
            marginLeft: 8,
          }}
          title="Delete Investigation"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    </header>
  );
}
