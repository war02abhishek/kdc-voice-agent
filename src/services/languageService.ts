import { Language } from "../types";

// Detect language from Whisper transcript using script + keyword heuristics.
// Whisper already does a great job — this is a lightweight post-processing step.

const DEVANAGARI     = /[\u0900-\u097F]/;
const MARATHI_WORDS  = /नमस्कार|आहे|आपण|मला|करा|सांगा|काय|कुठे|केव्हा|माझे|तुमचे/;
const HINDI_WORDS    = /नमस्ते|हाँ|नहीं|कैसे|क्या|कहाँ|कब|मुझे|आपको|बुक|मेरा/;

export function detectLanguage(text: string): Language {
  if (!DEVANAGARI.test(text)) return "en";
  if (MARATHI_WORDS.test(text)) return "mr";
  if (HINDI_WORDS.test(text))   return "hi";
  return "hi";  // default Devanagari → Hindi
}
