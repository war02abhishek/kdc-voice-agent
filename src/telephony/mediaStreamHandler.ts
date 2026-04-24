import WebSocket, { WebSocketServer } from "ws";
import http from "http";
import { transcribeAudio } from "../stt/whisperService";
import { detectLanguage } from "../services/languageService";
import { getAIResponse } from "../ai/gptService";
import { detectSignalInResponse } from "../ai/intentParser";
import { textToSpeech, twilioSayFallback } from "../tts/elevenLabsService";
import { buildTransferTwiML } from "../services/callTransferService";
import { bookAppointment } from "../services/appointmentService";
import { sendAppointmentConfirmationSMS } from "../services/smsService";
import {
  getSession,
  setLanguage,
  addMessage,
  setState,
  updateDraft,
  endSession,
  getMessages,
} from "../session/sessionManager";
import { TRANSFER_MESSAGE, EMERGENCY_MESSAGE } from "../knowledge/clinicKnowledge";
import { Language } from "../types";
import twilio from "twilio";
import { CONFIG } from "../config";
import { logger } from "../logger";

const TAG = "MediaStream";
const twilioClient = twilio(CONFIG.twilio.accountSid, CONFIG.twilio.authToken);

// Silence threshold — accumulate audio for this many ms before transcribing
const SILENCE_THRESHOLD_MS = 1500;

export function attachMediaStreamHandler(server: http.Server): void {
  const wss = new WebSocketServer({ server, path: "/voice/stream" });

  wss.on("connection", (ws: WebSocket) => {
    logger.info(TAG, "WebSocket connected");

    let callSid      = "";
    let callerNumber = "";
    let languageSet  = false;
    let detectedLang = "";

    let audioChunks: Buffer[]          = [];
    let silenceTimer: NodeJS.Timeout | null = null;
    let isProcessing = false;

    // ── Process accumulated audio through Whisper ─────────────────────────
    async function processAudio(): Promise<void> {
      if (isProcessing || audioChunks.length === 0) return;
      isProcessing = true;

      const audioBuffer = Buffer.concat(audioChunks);
      audioChunks = [];

      // Skip very short clips (< 0.5s = 4000 bytes at 8kHz) — likely silence
      if (audioBuffer.length < 4000) {
        logger.debug(TAG, `Skipping short audio chunk (${audioBuffer.length} bytes) for callSid=${callSid}`);
        isProcessing = false;
        return;
      }

      try {
        logger.debug(TAG, `Sending ${audioBuffer.length} bytes to Whisper for callSid=${callSid}`);
        const transcript = await transcribeAudio(audioBuffer, detectedLang || undefined);

        if (!transcript.trim()) {
          logger.debug(TAG, `Empty transcript for callSid=${callSid}, skipping`);
          isProcessing = false;
          return;
        }

        logger.info(TAG, `Transcript for callSid=${callSid}: "${transcript}"`);

        // ── Detect language on first utterance ──────────────────────────
        if (!languageSet) {
          const lang = detectLanguage(transcript) as Language;
          detectedLang = lang;
          setLanguage(callSid, lang);
          languageSet = true;
          logger.info(TAG, `Language detected: ${lang} for callSid=${callSid}`);
        }

        const session = getSession(callSid);
        if (!session) {
          logger.warn(TAG, `No session found for callSid=${callSid}, dropping`);
          isProcessing = false;
          return;
        }

        // ── Add user message + get AI response ──────────────────────────
        addMessage(callSid, "user", transcript);
        const messages = getMessages(callSid);
        const aiText = await getAIResponse(messages);
        addMessage(callSid, "assistant", aiText);

        logger.info(TAG, `AI response for callSid=${callSid}: "${aiText}"`);

        // ── Check for transfer / emergency signals ───────────────────────
        const signal = detectSignalInResponse(aiText);
        if (signal === "EMERGENCY" || signal === "TRANSFER_TO_STAFF") {
          logger.warn(TAG, `Signal=${signal} detected for callSid=${callSid}, transferring`);
          const msgMap = signal === "EMERGENCY" ? EMERGENCY_MESSAGE : TRANSFER_MESSAGE;
          const msg    = msgMap[session.language] ?? msgMap["en"];
          await updateCallWithTwiML(callSid, buildTransferTwiML(msg, session.language));
          endSession(callSid);
          ws.close();
          isProcessing = false;
          return;
        }

        // ── Extract appointment slots ────────────────────────────────────
        extractAndUpdateDraft(callSid, transcript);

        // ── Check if appointment draft is complete ───────────────────────
        if (session.state === "CONFIRMING_APPOINTMENT") {
          const draft = session.appointmentDraft;
          if (draft.patientName && draft.service && draft.date && draft.time) {
            logger.info(TAG, `Booking appointment for callSid=${callSid}`, draft);
            const appt = bookAppointment({
              patientName:  draft.patientName,
              patientPhone: callerNumber,
              service:      draft.service,
              date:         draft.date,
              time:         draft.time,
              notes:        "",
            });
            sendAppointmentConfirmationSMS(appt).catch((err) =>
              logger.error(TAG, `SMS failed for callSid=${callSid}`, err)
            );
            setState(callSid, "ANSWERING");
          }
        }

        // ── Speak AI response back to caller ────────────────────────────
        await speakToCall(callSid, aiText, session.language);

      } catch (err) {
        logger.error(TAG, `Processing error for callSid=${callSid}`, err);
      } finally {
        isProcessing = false;
      }
    }

    // ── Handle Twilio Media Stream messages ──────────────────────────────
    ws.on("message", async (rawMsg: WebSocket.RawData) => {
      const msg = JSON.parse(rawMsg.toString()) as TwilioStreamMessage;

      switch (msg.event) {
        case "connected":
          logger.info(TAG, "Stream connected");
          break;

        case "start":
          callSid      = msg.start?.callSid ?? msg.start?.customParameters?.callSid ?? "";
          callerNumber = msg.start?.customParameters?.callerNumber ?? "";
          logger.info(TAG, `Stream started — callSid=${callSid}, caller=${callerNumber}`);
          break;

        case "media": {
          if (!msg.media?.payload) break;
          audioChunks.push(Buffer.from(msg.media.payload, "base64"));
          if (silenceTimer) clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => { processAudio(); }, SILENCE_THRESHOLD_MS);
          break;
        }

        case "stop":
          logger.info(TAG, `Stream stopped — callSid=${callSid}`);
          if (silenceTimer) clearTimeout(silenceTimer);
          endSession(callSid);
          break;
      }
    });

    ws.on("close", () => {
      logger.info(TAG, `WebSocket closed — callSid=${callSid}`);
      if (silenceTimer) clearTimeout(silenceTimer);
      if (callSid) endSession(callSid);
    });

    ws.on("error", (err) => logger.error(TAG, `WS error for callSid=${callSid}`, err));
  });
}

// ── Speak response back to caller ─────────────────────────────────────────────
async function speakToCall(callSid: string, text: string, language: Language): Promise<void> {
  const wsUrl = CONFIG.publicUrl.replace(/^https?/, "wss") + "/voice/stream";

  try {
    // Generate and cache audio BEFORE telling Twilio to <Play> it
    await textToSpeech(callSid, text);

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${CONFIG.publicUrl}/audio/${callSid}</Play>
  <Connect>
    <Stream url="${wsUrl}" />
  </Connect>
</Response>`;

    await twilioClient.calls(callSid).update({ twiml });
    logger.info(TAG, `ElevenLabs TwiML sent for callSid=${callSid}`);

  } catch (err) {
    logger.warn(TAG, `ElevenLabs failed for callSid=${callSid}, falling back to Polly`, err);

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${twilioSayFallback(text, language)}
  <Connect>
    <Stream url="${wsUrl}" />
  </Connect>
</Response>`;

    await twilioClient.calls(callSid).update({ twiml }).catch((e) =>
      logger.error(TAG, `Polly fallback TwiML update failed for callSid=${callSid}`, e)
    );
  }
}

// ── Update call with new TwiML (transfer / emergency) ─────────────────────────
async function updateCallWithTwiML(callSid: string, twiml: string): Promise<void> {
  await twilioClient.calls(callSid).update({ twiml }).catch((err) =>
    logger.error(TAG, `TwiML update failed for callSid=${callSid}`, err)
  );
}

// ── Extract appointment slots from transcript ──────────────────────────────────
function extractAndUpdateDraft(callSid: string, userText: string): void {
  const session = getSession(callSid);
  if (!session) return;

  const updates: Partial<typeof session.appointmentDraft> = {};

  if (!session.appointmentDraft.service) {
    if      (/x.?ray|एक्स.?रे|क्ष.?किरण/i.test(userText))              updates.service = "Digital X-Ray";
    else if (/sonography|ultrasound|usg|सोनोग्राफी|3d|4d/i.test(userText)) updates.service = "Sonography 3D/4D";
    else if (/doppler|डॉपलर/i.test(userText))                            updates.service = "Color Doppler";
  }

  if (!session.appointmentDraft.date) {
    if (/today|आज/i.test(userText)) {
      updates.date = new Date().toLocaleDateString("en-IN");
    } else if (/tomorrow|कल|उद्या/i.test(userText)) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      updates.date = d.toLocaleDateString("en-IN");
    }
  }

  if (!session.appointmentDraft.time) {
    const t = userText.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
    if (t) updates.time = t[1];
    else if (/morning|सुबह|सकाळ/i.test(userText))    updates.time = "morning";
    else if (/evening|शाम|संध्याकाळ/i.test(userText)) updates.time = "evening";
  }

  if (!session.appointmentDraft.patientName) {
    const n = userText.match(
      /(?:my name is|i am|मेरा नाम|माझे नाव)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)/i
    );
    if (n) updates.patientName = n[1].trim();
  }

  if (Object.keys(updates).length > 0) {
    logger.debug(TAG, `Draft updated for callSid=${callSid}`, updates);
    updateDraft(callSid, updates);
    const draft = { ...session.appointmentDraft, ...updates };
    if (draft.patientName && draft.service && draft.date && draft.time) {
      setState(callSid, "CONFIRMING_APPOINTMENT");
      logger.info(TAG, `Appointment draft complete for callSid=${callSid}`, draft);
    }
  }
}

// ── Twilio Media Stream message types ─────────────────────────────────────────
interface TwilioStreamMessage {
  event: "connected" | "start" | "media" | "stop";
  start?: { callSid?: string; customParameters?: Record<string, string> };
  media?: { payload: string; track: string; chunk: string; timestamp: string };
}
