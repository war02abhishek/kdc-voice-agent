import dotenv from "dotenv";
dotenv.config();

function require_env(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const CONFIG = {
  port: parseInt(process.env.PORT ?? "3000"),
  publicUrl: require_env("PUBLIC_URL"),

  twilio: {
    accountSid: require_env("TWILIO_ACCOUNT_SID"),
    authToken:  require_env("TWILIO_AUTH_TOKEN"),
    phoneNumber: require_env("TWILIO_PHONE_NUMBER"),
    clinicPhone: require_env("CLINIC_PHONE_NUMBER"),
  },

  openai: {
    apiKey: require_env("OPENAI_API_KEY"),
    model: "gpt-4o-mini",
  },

  elevenlabs: {
    apiKey: require_env("ELEVENLABS_API_KEY"),
    voiceId: process.env.ELEVENLABS_VOICE_ID ?? "vIdhHAZdn1bGjKe1dFw8",
  },
} as const;
