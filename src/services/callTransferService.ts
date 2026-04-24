import { CONFIG } from "../config";

// Returns TwiML string that transfers the call to the clinic's real phone number
export function buildTransferTwiML(message: string, language: string): string {
  const voiceMap: Record<string, string> = {
    en: "Polly.Aditi",
    hi: "Polly.Aditi",
    mr: "Polly.Aditi",
  };
  const voice = voiceMap[language] ?? "Polly.Aditi";

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">${escapeXml(message)}</Say>
  <Dial callerId="${CONFIG.twilio.phoneNumber}">
    <Number>${CONFIG.twilio.clinicPhone}</Number>
  </Dial>
</Response>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
