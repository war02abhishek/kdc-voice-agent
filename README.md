# KDC Voice Agent — AI Phone Receptionist

AI-powered 24/7 phone receptionist for **Krushna Diagnostic Center, Indapur**.
Replaces traditional IVR. Understands natural speech in **English, Hindi, and Marathi**.

---

## How It Works

```
Patient calls Twilio number
       ↓
Twilio hits POST /voice/incoming → returns TwiML greeting + opens Media Stream
       ↓
Audio streamed over WebSocket → Deepgram STT (real-time transcription)
       ↓
Transcript → OpenAI GPT-4o-mini (intent + natural response)
       ↓
Response → ElevenLabs TTS (natural Indian voice) → played back to caller
       ↓
If BOOK → save appointment → send SMS confirmation
If TRANSFER/EMERGENCY → forward call to +91-9405347738
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in all values in .env
```

### 3. Run locally (with ngrok for Twilio webhook)
```bash
# Terminal 1 — start server
npm run dev

# Terminal 2 — expose to internet
ngrok http 3000
```

### 4. Configure Twilio
- Go to [Twilio Console](https://console.twilio.com) → Phone Numbers → your number
- Set **Voice webhook** → `https://your-ngrok-url.ngrok.io/voice/incoming` (HTTP POST)
- Set **Status callback** → `https://your-ngrok-url.ngrok.io/voice/status`

### 5. Deploy to Railway
```bash
# Push to GitHub, connect repo to Railway
# Set all env vars in Railway dashboard
# Railway auto-detects Node.js and runs npm start
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `TWILIO_ACCOUNT_SID` | From Twilio Console |
| `TWILIO_AUTH_TOKEN` | From Twilio Console |
| `TWILIO_PHONE_NUMBER` | Your Twilio virtual number |
| `CLINIC_PHONE_NUMBER` | Real clinic number for call transfer |
| `DEEPGRAM_API_KEY` | From [deepgram.com](https://deepgram.com) |
| `OPENAI_API_KEY` | From [platform.openai.com](https://platform.openai.com) |
| `ELEVENLABS_API_KEY` | From [elevenlabs.io](https://elevenlabs.io) |
| `ELEVENLABS_VOICE_ID` | Voice ID from ElevenLabs (use multilingual model) |
| `PUBLIC_URL` | Your deployed server URL (no trailing slash) |
| `PORT` | Server port (default: 3000) |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/voice/incoming` | Twilio webhook — incoming call |
| POST | `/voice/status` | Twilio call status callback |
| WS | `/voice/stream` | Twilio Media Stream WebSocket |
| GET | `/appointments` | List all appointments (admin) |
| GET | `/appointments/lookup?phone=91XXXXXXXXXX` | Find appointment by phone |
| DELETE | `/appointments/:id` | Cancel appointment |
| GET | `/health` | Health check |

---

## What the Agent Handles

| Caller says | Agent does |
|---|---|
| "Book an X-Ray tomorrow at 10 AM" | Collects name → confirms → saves → sends SMS |
| "What time are you open?" | Answers from clinic hours |
| "Do I need to fast for sonography?" | Answers from FAQ knowledge |
| "Where are you located?" | Gives full address |
| "I want to speak to the doctor" | Transfers call to +91-9405347738 |
| "I have chest pain" | Emergency message → transfers immediately |
| Speaks in Hindi | Responds in Hindi throughout |
| Speaks in Marathi | Responds in Marathi throughout |

---

## Cost Estimate (~500 calls/month)

| Service | Cost |
|---|---|
| Twilio Voice | ~₹750 |
| Twilio SMS | ~₹50 |
| Deepgram STT | ~$2 (~₹170) |
| OpenAI GPT-4o-mini | ~$1 (~₹85) |
| ElevenLabs | $5/mo (~₹420) |
| Railway hosting | $5/mo (~₹420) |
| **Total** | **~₹1,900/mo** |

---

## Project Structure

```
kdc-voice-agent/
├── src/
│   ├── index.ts                      ← Express + WS server
│   ├── config.ts                     ← env vars
│   ├── types.ts                      ← shared interfaces
│   ├── knowledge/clinicKnowledge.ts  ← services, FAQs, hours
│   ├── ai/
│   │   ├── systemPrompt.ts           ← GPT system prompt
│   │   ├── gptService.ts             ← OpenAI call
│   │   └── intentParser.ts           ← intent + slot extraction
│   ├── stt/deepgramService.ts        ← real-time speech-to-text
│   ├── tts/elevenLabsService.ts      ← text-to-speech
│   ├── telephony/
│   │   ├── twilioWebhook.ts          ← /voice/incoming TwiML
│   │   └── mediaStreamHandler.ts     ← WebSocket audio pipeline
│   ├── services/
│   │   ├── appointmentService.ts     ← book/reschedule/cancel
│   │   ├── smsService.ts             ← SMS confirmations
│   │   └── callTransferService.ts    ← forward call to clinic
│   ├── session/sessionManager.ts     ← per-call state
│   └── routes/appointmentRoute.ts    ← REST API
├── data/appointments.json            ← flat file store
├── .env.example
├── package.json
└── tsconfig.json
```
