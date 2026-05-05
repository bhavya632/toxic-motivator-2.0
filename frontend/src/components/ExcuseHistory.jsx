import { useState } from 'react';

export default function ExcuseHistory({ excuses }) {
  const [open, setOpen] = useState(false);
  if (excuses.length === 0) return null;

  return (
    <div className="history-section">
      <button className="history-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? '▲ HIDE' : '▼ SHOW'} EXCUSE HISTORY ({excuses.length})
      </button>
      {open && (
        <div className="history-list">
          {excuses.map((ex, i) => (
            <div key={i} className="history-item">
              <span className="history-num">#{i + 1}</span>
              <span className="history-text">{ex.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
