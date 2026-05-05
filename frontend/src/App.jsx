import { useState, useEffect, useRef, useCallback } from 'react';
import ModeSelector, { MODES } from './components/ModeSelector.jsx';
import AchievementToast from './components/AchievementToast.jsx';
import ExcuseAnalysis from './components/ExcuseAnalysis.jsx';

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
  const [excuseAnalysis, setExcuseAnalysis] = useState(null);

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
            setExcuseAnalysis(event.excuseAnalysis);
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
          <h1 className="title" data-text="EXCUSE ME?">
            EXCUSE ME?
          </h1>
        </div>
        <p className="subtitle">AI-POWERED PERSONALIZED SHAME ENGINE · NO MERCY EDITION</p>
      </header>

      {/* Mode Selector */}
      <ModeSelector selectedMode={mode} onSelect={setMode} disabled={streaming} />

      {/* Input */}
      <section className="input-section">
        <div className="weakness-indicator">
          {weaknessBadge && (
            <span className="weakness-badge" style={{ '--badge-color': '#ff8800' }}>
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
              {excuseAnalysis?.category && (
                <span className="weakness-tag" style={{ color: 'var(--orange)' }}>
                  {excuseAnalysis.category.toUpperCase()}
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

      {/* AI excuse analysis */}
      <ExcuseAnalysis analysis={excuseAnalysis} />


      <footer className="footer">
        EXCUSE ME? · SHAME SCORE NEVER RESETS · MERCY: DISABLED
      </footer>
    </div>
  );
}
