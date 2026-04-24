import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { CONFIG } from "../config";
import { logger } from "../logger";

const TAG = "Whisper";

const openai = new OpenAI({ apiKey: CONFIG.openai.apiKey });

// Transcribes a mulaw audio buffer (from Twilio) using OpenAI Whisper.
// Twilio streams mulaw 8kHz — we accumulate chunks, write to temp file, transcribe.
export async function transcribeAudio(
  audioBuffer: Buffer,
  languageHint?: string   // e.g. "hi", "mr", "en" — improves accuracy
): Promise<string> {
  // Write buffer to a temp wav file — Whisper accepts wav/mp3/webm/ogg
  const tmpPath = path.join(__dirname, `../../data/tmp_${Date.now()}.wav`);

  // Wrap raw mulaw bytes in a minimal WAV header so Whisper accepts it
  const wavBuffer = mulawToWav(audioBuffer);
  fs.writeFileSync(tmpPath, wavBuffer);

  logger.debug(TAG, `Transcribing ${audioBuffer.length} bytes, lang=${languageHint ?? "auto"}`);

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tmpPath) as unknown as File,
      model: "whisper-1",
      language: languageHint,          // optional — Whisper auto-detects if omitted
      response_format: "text",
    });

    const text = (transcription as unknown as string).trim();
    logger.debug(TAG, `Transcription result: "${text}"`);
    return text;
  } finally {
    fs.unlink(tmpPath, (err) => {
      if (err) logger.warn(TAG, `Failed to delete temp file: ${tmpPath}`);
    });
  }
}

// ── Minimal WAV header wrapper for raw 8kHz mulaw audio ──────────────────────
function mulawToWav(mulawData: Buffer): Buffer {
  const sampleRate    = 8000;
  const numChannels   = 1;
  const bitsPerSample = 8;
  const audioFormat   = 7;   // WAVE_FORMAT_MULAW
  const byteRate      = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign    = numChannels * (bitsPerSample / 8);
  const dataSize      = mulawData.length;
  const headerSize    = 44;
  const buffer        = Buffer.alloc(headerSize + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(audioFormat, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  mulawData.copy(buffer, headerSize);

  return buffer;
}
