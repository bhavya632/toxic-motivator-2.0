# TOXIC MOTIVATOR

> An AI-powered chaos engine that destroys your excuses with personalized, increasingly unhinged attacks.

![Mercy](https://img.shields.io/badge/mercy-DISABLED-black)
![Shame](https://img.shields.io/badge/shame-MAXIMUM-red)

---

## What is this

You type an excuse. Pick a persona. An AI destroys it — referencing your past excuses to make each attack more personal. Every submission also gets an AI-generated breakdown rating how pathetic, lazy, unbelievable, and uncreative your excuse actually is.

Built for hackathon. Zero mercy. All chaos.

---

## Features

- **5 Toxic Personas** — each with a distinct personality and randomized attack angles per request
  - 🏋️ CHAD THUNDERCOCK — Aggressive gym bro who hasn't missed a workout in 8 years
  - 🪖 SGT. PAINSWORTH — 30-year Marine veteran with zero tolerance for civilian weakness
  - 😤 THE DISAPPOINTED ONE — Passive-aggressive parent who sacrificed everything for this
  - 💼 BRENDAN "GRINDSET" MAXWELL — Toxic hustle culture guru with 3 Lamborghinis
  - 🤖 NEMESIS-7 — Sentient evil AI that calculates your probability of success at zero

- **AI Excuse Analysis** — Every excuse gets scored by Groq across 5 dimensions: Shame (0–100), Pathetic (1–10), Laziness (1–10), Believability (1–10), Creativity (1–10), plus a one-line AI verdict

- **Randomized Attack Angles** — Each persona draws from a pool of distinct attack vectors so responses never repeat the same opener

- **Streaming Responses** — Token-by-token via Server-Sent Events, so every word lands in real time

- **Glitch UI** — CSS glitch title animation, scanline overlay, chaos mode at high toxicity

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
git clone https://github.com/bhavya632/toxic-motivator
cd toxic-motivator

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

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:5173`

---

## Project Structure

```
toxic-motivator/
├── .env                          # API keys (not committed)
├── package.json                  # Root — runs both servers via concurrently
├── backend/
│   ├── server.js                 # Express server, SSE streaming, session management
│   ├── personas.js               # 5 personas with randomized attack angle pools
│   ├── gameEngine.js             # Session state, excuse categorization
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx               # Main app, SSE consumer, session state
    │   ├── App.css               # Glitch animations, chaos mode
    │   └── components/
    │       ├── ModeSelector.jsx      # Persona picker with color-coded glow
    │       ├── ExcuseAnalysis.jsx    # AI-scored metric bars per excuse
    │       └── AchievementToast.jsx  # Pop-in achievement notifications
    ├── vite.config.js            # Proxies /api to backend
    └── index.html
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/session` | Create a new session |
| `GET` | `/api/session/:id` | Get session state |
| `POST` | `/api/analyze` | Pattern-based excuse preview (live typing) |
| `POST` | `/api/motivate` | AI excuse analysis + streaming roast via SSE |
| `GET` | `/api/leaderboard` | Sessions ranked by shame score |

---

## How the Analysis Works

On every submission, two Groq calls run in parallel:

1. **Motivation stream** — the selected persona roasts the excuse token-by-token
2. **Excuse analysis** — a separate JSON-mode call scores the excuse across 5 dimensions

The analysis prompt is rigged: creativity and believability are always scored low (1–3 and 1–4), while shame, pathetic, and laziness are always scored high (75–100 and 7–10). Because no excuse deserves mercy.

The persona prompt is rebuilt each request with a randomly selected attack angle, so responses stay varied.

---

## License

MIT. Use responsibly. Or don't. The shame engine doesn't care.
