import http from "http";
import express, { Request, Response } from "express";
import { CONFIG } from "./config";
import { logger } from "./logger";
import { twilioWebhookRouter } from "./telephony/twilioWebhook";
import { attachMediaStreamHandler } from "./telephony/mediaStreamHandler";
import { appointmentRouter } from "./routes/appointmentRoute";
import { consumeAudio } from "./tts/elevenLabsService";

const TAG = "Server";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/voice", twilioWebhookRouter);
app.use("/appointments", appointmentRouter);

// Serves ElevenLabs audio buffer to Twilio <Play> — consumed once then discarded
app.get("/audio/:callSid", (req: Request, res: Response) => {
  const { callSid } = req.params;
  const audio = consumeAudio(callSid);
  if (!audio) {
    logger.warn(TAG, `Audio not found for callSid=${callSid}`);
    res.status(404).send("Audio not found");
    return;
  }
  logger.info(TAG, `Serving audio for callSid=${callSid}, bytes=${audio.length}`);
  res.set("Content-Type", "audio/mpeg");
  res.set("Content-Length", String(audio.length));
  res.send(audio);
});

app.get("/health", (_req, res) => res.json({ status: "ok", service: "kdc-voice-agent" }));

// ── HTTP + WebSocket server ───────────────────────────────────────────────────
const server = http.createServer(app);
attachMediaStreamHandler(server);

server.listen(CONFIG.port, () => {
  logger.info(TAG, `kdc-voice-agent running on port ${CONFIG.port}`);
  logger.info(TAG, `Public URL: ${CONFIG.publicUrl}`);
  logger.info(TAG, `Twilio webhook: ${CONFIG.publicUrl}/voice/incoming`);
});
