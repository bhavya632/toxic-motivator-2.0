# TOXIC MOTIVATOR 2.0

> An AI-powered chaos engine that learns to motivate you by being increasingly, personally toxic.

![Toxicity Level](https://img.shields.io/badge/toxicity-MAXIMUM-red)
![Mercy](https://img.shields.io/badge/mercy-DISABLED-black)
![Shame Score](https://img.shields.io/badge/shame_score-∞-darkred)

---

## What is this

You type an excuse. An AI destroys it. The more excuses you make, the higher your **Shame Score** climbs, the higher the **Toxicity Level** rises, and the more unhinged the AI becomes — referencing your entire excuse history to craft personalized, escalating attacks.

Built for hackathon. Zero mercy. All chaos.

---

## Features

- **5 Toxic Personas** — each with distinct personalities and escalating prompt engineering
  - 🏋️ CHAD THUNDERCOCK — Aggressive gym bro who hasn't missed a workout in 8 years
  - 🪖 SGT. PAINSWORTH — 30-year Marine veteran who has seen real suffering
  - 😤 THE DISAPPOINTED ONE — Passive-aggressive parent who sacrificed everything
  - 💼 BRENDAN "GRINDSET" MAXWELL — Toxic hustle culture guru with 3 Lamborghinis
  - 🤖 NEMESIS-7 — Sentient evil AI that calculates your probability of success at zero

- **Shame Engine** — 12 excuse categories (tired, busy, tomorrow, weather, gym, study, mood, distraction...) each carrying different shame point multipliers

- **Toxicity Level System** — 10 levels that escalate based on cumulative shame score and excuse count. At level 10: CHAOS MODE activates with screen shake, glitch effects, and full unhinged AI responses

- **Live Excuse Analysis** — Rates your excuse weakness in real-time as you type, before you even submit

- **12 Unlockable Shame Achievements** — Professional Procrastinator, Gym Card Collector, Tomorrow Never Comes, Century of Shame, CHAOS MODE UNLOCKED, and more

- **Streaming AI Responses** — Token-by-token via Server-Sent Events so you feel every word land

- **Session Memory** — The AI reads your full excuse history and references past failures in later responses

- **Glitch UI** — CSS glitch title animation, scanline overlay, rage meter with 10 colored segments, achievement toast notifications

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| AI | Groq API (`llama-3.3-70b-versatile`) |
| Streaming | Server-Sent Events (SSE) over fetch ReadableStream |
| Styling | Hand-crafted CSS with glitch animations |
| State | In-memory session store with UUID sessions |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Groq API key](https://console.groq.com)

### Setup

```bash
git clone https://github.com/bhavya632/toxic-motivator-2.0
cd toxic-motivator-2.0

# Install all dependencies
cd backend && npm install && cd ../frontend && npm install && cd .. && npm install
```

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
PORT=3001
```

### Run

```bash
npm run dev
```

This starts both servers concurrently:
- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`

---

## Project Structure

```
toxic-motivator-2.0/
├── .env                          # API keys (not committed)
├── package.json                  # Root — runs both servers via concurrently
├── backend/
│   ├── server.js                 # Express server, SSE streaming, session management
│   ├── personas.js               # 5 toxic AI personas with dynamic prompt builders
│   ├── gameEngine.js             # Shame scoring, toxicity calculation, achievements
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx               # Main app, SSE consumer, full session state
    │   ├── App.css               # Glitch animations, chaos mode, rage meter
    │   └── components/
    │       ├── RageMeter.jsx     # 10-segment toxicity visualizer
    │       ├── ModeSelector.jsx  # Persona picker with color-coded glow
    │       ├── AchievementToast.jsx  # Pop-in achievement notifications
    │       └── ExcuseHistory.jsx    # Collapsible shame log
    ├── vite.config.js            # Proxies /api to backend
    └── index.html
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/session` | Create a new shame session |
| `GET` | `/api/session/:id` | Get session stats (score, level, achievements) |
| `POST` | `/api/analyze` | Rate excuse weakness instantly (no AI call) |
| `POST` | `/api/motivate` | Stream toxic motivation via SSE |
| `GET` | `/api/leaderboard` | Top shame scores across active sessions |

---

## How the Shame Engine Works

Each excuse is pattern-matched against 12 categories:

| Category | Bonus Shame |
|---|---|
| Procrastination ("tomorrow", "later") | +25 |
| Entertainment ("Netflix", "phone") | +30 |
| Mood ("don't feel like it") | +20 |
| Time ("too busy") | +15 |
| Gym | +14 |
| Weather | +12 |
| Study | +11 |
| Sore | +9 |
| Tired | +8 |

Toxicity level = `floor(shameScore / 15) + floor(excuseCount / 2)`, capped at 10.

The AI prompt is rebuilt every request with current toxicity level, shame score, and recent excuse history — so responses become more personal and savage over time.

---

## License

MIT. Use responsibly. Or don't. The shame engine doesn't care.
