import axios from "axios";
import { CONFIG } from "../config";
import { logger } from "../logger";

const TAG = "ElevenLabs";

// In-memory audio cache: callSid → MP3 buffer
// Entries are written before Twilio is told to <Play> them, then deleted after serving.
const audioCache = new Map<string, Buffer>();

export async function textToSpeech(callSid: string, text: string): Promise<void> {
  logger.info(TAG, `Requesting TTS for callSid=${callSid}, chars=${text.length}`);

  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${CONFIG.elevenlabs.voiceId}`,
    {
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      },
    },
    {
      headers: {
        "xi-api-key": CONFIG.elevenlabs.apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      responseType: "arraybuffer",
    }
  );

  const audio = Buffer.from(response.data);
  audioCache.set(callSid, audio);
  logger.info(TAG, `Audio cached for callSid=${callSid}, bytes=${audio.length}`);
}

// Called by the /audio/:callSid route — returns buffer and removes from cache
export function consumeAudio(callSid: string): Buffer | undefined {
  const audio = audioCache.get(callSid);
  if (audio) {
    audioCache.delete(callSid);
    logger.debug(TAG, `Audio consumed and removed for callSid=${callSid}`);
  } else {
    logger.warn(TAG, `No cached audio found for callSid=${callSid}`);
  }
  return audio;
}

// Fallback: Twilio Polly TTS — returns a TwiML <Say> string
export function twilioSayFallback(text: string, language: string): string {
  const voice = "Polly.Aditi"; // Best available Indian voice on Twilio for EN/HI/MR
  return `<Say voice="${voice}">${escapeXml(text)}</Say>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
