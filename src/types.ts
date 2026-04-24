// ── Shared TypeScript interfaces across the entire agent ──────────────────────

export type Language = "en" | "hi" | "mr";

export type Intent =
  | "BOOK_APPOINTMENT"
  | "RESCHEDULE_APPOINTMENT"
  | "CANCEL_APPOINTMENT"
  | "SERVICE_INFO"
  | "HOURS_INFO"
  | "LOCATION_INFO"
  | "REPORT_STATUS"
  | "FASTING_INFO"
  | "INSURANCE_INFO"
  | "TRANSFER_TO_STAFF"
  | "EMERGENCY"
  | "GREETING"
  | "UNKNOWN";

export interface ParsedIntent {
  intent: Intent;
  slots: Record<string, string>;   // e.g. { service: "X-Ray", date: "tomorrow", name: "Rahul" }
  confidence: number;              // 0–1
}

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface CallSession {
  callSid: string;
  language: Language;
  history: Message[];
  appointmentDraft: Partial<Appointment>;
  state: CallState;
  callerNumber: string;
  createdAt: Date;
}

export type CallState =
  | "GREETING"
  | "COLLECTING_NAME"
  | "COLLECTING_SERVICE"
  | "COLLECTING_DATETIME"
  | "CONFIRMING_APPOINTMENT"
  | "RESCHEDULING"
  | "ANSWERING"
  | "TRANSFERRING"
  | "ENDED";

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  service: string;
  date: string;        // ISO date string
  time: string;        // e.g. "10:30 AM"
  status: "confirmed" | "cancelled" | "rescheduled";
  bookedAt: string;    // ISO datetime
  notes?: string;
}

export interface AppointmentStore {
  appointments: Appointment[];
}
