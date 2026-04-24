import { CallSession, Language, CallState, Message } from "../types";
import { buildSystemPrompt } from "../ai/systemPrompt";

// In-memory session store — one entry per active call
const sessions = new Map<string, CallSession>();

export function createSession(callSid: string, callerNumber: string): CallSession {
  const session: CallSession = {
    callSid,
    language: "en",                  // default — updated after first utterance
    history: [],
    appointmentDraft: {},
    state: "GREETING",
    callerNumber,
    createdAt: new Date(),
  };
  sessions.set(callSid, session);
  return session;
}

export function getSession(callSid: string): CallSession | undefined {
  return sessions.get(callSid);
}

export function setLanguage(callSid: string, language: Language): void {
  const session = sessions.get(callSid);
  if (!session) return;
  session.language = language;
  // Rebuild system prompt with detected language
  session.history = [{ role: "system", content: buildSystemPrompt(language) }];
}

export function addMessage(callSid: string, role: "user" | "assistant", content: string): void {
  const session = sessions.get(callSid);
  if (!session) return;
  session.history.push({ role, content });
  // Keep history bounded to last 10 exchanges (20 messages) to control token cost
  const systemMsg = session.history[0];
  const recent = session.history.slice(-20);
  if (recent[0]?.role !== "system") session.history = [systemMsg, ...recent];
  else session.history = recent;
}

export function setState(callSid: string, state: CallState): void {
  const session = sessions.get(callSid);
  if (session) session.state = state;
}

export function updateDraft(callSid: string, data: Partial<CallSession["appointmentDraft"]>): void {
  const session = sessions.get(callSid);
  if (session) session.appointmentDraft = { ...session.appointmentDraft, ...data };
}

export function endSession(callSid: string): void {
  sessions.delete(callSid);
}

export function getMessages(callSid: string): Message[] {
  return sessions.get(callSid)?.history ?? [];
}
