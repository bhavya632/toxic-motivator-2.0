const METRICS = [
  { key: 'shame',        label: 'SHAME',         max: 100, bad: 'high' },
  { key: 'pathetic',     label: 'PATHETIC',       max: 10,  bad: 'high' },
  { key: 'laziness',     label: 'LAZINESS',       max: 10,  bad: 'high' },
  { key: 'believability',label: 'BELIEVABILITY',  max: 10,  bad: 'low'  },
  { key: 'creativity',   label: 'CREATIVITY',     max: 10,  bad: 'low'  },
];

function barColor(value, max, bad) {
  const t = value / max;
  // bad=high: low value = green, high = red
  // bad=low:  high value = green, low = red
  const badness = bad === 'high' ? t : 1 - t;
  const r = Math.round(255 * Math.min(1, badness * 2));
  const g = Math.round(255 * Math.min(1, (1 - badness) * 2));
  return `rgb(${r},${g},30)`;
}

function MetricBar({ label, value, max, bad }) {
  const pct = Math.round((value / max) * 100);
  const color = barColor(value, max, bad);
  return (
    <div className="analysis-metric">
      <span className="analysis-metric-label">{label}</span>
      <div className="analysis-track">
        <div
          className="analysis-fill"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
      <span className="analysis-metric-val" style={{ color }}>
        {value}/{max}
      </span>
    </div>
  );
}

export default function ExcuseAnalysis({ analysis }) {
  if (!analysis) return null;
  return (
    <div className="excuse-analysis">
      <div className="analysis-header">
        <span className="analysis-title">EXCUSE ANALYSIS</span>
        {analysis.category && (
          <span className="analysis-category">{analysis.category.toUpperCase()}</span>
        )}
      </div>
      <div className="analysis-metrics">
        {METRICS.map((m) => (
          <MetricBar key={m.key} label={m.label} value={analysis[m.key]} max={m.max} bad={m.bad} />
        ))}
      </div>
      {analysis.verdict && (
        <div className="analysis-verdict">"{analysis.verdict}"</div>
      )}
    </div>
  );
}
