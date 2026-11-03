import { create } from "zustand";

export const AI_MODELS = [
  { id: "openai/gpt-6-astra", label: "GPT-6 Astra", note: "Balanced, default" },
  { id: "openai/gpt-6-sol", label: "GPT-6 Sol", note: "Strongest reasoning" },
  { id: "openai/gpt-6-luna", label: "GPT-6 Luna", note: "Fast and light" },
  { id: "openai/gpt-5.5", label: "GPT-5.5", note: "Previous generation" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini", note: "Cheapest, quickest" },
] as const;

export type AiModelId = (typeof AI_MODELS)[number]["id"];
export type ReplyLength = "short" | "medium" | "long";
export type ReplyTone = "coworker" | "friendly" | "formal";

export type AiSettings = {
  model: AiModelId;
  length: ReplyLength;
  tone: ReplyTone;
  visaKnowledge: boolean;
  extra: string;
  selfHosted: boolean;
  keys: { gemini: string; openai: string; deepseek: string };
};

export const DEFAULT_AI_SETTINGS: AiSettings = {
  model: "openai/gpt-6-astra",
  length: "medium",
  tone: "coworker",
  visaKnowledge: false,
  extra: "",
  selfHosted: true,
  keys: { gemini: "", openai: "", deepseek: "" },
};

const KEY = "nspace-ai-settings-v1";

export function sanitizeSettings(input: unknown): AiSettings {
  const d = (input && typeof input === "object" ? input : {}) as Partial<AiSettings>;
  return {
    model: AI_MODELS.some((m) => m.id === d.model) ? (d.model as AiModelId) : DEFAULT_AI_SETTINGS.model,
    length: d.length === "short" || d.length === "long" ? d.length : "medium",
    tone: d.tone === "friendly" || d.tone === "formal" ? d.tone : "coworker",
    visaKnowledge: d.visaKnowledge === true,
    extra: String(d.extra ?? "").slice(0, 1000),
    selfHosted: d.selfHosted !== false,
    keys: {
      gemini: String((d.keys as Record<string, unknown> | undefined)?.gemini ?? "").slice(0, 200),
      openai: String((d.keys as Record<string, unknown> | undefined)?.openai ?? "").slice(0, 200),
      deepseek: String((d.keys as Record<string, unknown> | undefined)?.deepseek ?? "").slice(0, 200),
    },
  };
}

type Store = AiSettings & { update: (p: Partial<AiSettings>) => void; load: () => void };

export const useAiSettings = create<Store>((set, get) => ({
  ...DEFAULT_AI_SETTINGS,
  load: () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) set(sanitizeSettings(JSON.parse(raw)));
    } catch {
      /* ignore */
    }
  },
  update: (p) => {
    set(sanitizeSettings({ ...get(), ...p }));
    try {
      const { update: _u, load: _l, ...rest } = get();
      localStorage.setItem(KEY, JSON.stringify(rest));
    } catch {
      /* ignore */
    }
  },
}));

export function currentAiSettings(): AiSettings {
  const { update: _u, load: _l, ...rest } = useAiSettings.getState();
  return rest;
}
