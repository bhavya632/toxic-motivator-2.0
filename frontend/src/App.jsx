import { useState, useEffect, useRef, useCallback } from 'react';
import ModeSelector, { MODES } from './components/ModeSelector.jsx';
import RageMeter from './components/RageMeter.jsx';
import AchievementToast from './components/AchievementToast.jsx';
import ExcuseHistory from './components/ExcuseHistory.jsx';

const WEAKNESS_COLORS = {
  3: '#44ff88',
  4: '#ffcc00',
  6: '#ff8800',
  8: '#ff4400',
  10: '#ff0022',
};

function parseSSEChunk(raw) {
  return raw
    .split('\n')
    .filter((line) => line.startsWith('data: '))
    .map((line) => {
      try { return JSON.parse(line.slice(6)); } catch { return null; }
    })
    .filter(Boolean);
}

export default function App() {
  const [sessionId, setSessionId] = useState(null);
  const [mode, setMode] = useState('gym-bro');
  const [excuse, setExcuse] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [streaming, setStreaming] = useState(false);

  const [toxicityLevel, setToxicityLevel] = useState(1);
  const [shameScore, setShameScore] = useState(0);
  const [excuseCount, setExcuseCount] = useState(0);

  const [weaknessBadge, setWeaknessBadge] = useState(null);
  const [personaMeta, setPersonaMeta] = useState(null);
  const [currentWeakness, setCurrentWeakness] = useState(null);

  const [achievements, setAchievements] = useState([]);
  const [toastQueue, setToastQueue] = useState([]);
  const [excuseHistory, setExcuseHistory] = useState([]);

  const analyzeTimeout = useRef(null);
  const responseRef = useRef('');
  const readerRef = useRef(null);

  // Initialize session
  useEffect(() => {
    fetch('/api/session', { method: 'POST' })
      .then((r) => r.json())
      .then(({ sessionId }) => setSessionId(sessionId))
      .catch(console.error);
  }, []);

  // Live-analyze excuse weakness as user types
  const analyzeExcuse = useCallback((text) => {
    if (!text.trim() || text.length < 5) {
      setWeaknessBadge(null);
      return;
    }
    clearTimeout(analyzeTimeout.current);
    analyzeTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ excuse: text }),
        });
        const data = await res.json();
        setWeaknessBadge(data);
      } catch { /* ignore */ }
    }, 400);
  }, []);

  const handleExcuseChange = (e) => {
    setExcuse(e.target.value);
    analyzeExcuse(e.target.value);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!excuse.trim() || loading) return;

    // Abort any prior stream
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }

    setLoading(true);
    setStreaming(true);
    setResponse('');
    responseRef.current = '';

    const submittedExcuse = excuse;
    setExcuse('');
    setWeaknessBadge(null);

    try {
      const res = await fetch('/api/motivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excuse: submittedExcuse, sessionId, mode }),
      });

      const reader = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = parseSSEChunk(buffer);
        buffer = '';

        for (const event of events) {
          if (event.type === 'meta') {
            setToxicityLevel(event.toxicityLevel);
            setShameScore(event.shameScore);
            setExcuseCount(event.excuseCount);
            setPersonaMeta(event.persona);
            setCurrentWeakness(event.weaknessRating);
            setLoading(false);

            if (event.newAchievements?.length > 0) {
              setAchievements((prev) => [...prev, ...event.newAchievements]);
              setToastQueue((prev) => [...prev, ...event.newAchievements]);
            }

            setExcuseHistory((prev) => [
              ...prev,
              { text: submittedExcuse, shame: event.weaknessRating?.rating * 5 || 10 },
            ]);
          } else if (event.type === 'text') {
            responseRef.current += event.content;
            setResponse(responseRef.current);
          } else if (event.type === 'done') {
            setStreaming(false);
            readerRef.current = null;
          } else if (event.type === 'error') {
            setResponse(event.content);
            setStreaming(false);
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setResponse('Connection failed. The AI is ignoring you too.');
      }
      setStreaming(false);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const dismissToast = (index) => {
    setToastQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const isChaos = toxicityLevel >= 10;
  const currentPersona = MODES.find((m) => m.id === mode);

  return (
    <div className={`app ${isChaos ? 'chaos-mode' : ''}`}>
      {isChaos && <div className="chaos-overlay" />}

      <AchievementToast queue={toastQueue} onDismiss={dismissToast} />

      {/* Header */}
      <header className="header">
        <div className="title-wrap">
          <h1 className="title" data-text="TOXIC MOTIVATOR 2.0">
            TOXIC MOTIVATOR 2.0
          </h1>
        </div>
        <p className="subtitle">AI-POWERED PERSONALIZED SHAME ENGINE · NO MERCY EDITION</p>
      </header>

      {/* Mode Selector */}
      <ModeSelector selectedMode={mode} onSelect={setMode} disabled={streaming} />

      {/* Stats */}
      <div className="stats-panel">
        <div className="stat-card">
          <div className="stat-label">Shame Score</div>
          <div className="stat-value shame">{shameScore}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Toxicity</div>
          <div className="stat-value toxicity">{toxicityLevel}/10</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Excuses</div>
          <div className="stat-value count">{excuseCount}</div>
        </div>
      </div>

      {/* Rage Meter */}
      <RageMeter toxicityLevel={toxicityLevel} />

      {/* Input */}
      <section className="input-section">
        <div className="weakness-indicator">
          {weaknessBadge && (
            <span
              className="weakness-badge"
              style={{ '--badge-color': WEAKNESS_COLORS[weaknessBadge.rating] || '#ff0022' }}
            >
              {weaknessBadge.label}
            </span>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          <textarea
            className="excuse-input"
            value={excuse}
            onChange={handleExcuseChange}
            onKeyDown={handleKeyDown}
            placeholder={`Type your pathetic excuse here...\n(Ctrl+Enter to submit)`}
            disabled={streaming}
            maxLength={500}
          />
          <button
            type="submit"
            className={`submit-btn ${loading ? 'loading' : ''}`}
            disabled={streaming || !excuse.trim()}
          >
            {streaming ? 'RECEIVING DAMAGE...' : loading ? 'SUMMONING SHAME...' : 'DESTROY MY EXCUSE'}
          </button>
        </form>
      </section>

      {/* Response */}
      <section className="response-section">
        {response || streaming ? (
          <div className="response-card">
            <div
              className="response-header"
              style={{ '--persona-color': personaMeta?.color || currentPersona?.color || '#ff0022' }}
            >
              <span className="persona-emoji">{personaMeta?.emoji || currentPersona?.emoji}</span>
              <span className="persona-name">{personaMeta?.name || currentPersona?.name}</span>
              {currentWeakness && (
                <span
                  className="weakness-tag"
                  style={{
                    color: WEAKNESS_COLORS[currentWeakness.rating] || '#ff0022',
                  }}
                >
                  {currentWeakness.label}
                </span>
              )}
            </div>
            <div className={`response-body ${isChaos ? 'chaos' : ''}`}>
              {response}
              {streaming && <span className="cursor" />}
            </div>
          </div>
        ) : (
          <div className="response-card">
            <div className="empty-state">
              {excuseCount === 0
                ? `Give me your best excuse.\nI will destroy it.\n\nSelect a tormentor above and start typing.`
                : `Submit another excuse.\nThe shame engine is hungry.`}
            </div>
          </div>
        )}
      </section>

      {/* Achievements earned */}
      {achievements.length > 0 && (
        <div className="achievement-list">
          <div className="achievement-list-header">SHAME ACHIEVEMENTS UNLOCKED</div>
          <div className="achievements-grid">
            {achievements.map((a, i) => (
              <div key={a.id + i} className="achievement-chip">
                <span className="achievement-chip-icon">{a.icon}</span>
                <div>
                  <div className="achievement-chip-name">{a.name}</div>
                  <div className="achievement-chip-text">{a.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Excuse history */}
      <ExcuseHistory excuses={excuseHistory} />

      <footer className="footer">
        TOXIC MOTIVATOR 2.0 · SHAME SCORE NEVER RESETS · MERCY: DISABLED
      </footer>
    </div>
  );
}
