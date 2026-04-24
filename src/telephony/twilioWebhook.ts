import { Router, Request, Response } from "express";
import { CONFIG } from "../config";
import { createSession } from "../session/sessionManager";
import { GREETINGS } from "../knowledge/clinicKnowledge";
import { twilioSayFallback } from "../tts/elevenLabsService";
import { logger } from "../logger";

const TAG = "TwilioWebhook";

export const twilioWebhookRouter = Router();

// POST /voice/incoming — Twilio calls this when a patient dials the number.
// We respond with TwiML that:
//   1. Greets the caller
//   2. Opens a Media Stream (WebSocket) so we can process audio in real-time
twilioWebhookRouter.post("/incoming", (req: Request, res: Response) => {
  const callSid: string = req.body.CallSid ?? "unknown";
  const callerNumber: string = req.body.From ?? "unknown";

  // Create a session for this call
  createSession(callSid, callerNumber);

  logger.info(TAG, `Incoming call — SID=${callSid}, From=${callerNumber}`);

  // WebSocket URL for Twilio Media Streams
  const wsUrl = CONFIG.publicUrl.replace(/^https?/, "wss") + "/voice/stream";

  const greeting = GREETINGS["en"]; // default greeting — language detected after first speech

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">${escapeXml(greeting)}</Say>
  <Connect>
    <Stream url="${wsUrl}">
      <Parameter name="callSid" value="${callSid}" />
      <Parameter name="callerNumber" value="${escapeXml(callerNumber)}" />
    </Stream>
  </Connect>
</Response>`;

  res.type("text/xml").send(twiml);
});

// POST /voice/status — Twilio calls this on call status changes
twilioWebhookRouter.post("/status", (req: Request, res: Response) => {
  logger.info(TAG, `Call status=${req.body.CallStatus} SID=${req.body.CallSid}`);
  res.sendStatus(200);
});

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
