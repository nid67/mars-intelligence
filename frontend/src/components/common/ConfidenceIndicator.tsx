import type { ConfidenceLevel, AssessmentQualitative } from '../../types/investigation';

/*
  ConfidenceIndicator — replaces the old glowing-pill StatusBadge.
  Shows a small colored dot + plain text.  Color comes from the 3-token
  semantic system (confirmed / uncertain / alert).
*/

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel | AssessmentQualitative | string;
  showLabel?: boolean;    // default true
  size?: 'sm' | 'md';
}

export function ConfidenceIndicator({ level, showLabel = true, size = 'md' }: ConfidenceIndicatorProps) {
  const upper = level.toUpperCase();

  let dotColor = 'var(--text-secondary)';
  let dotStyle: 'solid' | 'ring' | 'dashed' = 'solid';
  let label = level;

  if (upper === 'HIGH' || upper === 'STRONG') {
    dotColor = 'var(--confirmed)';
    dotStyle = 'solid';
    label = upper === 'HIGH' ? 'High' : 'Strong';
  } else if (upper === 'MODERATE') {
    dotColor = 'var(--uncertain)';
    dotStyle = 'ring';
    label = 'Moderate';
  } else if (upper === 'LOW' || upper === 'WEAK') {
    dotColor = 'var(--uncertain)';
    dotStyle = 'dashed';
    label = upper === 'LOW' ? 'Low' : 'Weak';
  } else if (upper === 'INSUFFICIENT') {
    dotColor = 'var(--text-secondary)';
    dotStyle = 'dashed';
    label = 'Insufficient';
  } else if (upper === 'INVESTIGATION COMPLETE') {
    dotColor = 'var(--confirmed)';
    dotStyle = 'solid';
    label = 'Complete';
  }

  const dotSize = size === 'sm' ? 6 : 8;

  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: size === 'sm' ? 4 : 6 }}
    >
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          flexShrink: 0,
          ...(dotStyle === 'solid'
            ? { background: dotColor }
            : dotStyle === 'ring'
            ? { background: 'transparent', border: `1.5px solid ${dotColor}` }
            : { background: 'transparent', border: `1.5px dashed ${dotColor}` }
          ),
        }}
      />
      {showLabel && (
        <span
          style={{
            fontSize: size === 'sm' ? 11 : 12,
            color: dotColor,
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
