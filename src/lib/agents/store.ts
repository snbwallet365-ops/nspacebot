import { create } from "zustand";
import { askBot } from "@/lib/agents/chat.functions";
import { currentAiSettings } from "@/lib/agents/ai-settings";
import {
  type ApprovalCard,
  type Bot,
  type ChatMessage,
  type ComputerCard,
  type Connector,
  type ConnectorId,
  type Routine,
  type ScreenKind,
  type VFile,
  connectionSentence,
  describeEnvironment,
  handoffReply,
  parseRename,
  planTurn,
  seedBots,
  seedConnectors,
  seedFiles,
  seedRoutines,
  sequenceFileBody,
  uid,
  DEFAULT_VOICE,
} from "@/lib/agents/model";

const STORAGE_KEY = "grokbot-workspace-v1";

export type ThemeName = "light" | "dark";
export type PanelMode = "closed" | "watch" | "drive";

type Persisted = {
  v: 1;
  theme: ThemeName;
  voice: string;
  memoryByBot: Record<string, string>;
  connectors: Connector[];
  files: VFile[];
  bots: Bot[];
  routines: Routine[];
  activeId: string;
  terminal: string[];
};

export type BotState = Persisted & {
  hydrated: boolean;
  typing: boolean;
  panel: PanelMode;
  driveCardId: string | null;
  notice: string;
};

type Actions = {
  hydrate: () => void;
  setTheme: (theme: ThemeName) => void;
  setActive: (id: string) => void;
  setPanel: (panel: PanelMode) => void;
  setNotice: (notice: string) => void;
  setScreen: (screen: ScreenKind) => void;
  send: (text: string) => Promise<void>;
  signInSalesforce: (email: string) => void;
  setConnector: (id: ConnectorId, patch: Partial<Connector>) => void;
  installConnector: (id: ConnectorId) => void;
  handBack: (cardId: string) => void;
  takeOver: (cardId: string) => void;
  decideApproval: (messageId: string, approved: boolean) => void;
  createBot: (name: string, job: string) => void;
  renameActive: (name: string) => void;
  addRoutine: (name: string, when: string, prompt: string) => void;
  runCommand: (line: string) => void;
  openFile: (path: string) => void;
};

function snapshot(s: BotState): Persisted {
  return {
    v: 1,
    theme: s.theme,
    voice: s.voice,
    memoryByBot: s.memoryByBot,
    connectors: s.connectors,
    files: s.files,
    bots: s.bots,
    routines: s.routines,
    activeId: s.activeId,
    terminal: s.terminal,
  };
}

function readSaved(): Persisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Persisted;
    if (data.v !== 1 || !Array.isArray(data.bots) || data.bots.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

function writeSaved(s: BotState) {
  if (typeof window === "undefined" || !s.hydrated) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot(s)));
}

function patchBot(bots: Bot[], id: string, fn: (bot: Bot) => Bot): Bot[] {
  return bots.map((b) => (b.id === id ? fn(b) : b));
}

function append(bot: Bot, message: ChatMessage): Bot {
  return { ...bot, timeLabel: "Now", messages: [...bot.messages, message] };
}

const initial: Persisted = {
  v: 1,
  theme: "light",
  voice: DEFAULT_VOICE,
  memoryByBot: {
    sales: "Armand wants email and LinkedIn sequences in his voice. Do not send.",
    talent: "Never contact candidates. Drafts only.",
    inbox: "Park, don't send.",
  },
  connectors: seedConnectors(),
  files: seedFiles(),
  bots: seedBots(),
  routines: seedRoutines(),
  activeId: "sales",
  terminal: ["bot@computer:~$ help"],
};

export const useBotStore = create<BotState & Actions>((set, get) => ({
  ...initial,
  hydrated: false,
  typing: false,
  panel: "closed",
  driveCardId: null,
  notice: "",

  hydrate: () => {
    const saved = readSaved();
    if (saved) {
      set({ ...saved, hydrated: true, panel: "closed", typing: false, driveCardId: null });
    } else {
      set({ hydrated: true });
    }
  },

  setTheme: (theme) => set({ theme }),
  setActive: (id) => set({ activeId: id, notice: "" }),
  setPanel: (panel) => set({ panel, driveCardId: panel === "closed" ? null : get().driveCardId }),
  setNotice: (notice) => set({ notice }),

  setScreen: (screen) => {
    const { activeId } = get();
    set({
      bots: patchBot(get().bots, activeId, (b) => ({ ...b, screen })),
      panel: get().panel === "closed" ? "watch" : get().panel,
    });
  },

  setConnector: (id, patch) => {
    set({
      connectors: get().connectors.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
    if (id === "salesforce" && patch.signedIn === false) {
      set({
        bots: get().bots.map((b) =>
          b.screen === "salesforce-accounts" ? { ...b, screen: "salesforce-login" } : b,
        ),
      });
    }
  },

  installConnector: (id) => {
    set({
      connectors: get().connectors.map((c) =>
        c.id === id ? { ...c, installed: true, signedIn: false, account: undefined } : c,
      ),
    });
  },

  signInSalesforce: (email) => {
    const account = email.trim();
    set({
      connectors: get().connectors.map((c) =>
        c.id === "salesforce" ? { ...c, installed: true, signedIn: true, account } : c,
      ),
      files: upsertFile(get().files, "Outreach/q4-sequences.md", sequenceFileBody(account)),
      notice: `Signed in as ${account}. Password stays on this screen — hand the computer back when you're done.`,
      bots: get().bots.map((b) => ({
        ...b,
        screen:
          b.id === "sales" || b.screen === "salesforce-login" ? "salesforce-accounts" : b.screen,
        messages: b.messages.map((m) =>
          m.computer?.purpose === "salesforce-auth" && m.computer.state === "open"
            ? {
                ...m,
                computer: {
                  ...m.computer,
                  screen: "salesforce-accounts",
                  badge: "working",
                  detail: "Signed in. Choose I'm done and I'll read the accounts you own.",
                },
              }
            : m,
        ),
      })),
    });
  },

  takeOver: (cardId) => {
    const bot = get().bots.find((b) => b.id === get().activeId);
    const card = bot?.messages.find((m) => m.computer?.id === cardId)?.computer;
    set({
      panel: "drive",
      driveCardId: cardId,
      bots: patchBot(get().bots, get().activeId, (b) => ({
        ...b,
        screen: card?.screen ?? b.screen,
      })),
      notice: "You're driving the shared computer. Passwords stay on this screen.",
    });
  },

  handBack: (cardId) => {
    const state = get();
    const sf = state.connectors.find((c) => c.id === "salesforce");
    const bot = state.bots.find((b) => b.id === state.activeId);
    if (!bot) return;
    const card = bot.messages.find((m) => m.computer?.id === cardId)?.computer;
    if (!card || card.state === "done") {
      set({ panel: "watch", driveCardId: null });
      return;
    }

    if (card.purpose === "salesforce-auth" && !sf?.signedIn) {
      const note = msg(
        "Salesforce still isn't signed in, so I can't see the accounts you own. Take over the computer when you're ready, or tell me to draft from Hex only.",
      );
      set({
        panel: "watch",
        driveCardId: null,
        notice: "",
        bots: patchBot(state.bots, bot.id, (b) => append(b, note)),
      });
      return;
    }

    const doneCard: ComputerCard = { ...card, state: "done", badge: "done", detail: "Handed back. Salesforce is signed in." };
    const follow = msg(handoffReply());
    set({
      panel: "watch",
      driveCardId: null,
      notice: "",
      bots: patchBot(state.bots, bot.id, (b) => ({
        ...b,
        screen: "salesforce-accounts",
        timeLabel: "Now",
        messages: b.messages.map((m) =>
          m.computer?.id === cardId ? { ...m, computer: doneCard } : m,
        ).concat(follow),
      })),
    });
  },

  decideApproval: (messageId, approved) => {
    const state = get();
    const gmail = state.connectors.find((c) => c.id === "gmail");
    const text = approved
      ? gmail?.signedIn
        ? "Approved. Sent from Gmail in your voice. Only the drafts we already wrote — nothing else went out."
        : "Gmail isn't signed in, so I held the send. The drafts are still on the computer."
      : "Held. Nothing was sent. The drafts stay on the computer.";
    set({
      bots: patchBot(state.bots, state.activeId, (b) => {
        const messages = b.messages.map((m) =>
          m.id === messageId && m.approval
            ? { ...m, approval: { ...m.approval, state: approved ? "approved" : "denied" } as ApprovalCard }
            : m,
        );
        return append({ ...b, messages }, msg(text));
      }),
    });
  },

  createBot: (name, job) => {
    const id = uid("bot");
    const fresh: Bot = {
      id,
      name: name.trim(),
      job: job.trim(),
      color: "blue",
      shape: "circle",
      timeLabel: "Now",
      screen: "desktop",
      messages: [
        msg(
          `I'm ${name.trim()}. I'll use the shared computer — sign-ins and files are the same ones the other bots already have. ${connectionSentence(get().connectors)} What should I run?`,
        ),
      ],
    };
    set({
      bots: [fresh, ...get().bots],
      activeId: id,
      memoryByBot: { ...get().memoryByBot, [id]: "" },
      panel: "closed",
    });
  },

  renameActive: (name) => {
    const clean = name.trim();
    if (!clean) return;
    const id = get().activeId;
    set({
      bots: patchBot(get().bots, id, (b) =>
        append({ ...b, name: clean }, {
          id: uid("m"),
          role: "system",
          text: `Renamed to ${clean}`,
        }),
      ),
    });
  },

  addRoutine: (name, when, prompt) => {
    const routine: Routine = {
      id: uid("r"),
      botId: get().activeId,
      name: name.trim(),
      when: when.trim() || "When you run it",
      prompt: prompt.trim(),
    };
    set({ routines: [routine, ...get().routines] });
  },

  openFile: (path) => {
    set({
      bots: patchBot(get().bots, get().activeId, (b) => ({ ...b, screen: "files" })),
      panel: get().panel === "closed" ? "watch" : get().panel,
      notice: path,
    });
  },

  runCommand: (line) => {
    const input = line.trim();
    const state = get();
    const out = evalCommand(input, state.files);
    set({
      terminal: [...state.terminal, `bot@computer:~$ ${input || ""}`, ...out].slice(-80),
      bots: patchBot(state.bots, state.activeId, (b) => ({ ...b, screen: "terminal" })),
    });
  },

  send: async (text) => {
    const trimmed = text.trim();
    if (!trimmed || get().typing) return;
    const state = get();
    const bot = state.bots.find((b) => b.id === state.activeId);
    if (!bot) return;

    const userMessage: ChatMessage = { id: uid("m"), role: "user", text: trimmed };
    let nextBot = append(bot, userMessage);

    const renamed = parseRename(trimmed);
    if (renamed && bot.shape !== "group") {
      nextBot = append({ ...nextBot, name: renamed }, {
        id: uid("m"),
        role: "system",
        text: `Renamed to ${renamed}`,
      });
      set({ bots: patchBot(state.bots, bot.id, () => nextBot) });
      return;
    }

    if (/^remember that\b/i.test(trimmed)) {
      const memory = `${state.memoryByBot[bot.id] ?? ""}\n${trimmed.replace(/^remember that\s*/i, "")}`.trim();
      nextBot = append(
        nextBot,
        msg("Saved to this bot's memory. It stays with me — the other bots don't read it unless you tell them."),
      );
      set({
        memoryByBot: { ...state.memoryByBot, [bot.id]: memory },
        bots: patchBot(state.bots, bot.id, () => nextBot),
      });
      return;
    }

    if (/what('s| is) (connected|signed in)|which apps|what apps|show (me )?connections/.test(trimmed.toLowerCase())) {
      const installed = state.connectors.filter((c) => c.installed);
      const lines = installed.map(
        (c) =>
          `${c.name} — ${c.signedIn ? `signed in${c.account ? ` as ${c.account}` : ""}` : "needs sign-in"}`,
      );
      const notIn = state.connectors.filter((c) => !c.installed).map((c) => c.name);
      nextBot = append(
        nextBot,
        msg(
          `${lines.join("\n")}${notIn.length ? `\n\nNot installed: ${notIn.join(", ")}.` : ""}\n\nOne computer, shared by every bot. I only see a service after it's signed in.`,
        ),
      );
      set({ bots: patchBot(state.bots, bot.id, () => nextBot) });
      return;
    }

    const plan = planTurn(trimmed, state.connectors);
    set({
      typing: true,
      bots: patchBot(state.bots, bot.id, () => nextBot),
      panel: plan.handoff ? "watch" : state.panel,
    });
    if (plan.handoff) {
      set({
        bots: patchBot(get().bots, bot.id, (b) => ({ ...b, screen: plan.handoff?.screen ?? b.screen })),
      });
    }

    const history = nextBot.messages
      .filter((m) => m.role !== "system")
      .slice(-10)
      .map((m) => ({
        role: m.role,
        content: m.text,
      }));

    const environment = describeEnvironment({
      voice: state.voice,
      memory: state.memoryByBot[bot.id] ?? "",
      connectors: state.connectors,
      files: get().files,
      bot: nextBot,
    });

    let reply = plan.fallback;
    const settingsNow = currentAiSettings();
    try {
      if (settingsNow.selfHosted) throw new Error("self-hosted");
      const res = await askBot({
        data: {
          botName: nextBot.name,
          job: nextBot.job,
          environment,
          hint: plan.hint,
          messages: history,
          settings: settingsNow,
        },
      });
      if (res.ok) reply = res.text;
      else if (!reply) reply = res.error;
    } catch {
      if (!reply) reply = "Grok couldn't be reached. The computer state is unchanged.";
    }

    const computer: ComputerCard | undefined = plan.handoff
      ? { ...plan.handoff, id: uid("card"), state: "open" }
      : undefined;
    const approval: ApprovalCard | undefined = plan.approval
      ? {
          id: uid("appr"),
          state: "open",
          prompt: "Send this from Gmail? Drafts only — no extra recipients.",
        }
      : undefined;

    const assistant = msg(reply, { computer, approval });
    set({
      typing: false,
      bots: patchBot(get().bots, bot.id, (b) => append(b, assistant)),
    });
  },
}));

function msg(text: string, extra?: Partial<ChatMessage>): ChatMessage {
  return { id: uid("m"), role: "assistant", text, ...extra };
}

function upsertFile(files: VFile[], path: string, body: string): VFile[] {
  const next = files.filter((f) => f.path !== path);
  return [{ path, body }, ...next];
}

function evalCommand(input: string, files: VFile[]): string[] {
  if (!input) return [];
  const [cmd, ...rest] = input.split(/\s+/);
  const arg = rest.join(" ");
  if (cmd === "help") {
    return ["ls, pwd, whoami, date, cat <file>, open <file>", "Passwords are not on this machine."];
  }
  if (cmd === "pwd") return ["/home/bot"];
  if (cmd === "whoami") return ["bot  (shared computer — every teammate sees these files)"];
  if (cmd === "date") return [new Date().toUTCString()];
  if (cmd === "ls") {
    const dirs = new Set<string>();
    for (const f of files) {
      const slash = f.path.indexOf("/");
      dirs.add(slash === -1 ? f.path : f.path.slice(0, slash) + "/");
    }
    return [[...dirs].sort().join("  ") || "(empty)"];
  }
  if (cmd === "cat" || cmd === "open") {
    const file = files.find((f) => f.path === arg || f.path.endsWith("/" + arg));
    if (!file) return [`No such file: ${arg || "(missing path)"}`];
    return file.body.split("\n");
  }
  return [`${cmd}: command not found. Try help.`];
}

export function bindPersistence() {
  useBotStore.getState().hydrate();
  return useBotStore.subscribe((state) => {
    writeSaved(state);
  });
}

export function activeBot(s: BotState): Bot | undefined {
  return s.bots.find((b) => b.id === s.activeId) ?? s.bots[0];
}
