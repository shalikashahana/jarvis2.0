# JARVIS — Arc Reactor Voice Assistant Frontend

A premium, production-ready React web app for talking to your **JARVIS** AI voice assistant powered by [LiveKit Agents](https://docs.livekit.io/agents/). Features a stunning animated SVG Arc Reactor that responds to the assistant's state, live captions, and full conversation history via Supabase.

![JARVIS Screenshot](https://img.shields.io/badge/UI-Arc_Reactor_Theme-00D4FF?style=for-the-badge&logo=react)

## Features

- 🎙️ **One-click voice calls** — connect to your LiveKit Agent with a single button
- ⚡ **Animated Arc Reactor** — SVG centerpiece with 5 visual states (idle, listening, thinking, speaking, disconnected)
- 📝 **Live captions** — real-time rolling transcript of both user and assistant speech
- 🗂️ **Conversation history** — all sessions & messages stored in Supabase, browsable anytime
- 🔒 **Secure token flow** — LiveKit API secret never touches the client; tokens minted by a Supabase Edge Function
- 📱 **Fully responsive** — works on desktop (sidebar) and mobile (slide-over drawer)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS v4 + custom CSS animations |
| Voice Transport | `livekit-client` + `@livekit/components-react` |
| Database | Supabase (Postgres) |
| Token Server | Supabase Edge Function (Deno) |

---

## Setup Guide

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [LiveKit Cloud](https://cloud.livekit.io/) project with a deployed agent worker (`my-agent`)
- A [Supabase](https://supabase.com/) project
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for deploying the Edge Function)

### 1. Create the Supabase Database

1. Go to your Supabase project → **SQL Editor**
2. Paste the contents of [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
3. Click **Run** — this creates the `sessions` and `messages` tables with RLS policies

> ⚠️ **Security Note**: The default RLS policies allow the anon key full read/write access. This is fine for a single-user personal app. For wider deployment, add proper auth policies.

### 2. Deploy the Token Edge Function

```bash
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets for the Edge Function
supabase secrets set LIVEKIT_URL=wss://your-project.livekit.cloud
supabase secrets set LIVEKIT_API_KEY=your-api-key
supabase secrets set LIVEKIT_API_SECRET=your-api-secret

# Deploy the function
supabase functions deploy livekit-token --no-verify-jwt
```

The `--no-verify-jwt` flag allows the frontend to call the function without a Supabase auth token. For production, remove this flag and pass the user's auth token.

### 3. Configure the Frontend

```bash
# In the jarvis-frontend directory
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_TOKEN_ENDPOINT_URL=https://your-project.supabase.co/functions/v1/livekit-token
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
```

**Where to find these values:**
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`: Supabase Dashboard → Settings → API
- `VITE_TOKEN_ENDPOINT_URL`: Your Supabase project URL + `/functions/v1/livekit-token`
- `VITE_LIVEKIT_URL`: LiveKit Cloud Dashboard → your project's WebSocket URL

### 4. Run the Dev Server

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and click **"Activate Jarvis"** to start a voice call.

---

## Project Structure

```
jarvis-frontend/
├── src/
│   ├── components/
│   │   ├── ArcReactor.tsx        # Animated SVG reactor (5 states)
│   │   ├── ArcReactor.css        # CSS keyframes & custom properties
│   │   ├── CallControls.tsx      # Connect / Mute / Disconnect buttons
│   │   ├── LiveCaptions.tsx      # Rolling live transcript panel
│   │   ├── HistorySidebar.tsx    # Past sessions list
│   │   └── HistoryDetail.tsx     # Full transcript viewer modal
│   ├── hooks/
│   │   ├── useLiveKitToken.ts    # Fetches token from backend
│   │   └── useConversationLogger.ts  # Writes transcripts to Supabase
│   ├── lib/
│   │   └── supabaseClient.ts     # Supabase client + types
│   ├── App.tsx                   # Main app shell + LiveKit wiring
│   ├── main.tsx                  # React entry point
│   └── index.css                 # Tailwind + global styles
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── functions/
│       └── livekit-token/
│           └── index.ts          # Edge Function for token minting
├── .env.example
└── README.md
```

## How It Works

1. User clicks **"Activate Jarvis"**
2. Frontend calls the Supabase Edge Function to mint a LiveKit access token
3. The token includes a `RoomAgentDispatch` for `my-agent`, so LiveKit Cloud automatically starts your agent
4. Frontend connects to the LiveKit room, publishes the user's mic audio
5. The agent joins, subscribes to the mic, and starts responding
6. Transcription events flow in real-time via `RoomEvent.TranscriptionReceived`
7. Each finalized transcript segment is written to Supabase `messages`
8. The Arc Reactor animates based on agent state (idle → listening → thinking → speaking)
9. On disconnect, the session's `ended_at` is stamped in Supabase

## Arc Reactor States

| State | Visual Effect |
|-------|-------------|
| **Disconnected** | Dim outline, 15% opacity, no glow |
| **Idle** | Slow breathing pulse, dim cyan glow |
| **Listening** | Bright core, pulses with mic volume |
| **Thinking** | Fast flicker, middle ring rotates continuously |
| **Speaking** | Warm bright pulse synced with agent audio volume |

## Deployment

**Frontend** (Vercel/Netlify):
```bash
npm run build
# Deploy the `dist/` folder
```

**Edge Function**: Already deployed via `supabase functions deploy` in step 2.

---

## License

MIT
