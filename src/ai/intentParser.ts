import { Intent, ParsedIntent } from "../types";

// Lightweight keyword-based intent classifier that runs BEFORE GPT
// to catch clear intents cheaply and fast (no API call needed)
const INTENT_PATTERNS: Array<{ intent: Intent; patterns: RegExp[] }> = [
  {
    intent: "EMERGENCY",
    patterns: [/chest pain|heart attack|unconscious|bleeding heavily|emergency|ambulance|108/i],
  },
  {
    intent: "BOOK_APPOINTMENT",
    patterns: [/book|appointment|schedule|appoint|बुक|अपॉइंटमेंट|बुकिंग|अपॉइन्टमेंट|बुक करा/i],
  },
  {
    intent: "RESCHEDULE_APPOINTMENT",
    patterns: [/reschedule|change.*appointment|shift.*appointment|बदल|reschedule करा/i],
  },
  {
    intent: "CANCEL_APPOINTMENT",
    patterns: [/cancel|cancellation|रद्द|cancel करा/i],
  },
  {
    intent: "HOURS_INFO",
    patterns: [/timing|hours|open|close|time|वेळ|टाइमिंग|कब खुलते|कितने बजे/i],
  },
  {
    intent: "LOCATION_INFO",
    patterns: [/address|location|where|direction|कहाँ|पत्ता|कुठे|रास्ता|map/i],
  },
  {
    intent: "REPORT_STATUS",
    patterns: [/report|result|ready|रिपोर्ट|रिजल्ट|तयार/i],
  },
  {
    intent: "FASTING_INFO",
    patterns: [/fast|fasting|खाना|उपवास|जेवण|eat|food/i],
  },
  {
    intent: "TRANSFER_TO_STAFF",
    patterns: [/doctor|staff|human|person|transfer|connect|डॉक्टर|स्टाफ|माणूस/i],
  },
  {
    intent: "SERVICE_INFO",
    patterns: [/x.?ray|sonography|ultrasound|doppler|usg|service|test|scan|एक्स रे|सोनोग्राफी|डॉपलर/i],
  },
];

export function classifyIntent(text: string): ParsedIntent {
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some(p => p.test(text))) {
      return { intent, slots: extractSlots(text, intent), confidence: 0.85 };
    }
  }
  return { intent: "UNKNOWN", slots: {}, confidence: 0.0 };
}

// Extract simple slots from utterance text
function extractSlots(text: string, intent: Intent): Record<string, string> {
  const slots: Record<string, string> = {};

  // Service slot
  if (/x.?ray|एक्स रे|क्ष-किरण/i.test(text)) slots.service = "Digital X-Ray";
  else if (/sonography|ultrasound|usg|सोनोग्राफी|3d|4d/i.test(text)) slots.service = "Sonography 3D/4D";
  else if (/doppler|डॉपलर/i.test(text)) slots.service = "Color Doppler";

  // Date slot — simple keywords
  if (/today|आज|आज/i.test(text)) slots.date = "today";
  else if (/tomorrow|कल|उद्या/i.test(text)) slots.date = "tomorrow";

  // Time slot — e.g. "10 AM", "morning", "evening"
  const timeMatch = text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i);
  if (timeMatch) slots.time = timeMatch[1];
  else if (/morning|सुबह|सकाळ/i.test(text)) slots.time = "morning";
  else if (/evening|शाम|संध्याकाळ/i.test(text)) slots.time = "evening";

  return slots;
}

// Check if GPT response contains a transfer/emergency signal word
export function detectSignalInResponse(response: string): Intent | null {
  if (/\bEMERGENCY\b/.test(response)) return "EMERGENCY";
  if (/\bTRANSFER\b/.test(response)) return "TRANSFER_TO_STAFF";
  return null;
}
