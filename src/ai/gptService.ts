import OpenAI from "openai";
import { CONFIG } from "../config";
import { Message } from "../types";

const openai = new OpenAI({ apiKey: CONFIG.openai.apiKey });

export async function getAIResponse(messages: Message[]): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: CONFIG.openai.model,
    messages,
    max_tokens: 150,       // keep responses short for voice
    temperature: 0.4,      // consistent, not too creative
  });

  return completion.choices[0]?.message?.content?.trim() ?? "I'm sorry, I didn't catch that. Could you please repeat?";
}
