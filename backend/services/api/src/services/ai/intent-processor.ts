import Groq from "groq-sdk";
import { prisma } from "../../db.js";
import { INTENT_SYSTEM_PROMPT } from "./system-prompt.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function callClaude(
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): Promise<string> {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 500,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
  });
  return (
    response.choices[0]?.message?.content ??
    "I had trouble understanding that. Could you rephrase?"
  );
}

export async function buildSystemPrompt(userId: string): Promise<string> {
  const contacts = await prisma.contact.findMany({
    where: { userId },
    select: { id: true, name: true, walletAddress: true },
  });
  const contactsList = contacts.length
    ? contacts.map((c) => `${c.id} | ${c.name} | ${c.walletAddress}`).join("\n")
    : "No contacts saved yet.";
  return INTENT_SYSTEM_PROMPT.replace("{{CONTACTS_JSON}}", contactsList);
}
