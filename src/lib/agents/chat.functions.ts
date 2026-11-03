import { createServerFn } from "@tanstack/react-start";
import { GatewayError, generateResponse } from "@lovable.dev/ai-gateway";
import type {} from "@/ai-gateway.types";
import { sanitizeSettings, type AiSettings } from "@/lib/agents/ai-settings";
import { VISA_KNOWLEDGE } from "@/lib/agents/visa-knowledge";

type Turn = { role: "user" | "assistant" | "system"; content: string };

export type AskInput = {
  botName: string;
  job: string;
  environment: string;
  hint: string;
  messages: Turn[];
  settings?: AiSettings;
};

function asAsk(input: unknown): AskInput {
  if (!input || typeof input !== "object") throw new Error("Invalid request");
  const data = input as Partial<AskInput>;
  if (typeof data.botName !== "string" || !Array.isArray(data.messages)) {
    throw new Error("Invalid request");
  }
  return {
    botName: data.botName.slice(0, 80),
    job: String(data.job ?? "").slice(0, 700),
    environment: String(data.environment ?? "").slice(0, 6000),
    hint: String(data.hint ?? "").slice(0, 800),
    settings: sanitizeSettings(data.settings),
    messages: data.messages.slice(-12).map((m) => ({
      role: m?.role === "assistant" || m?.role === "system" ? m.role : "user",
      content: String(m?.content ?? "").slice(0, 2500),
    })),
  };
}

function toPlain(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .trim();
}

const TONES = {
  coworker: "Write the way a sharp coworker texts: short, specific, no headings, no emoji.",
  friendly: "Write warmly and kindly, like a helpful friend. Plain sentences, no headings, no emoji.",
  formal: "Write in a polite, professional tone. Plain sentences, no headings, no emoji.",
} as const;

const LENGTHS = {
  short: { tokens: 220, rule: "Keep replies to 1-2 sentences." },
  medium: { tokens: 420, rule: "Keep replies to a short paragraph." },
  long: { tokens: 900, rule: "Give a thorough reply when useful, up to a few paragraphs." },
} as const;

export const askBot = createServerFn({ method: "POST" })
  .validator(asAsk)
  .handler(async ({ data }) => {
    const st = data.settings ?? sanitizeSettings(null);
    const system = [
      `You are ${data.botName}, a Grok Bot teammate on a shared cloud computer.`,
      `Job: ${data.job}`,
      "You do the work. You do not give generic advice or a tutorial.",
      "The environment snapshot is the only source of truth. Never contradict it.",
      "Never ask for a password in chat. Sign-in happens on the computer handoff.",
      "Never claim you sent, paid, booked, or deleted something unless the snapshot says it already happened.",
      TONES[st.tone],
      LENGTHS[st.length].rule,
      st.extra ? `Owner instructions: ${st.extra}` : "",
      st.visaKnowledge ? VISA_KNOWLEDGE : "",
      data.hint,
      "",
      "ENVIRONMENT",
      data.environment,
    ].join("\n");

    try {
      const res = await generateResponse({
        model: st.model,
        instructions: system,
        max_output_tokens: LENGTHS[st.length].tokens,
        input: data.messages.map((m) => ({ role: m.role, content: m.content })),
      });

      const text = toPlain(
        (res.output ?? [])
          .filter(
            (item): item is Extract<typeof item, { type: "message" }> =>
              item.type === "message",
          )
          .flatMap((item) => item.content)
          .filter(
            (part): part is Extract<typeof part, { type: "output_text" }> =>
              part.type === "output_text",
          )
          .map((part) => part.text)
          .join(" "),
      );
      if (!text) return { ok: false as const, error: "The model returned an empty reply." };
      return { ok: true as const, text };
    } catch (err) {
      if (err instanceof GatewayError) {
        return {
          ok: false as const,
          error: "The AI couldn't reply just now. The computer state is unchanged.",
        };
      }
      throw err;
    }
  });
