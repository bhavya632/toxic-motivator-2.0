const LEVEL_LABELS = {
  1: 'MILDLY ANNOYED',
  2: 'DISAPPOINTED',
  3: 'ANGRY',
  4: 'FURIOUS',
  5: 'ENRAGED',
  6: 'LIVID',
  7: 'FERAL',
  8: 'UNHINGED',
  9: 'APOCALYPTIC',
  10: '⚠ CHAOS MODE ⚠',
};

function getSegmentColor(index, toxicityLevel) {
  if (index >= toxicityLevel) return null;
  const t = index / 9;
  if (t < 0.4) return '#ff8800';
  if (t < 0.7) return '#ff4400';
  return '#ff0022';
}

export default function RageMeter({ toxicityLevel }) {
  return (
    <div className="rage-meter">
      <div className="rage-label">
        <span>TOXICITY LEVEL</span>
        <span className="rage-level-text">
          {LEVEL_LABELS[toxicityLevel] || 'UNKNOWN'} [{toxicityLevel}/10]
        </span>
      </div>
      <div className="rage-segments">
        {Array.from({ length: 10 }, (_, i) => {
          const color = getSegmentColor(i, toxicityLevel);
          return (
            <div
              key={i}
              className={`rage-segment ${color ? 'active' : ''}`}
              style={{ '--seg-color': color || 'transparent' }}
              title={`Level ${i + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
