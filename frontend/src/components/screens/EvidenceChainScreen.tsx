import { useState, useEffect } from 'react';
import type { Investigation } from '../../types/investigation';
import { ConfidenceIndicator } from '../common/ConfidenceIndicator';
import { ShieldCheck, Hash } from 'lucide-react';

interface Props {
  investigation: Investigation;
}

export function EvidenceChainScreen({ investigation }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const chain = investigation.evidenceChain;

  useEffect(() => {
    setSelectedIdx(0);
  }, [investigation.id]);

  const selected = chain[selectedIdx] || chain[0] || {
    id: '',
    nodeId: 'SAT',
    title: 'Evidence Node',
    source: '',
    timestamp: '',
    derivedValue: '',
    confidence: 'INSUFFICIENT',
    methodology: '',
    supportingDetails: [],
    limitations: [],
    auditableHash: '',
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#f8fafc' }}>
      {/* Left: chain list */}
      <div
        style={{
          width: 380,
          flexShrink: 0,
          borderRight: '1px solid var(--chart-line)',
          background: '#ffffff',
          overflowY: 'auto',
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
            Forensic Evidence Graph
          </h3>
          <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, background: '#f0fdf4', padding: '2px 6px', borderRadius: 4, border: '1px solid #bbf7d0' }}>
            <ShieldCheck size={13} /> AUDIT PROOF
          </span>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Chain-of-custody trace linking satellite SAR acquisition, slick morphological extraction, hydrodynamic drift, AIS tracks, and vessel attribution.
        </p>

        <div style={{ position: 'relative', paddingLeft: 20 }}>
          {/* Connecting line */}
          <div
            style={{
              position: 'absolute',
              top: 16,
              bottom: 16,
              left: 9,
              width: 2,
              background: '#e2e8f0',
            }}
          />

          {chain.map((item, idx) => {
            const sel = idx === selectedIdx;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedIdx(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  marginBottom: 6,
                  border: `1px solid ${sel ? '#bfdbfe' : '#e2e8f0'}`,
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: sel ? '#eff6ff' : '#ffffff',
                  borderLeft: sel ? '3px solid #2563eb' : '1px solid #e2e8f0',
                  fontFamily: 'var(--font-ui)',
                  position: 'relative',
                  transition: 'all 0.1s',
                }}
              >
                {/* Node dot */}
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    flexShrink: 0,
                    marginTop: 3,
                    position: 'relative',
                    zIndex: 1,
                    ...(sel
                      ? { background: '#2563eb', boxShadow: '0 0 0 3px #dbeafe' }
                      : { background: '#ffffff', border: '2px solid #94a3b8' }),
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: sel ? 700 : 600,
                      color: sel ? '#1d4ed8' : '#0f172a',
                    }}
                  >
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {item.derivedValue}
                  </div>
                </div>
                <ConfidenceIndicator level={item.confidence} size="sm" showLabel={false} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: selected node detail */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 760, background: '#ffffff', padding: 28, borderRadius: 8, border: '1px solid var(--chart-line)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
              {selected.title}
            </h3>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-data)', color: '#2563eb', fontWeight: 600 }}>
              Node ID: {selected.nodeId}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}
          >
            <ConfidenceIndicator level={selected.confidence} size="sm" />
            <span>·</span>
            <span>{selected.source}</span>
          </div>

          {/* Provenance grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 16,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              padding: 16,
              marginBottom: 20,
              fontSize: 12,
            }}
          >
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Origin Feed / Sensor</div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{selected.source}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Acquisition / Run Timestamp</div>
              <div className="data" style={{ fontSize: 11, color: '#0f172a' }}>{selected.timestamp}</div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 4, fontWeight: 600 }}>Derived Forensics Value</div>
              <div style={{ fontWeight: 700, color: '#1d4ed8' }}>{selected.derivedValue}</div>
            </div>
          </div>

          {/* Methodology */}
          <h4 style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Processing Methodology & Scientific Theory
          </h4>
          <p style={{ margin: '0 0 16px', fontSize: 12, lineHeight: 1.6, color: '#334155' }}>
            {selected.methodology}
          </p>

          {/* Supporting details */}
          <h4 style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Supporting Observational Proofs
          </h4>
          <ul style={{ margin: '0 0 16px', paddingLeft: 18, fontSize: 12, lineHeight: 1.6, color: '#1e293b' }}>
            {selected.supportingDetails.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>

          {/* Limitations */}
          <h4 style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Limitations & Epistemic Uncertainty
          </h4>
          <ul style={{ margin: '0 0 16px', paddingLeft: 18, fontSize: 12, lineHeight: 1.6, color: '#475569' }}>
            {selected.limitations.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>

          {/* Audit hash */}
          <div
            style={{
              borderTop: '1px solid var(--chart-line)',
              paddingTop: 14,
              fontSize: 11,
              color: 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Hash size={13} color="#2563eb" />
              <span>Cryptographic Chain Audit Hash</span>
            </span>
            <span className="data" style={{ fontSize: 11, color: '#0f172a', fontWeight: 600 }}>
              {selected.auditableHash}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
