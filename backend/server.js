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

// POST /api/analyze — instantly rate the excuse weakness before motivating
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

  const weaknessRating = getWeaknessRating(excuse);
  const systemPrompt = persona.buildPrompt(session);

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // Send session metadata first
  res.write(
    `data: ${JSON.stringify({
      type: 'meta',
      sessionId: id,
      toxicityLevel: session.toxicityLevel,
      shameScore: session.shameScore,
      excuseCount: session.excuseCount,
      weaknessRating,
      newAchievements,
      persona: { name: persona.name, emoji: persona.emoji, color: persona.color },
    })}\n\n`
  );

  try {
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 300,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: excuse },
      ],
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Groq error:', err);
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

app.listen(PORT, () => {
  console.log(`\n💀 TOXIC MOTIVATOR 2.0 BACKEND RUNNING`);
  console.log(`   Port: ${PORT}`);
  console.log(`   Shame engines: ONLINE`);
  console.log(`   Mercy: DISABLED\n`);
});
