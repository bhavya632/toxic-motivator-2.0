import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { v4 as uuidv4 } from 'uuid';
import {
  calculateExcuseShame,
  calculateToxicityLevel,
  checkAchievements,
  getWeaknessRating,
  createSession,
} from './gameEngine.js';
import { PERSONAS } from './personas.js';

dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY });

// In-memory session store — intentionally ephemeral for chaos
const sessions = new Map();

function getOrCreateSession(sessionId) {
  if (!sessionId || !sessions.has(sessionId)) {
    const id = uuidv4();
    sessions.set(id, createSession());
    return { id, session: sessions.get(id) };
  }
  return { id: sessionId, session: sessions.get(sessionId) };
}

// POST /api/session — initialize a session
app.post('/api/session', (req, res) => {
  const id = uuidv4();
  sessions.set(id, createSession());
  res.json({ sessionId: id });
});

// GET /api/session/:id — get current shame stats
app.get('/api/session/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  res.json({
    excuseCount: session.excuseCount,
    shameScore: session.shameScore,
    toxicityLevel: session.toxicityLevel,
    achievements: session.allAchievements,
    recentExcuses: session.recentExcuses.slice(-5),
    excuseCategories: session.excuseCategories,
  });
});

async function analyzeExcuse(excuse) {
  const result = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 200,
    temperature: 0.7,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a brutal excuse analyst. Every excuse ever made by a human is pathetic, unbelievable, and unoriginal. Given an excuse, return ONLY valid JSON with exactly these fields:
{
  "shame": <integer 75-100, always high — every excuse deserves maximum shame>,
  "pathetic": <integer 7-10, always high — all excuses are pathetic by definition>,
  "laziness": <integer 7-10, always high — making excuses IS laziness>,
  "believability": <integer 1-4, always low — no excuse is believable>,
  "creativity": <integer 1-3, always low — excuses are never creative, they're all the same tired nonsense>,
  "verdict": "<one savage sentence (max 12 words) judging this excuse>",
  "category": "<single word: gym | study | work | tired | mood | weather | procrastination | social | other>"
}
No explanation. No markdown. Only the JSON object.`,
      },
      { role: 'user', content: excuse },
    ],
  });
  return JSON.parse(result.choices[0].message.content);
}

// POST /api/analyze — live typing preview (fast, pattern-based)
app.post('/api/analyze', (req, res) => {
  const { excuse } = req.body;
  if (!excuse) return res.status(400).json({ error: 'No excuse provided' });
  const rating = getWeaknessRating(excuse);
  res.json(rating);
});

// POST /api/motivate — the main chaos stream endpoint
app.post('/api/motivate', async (req, res) => {
  const { excuse, sessionId, mode = 'gym-bro' } = req.body;

  if (!excuse || excuse.trim().length < 3) {
    return res.status(400).json({ error: 'Give me a real excuse to destroy.' });
  }

  const persona = PERSONAS[mode] || PERSONAS['gym-bro'];
  const { id, session } = getOrCreateSession(sessionId);

  // Update session state
  const { shame, categories } = calculateExcuseShame(excuse);
  session.lastExcuseShame = shame;
  session.prevToxicityLevel = session.toxicityLevel;
  session.shameScore += shame;
  session.excuseCount += 1;
  session.excuses.push({ text: excuse, timestamp: Date.now(), mode, shame });
  session.recentExcuses = session.excuses.slice(-6).map((e) => e.text);

  for (const [cat, count] of Object.entries(categories)) {
    session.excuseCategories[cat] = (session.excuseCategories[cat] || 0) + count;
  }

  session.toxicityLevel = calculateToxicityLevel(session.shameScore, session.excuseCount);

  const newAchievements = checkAchievements(session);
  session.allAchievements.push(...newAchievements);

  const systemPrompt = persona.buildPrompt(session);

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Run AI excuse analysis and motivation stream creation in parallel
  let excuseAnalysis = null;
  let stream;
  try {
    [excuseAnalysis, stream] = await Promise.all([
      analyzeExcuse(excuse),
      groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 300,
        temperature: 1.4,
        top_p: 0.9,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: excuse },
        ],
      }),
    ]);
  } catch (err) {
    console.error('Groq error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', content: err.message })}\n\n`);
    return res.end();
  }

  // Send metadata + AI excuse analysis before streaming the roast
  res.write(
    `data: ${JSON.stringify({
      type: 'meta',
      sessionId: id,
      toxicityLevel: session.toxicityLevel,
      shameScore: session.shameScore,
      excuseCount: session.excuseCount,
      excuseAnalysis,
      newAchievements,
      persona: { name: persona.name, emoji: persona.emoji, color: persona.color },
    })}\n\n`
  );

  try {
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
      }
    }
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Stream error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', content: err.message })}\n\n`);
    res.end();
  }
});

// GET /api/leaderboard — top shame scores across sessions (this session)
app.get('/api/leaderboard', (req, res) => {
  const entries = [...sessions.entries()]
    .map(([id, s]) => ({
      sessionId: id.slice(0, 8),
      shameScore: s.shameScore,
      excuseCount: s.excuseCount,
      toxicityLevel: s.toxicityLevel,
      achievements: s.allAchievements.length,
    }))
    .sort((a, b) => b.shameScore - a.shameScore)
    .slice(0, 10);

  res.json(entries);
});

const server = app.listen(PORT, () => {
  console.log(`\n💀 EXCUSE ME? BACKEND RUNNING`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Shame engines: ONLINE`);
  console.log(`   Mercy: DISABLED\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] Port ${PORT} is already in use.`);
    console.error(`  Fix: lsof -ti :${PORT} | xargs kill -9\n`);
    process.exit(1);
  }
  throw err;
});

// Graceful shutdown so node --watch restarts don't leave the port held open.
// closeAllConnections() drops all sockets immediately; the setTimeout is a
// hard deadline in case server.close() hangs on a stubborn SSE connection.
function shutdown() {
  server.closeAllConnections?.();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 300).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
