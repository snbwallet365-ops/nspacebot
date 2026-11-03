export type AvatarColor = "mint" | "amber" | "iris" | "blue" | "coral" | "violet";

export type BotShape = "circle" | "triangle" | "group";

export type ConnectorId =
  | "hex"
  | "gmail"
  | "linkedin"
  | "salesforce"
  | "calendar"
  | "slack"
  | "notion"
  | "linear";

export type ScreenKind =
  | "desktop"
  | "salesforce-login"
  | "salesforce-accounts"
  | "gmail"
  | "linkedin"
  | "hex"
  | "calendar"
  | "files"
  | "terminal"
  | "browser";

export type Connector = {
  id: ConnectorId;
  name: string;
  blurb: string;
  installed: boolean;
  signedIn: boolean;
  account?: string;
};

export type VFile = {
  path: string;
  body: string;
};

export type ComputerCard = {
  id: string;
  headline: string;
  detail: string;
  badge: "action" | "working" | "done";
  screen: ScreenKind;
  purpose: "salesforce-auth";
  state: "open" | "done";
};

export type ApprovalCard = {
  id: string;
  prompt: string;
  state: "open" | "approved" | "denied";
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  fromBotId?: string;
  computer?: ComputerCard;
  approval?: ApprovalCard;
};

export type Bot = {
  id: string;
  name: string;
  job: string;
  color: AvatarColor;
  shape: BotShape;
  members?: AvatarColor[];
  timeLabel: string;
  screen: ScreenKind;
  messages: ChatMessage[];
};

export type Routine = {
  id: string;
  botId: string;
  name: string;
  when: string;
  prompt: string;
};

export type Account = {
  name: string;
  amount: string;
  stage: string;
  contact: string;
};

export const ACCOUNTS: Account[] = [
  { name: "Northwind Labs", amount: "$84,000", stage: "Negotiation", contact: "Priya Raman" },
  { name: "Globex Industrial", amount: "$41,000", stage: "Discovery", contact: "Vicky Chen" },
  { name: "Initech", amount: "$22,000", stage: "Proposal", contact: "Vicky Chen" },
  { name: "Helios Bio", amount: "$120,000", stage: "Verbal", contact: "Jonah Ellis" },
];

export const HEX_NOTES = [
  "Northwind Labs — last touch Tuesday, stage rumor: negotiation. Amount is in Salesforce.",
  "Globex Industrial — discovery. Contact on the thread is Vicky.",
  "Initech — proposal. Same Vicky thread.",
  "Helios Bio — verbal. Do not email until the security note is parked.",
];

export const GMAIL_DRAFTS = [
  { from: "Helios Bio", subject: "Security review follow-up", state: "Parked" },
  { from: "Helios Bio", subject: "Thursday hold", state: "Parked" },
  { from: "Northwind AP", subject: "Invoice 441", state: "Parked" },
  { from: "Dana Cho", subject: "Intro: design candidate", state: "Parked" },
  { from: "Offsite crew", subject: "Cedar room", state: "Parked" },
];

export const USER_NAME = "Armand Segall";

export const DEFAULT_VOICE =
  "Short, direct, no hype, no exclamation marks. Sign drafts — Armand.";

export function listJoin(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export function connectionSentence(connectors: Connector[]): string {
  const relevant = connectors.filter((c) =>
    ["hex", "gmail", "linkedin", "salesforce", "calendar"].includes(c.id),
  );
  const signed = relevant.filter((c) => c.installed && c.signedIn).map((c) => c.name);
  const missing = relevant.filter((c) => c.installed && !c.signedIn).map((c) => c.name);
  const signedBit =
    signed.length === 0
      ? "Nothing is signed in yet."
      : `${listJoin(signed)} ${signed.length === 1 ? "is" : "are"} already signed in.`;
  if (missing.length === 0) return signedBit;
  const missBit = `${listJoin(missing)} ${missing.length === 1 ? "isn't" : "aren't"}.`;
  return `${signedBit} ${missBit}`;
}

export function salesforceDetail(account?: string): string {
  return account
    ? `Signed in as ${account}. These are the accounts you own.`
    : "Sign in to Salesforce so I can see the accounts you own.";
}

export function sequenceFileBody(account: string): string {
  return [
    `Salesforce session: ${account}`,
    "",
    "Accounts you own",
    ...ACCOUNTS.map((a) => `- ${a.name} — ${a.amount}, ${a.stage}, ${a.contact}`),
    "",
    "Email drafts (not sent)",
    "Priya — Northwind is in negotiation. I'll send the one-pager and two times on Thursday.",
    "— Armand",
    "",
    "Vicky — Globex is still discovery. One question on the plant rollout, then I'll stay out of the thread.",
    "— Armand",
    "",
    "Jonah — Helios is verbal. Holding the note until the security draft is cleared.",
    "— Armand",
    "",
    "LinkedIn drafts (not sent)",
    "Priya, picking up the Northwind thread. I have Thursday. Worth 15 minutes?",
    "Vicky, left a short note on Globex. Happy to keep it to one question.",
    "Jonah, Helios stays quiet until the security note is parked.",
  ].join("\n");
}

export function handoffReply(): string {
  return `Salesforce is signed in. These are the accounts you own:\n\n${ACCOUNTS.map(
    (a) => `${a.name} — ${a.amount}, ${a.stage}, ${a.contact}`,
  ).join(
    "\n",
  )}\n\nEmail and LinkedIn drafts are on the computer in Outreach/q4-sequences.md. Nothing has been sent.\n\nPriya — Northwind is in negotiation. I'll send the one-pager and two times on Thursday.\n— Armand\n\nVicky — Globex is still discovery. One question on the plant rollout, then I'll stay out of the thread.\n— Armand\n\nLinkedIn: Priya, picking up the Northwind thread. I have Thursday. Worth 15 minutes?`;
}

export type Plan = {
  hint: string;
  fallback: string;
  handoff?: Omit<ComputerCard, "id" | "state">;
  approval?: boolean;
};

export function planTurn(text: string, connectors: Connector[]): Plan {
  const t = text.toLowerCase();
  const sf = connectors.find((c) => c.id === "salesforce");
  const skipSf = /without salesforce|skip salesforce|hex only|from hex only/.test(t);
  const wantsSf =
    !skipSf &&
    /\bsalesforce\b|\bcrm\b|\baccounts i own\b|\baccounts you own\b|\bpipeline\b/.test(t);

  if (wantsSf && sf && !sf.signedIn) {
    return {
      handoff: {
        headline: "Computer",
        detail: "Sign in to Salesforce so I can see the accounts you own.",
        badge: "action",
        screen: "salesforce-login",
        purpose: "salesforce-auth",
      },
      hint: "Salesforce is not signed in. Say what is connected in one or two sentences. Do not invent account names, amounts, stages, or claim a send. The app attaches the computer card.",
      fallback: `Checking what's connected. ${connectionSentence(
        connectors.filter((c) => ["hex", "gmail", "linkedin", "salesforce"].includes(c.id)),
      )}`,
    };
  }

  const negated =
    /\b(do not|don't|dont|never|without)\s+send\b/.test(t) || /\bnot\s+send\b/.test(t);
  if (!negated && (/\bsend\b/.test(t) || /\bship it\b/.test(t) || /\bemail them\b/.test(t))) {
    const gmail = connectors.find((c) => c.id === "gmail");
    return {
      approval: true,
      hint: "The user wants a send. Do not claim anything was sent. Say you are holding it for approval. Keep it to two sentences.",
      fallback: gmail?.signedIn
        ? "I'm holding the send. Approve it and it goes through Gmail. Nothing leaves until you do."
        : "Gmail isn't signed in, so I can't send. I can still leave the drafts on the computer.",
    };
  }

  const signed = sf?.signedIn
    ? `Salesforce is signed in as ${sf.account}. You may cite only these accounts: ${ACCOUNTS.map(
        (a) => `${a.name} ${a.amount} ${a.stage} ${a.contact}`,
      ).join("; ")}.`
    : "Salesforce is not signed in. You cannot see who owns accounts or any amounts.";

  return {
    hint: `${signed} Use only the environment snapshot. If a fact is missing, say so. Never claim you sent, paid, or deleted anything. Plain sentences, under 120 words.`,
    fallback: "",
  };
}

export function describeEnvironment(input: {
  voice: string;
  memory: string;
  connectors: Connector[];
  files: VFile[];
  bot: Bot;
}): string {
  const sf = input.connectors.find((c) => c.id === "salesforce");
  const lines = [
    `User: ${USER_NAME}`,
    `Voice for drafts: ${input.voice}`,
    `This bot: ${input.bot.name}`,
    `Job: ${input.bot.job}`,
    `Memory: ${input.memory || "none"}`,
    "Shared computer: one machine for every bot. Browser sign-ins, files, and terminal are shared. Each bot has its own screen.",
    "Apps:",
    ...input.connectors.map((c) => {
      const status = !c.installed
        ? "not installed"
        : c.signedIn
          ? `signed in${c.account ? ` as ${c.account}` : ""}`
          : "installed, needs sign-in";
      return `- ${c.name}: ${status}. ${c.blurb}`;
    }),
    "Files:",
    ...input.files.map((f) => `- ${f.path}`),
    "Hex notes (no ownership, no amounts):",
    ...HEX_NOTES.map((n) => `- ${n}`),
    "Gmail right now: inbox at zero, 5 drafts parked (Helios x2, Northwind invoice, Dana intro, offsite).",
    "Calendar: Cedar room, Friday the 9th, 14 people. Hold already sent.",
    "LinkedIn: intros and sequences stay drafts until an approval.",
  ];
  if (sf?.signedIn) {
    lines.push("Salesforce accounts this user owns:");
    for (const a of ACCOUNTS) {
      lines.push(`- ${a.name} — ${a.amount}, ${a.stage}, ${a.contact}`);
    }
  } else {
    lines.push("Salesforce accounts: hidden. Do not guess them.");
  }
  return lines.join("\n");
}

export function parseRename(text: string): string | null {
  const m = text.match(/^\s*rename(?:\s+(?:yourself|this bot|you))?\s+to\s+(.+)$/i);
  const name = m?.[1]?.trim().replace(/[.!]+$/, "");
  if (!name || name.length > 40) return null;
  return name;
}

export function previewText(bot: Bot): string {
  const last = [...bot.messages].reverse().find((m) => m.role !== "system" && m.text.trim());
  return last?.text.replace(/\s+/g, " ").trim() || "No messages yet";
}

export function statusFor(bot: Bot, connectors: Connector[]): string {
  const sf = connectors.find((c) => c.id === "salesforce");
  switch (bot.screen) {
    case "salesforce-login":
      return "Waiting for you · Salesforce sign-in";
    case "salesforce-accounts":
      return sf?.account ? `On Salesforce · ${sf.account}` : "On Salesforce · accounts you own";
    case "gmail":
      return "On Gmail · drafts, inbox at zero";
    case "linkedin":
      return "On LinkedIn · drafts only";
    case "hex":
      return "On Hex · Q4 pipeline combo";
    case "calendar":
      return "On Calendar · cedar room hold";
    case "files":
      return "On the shared files";
    case "terminal":
      return "On the terminal";
    case "browser":
      return "On the browser";
    default:
      return "Computer is idle on this screen";
  }
}

const connectors: Connector[] = [
  {
    id: "hex",
    name: "Hex",
    blurb: "Notebooks and the Q4 pipeline combo. No ownership data.",
    installed: true,
    signedIn: true,
    account: USER_NAME,
  },
  {
    id: "gmail",
    name: "Gmail",
    blurb: "Reads mail and holds drafts. Sends only after you approve.",
    installed: true,
    signedIn: true,
    account: "armand@segall.co",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    blurb: "Profiles and message drafts. Nothing sends without approval.",
    installed: true,
    signedIn: true,
    account: USER_NAME,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    blurb: "Accounts you own, stages, and amounts.",
    installed: true,
    signedIn: false,
  },
  {
    id: "calendar",
    name: "Calendar",
    blurb: "Holds and invites on the shared calendar.",
    installed: true,
    signedIn: true,
    account: "armand@segall.co",
  },
  {
    id: "slack",
    name: "Slack",
    blurb: "Channels and DMs.",
    installed: false,
    signedIn: false,
  },
  {
    id: "notion",
    name: "Notion",
    blurb: "Docs and wikis.",
    installed: false,
    signedIn: false,
  },
  {
    id: "linear",
    name: "Linear",
    blurb: "Issues and project work.",
    installed: false,
    signedIn: false,
  },
];

const files: VFile[] = [
  {
    path: "Outreach/q4-sequences.md",
    body: "Empty until Salesforce is connected. Hex has names only — ownership and amounts stay in Salesforce.\n",
  },
  {
    path: "Ops/offsite-venue.txt",
    body: "Cedar room, Friday the 9th, 14 people. Calendar hold sent under Armand Segall.\n",
  },
  {
    path: "Finance/sept-expenses.csv",
    body: "date,merchant,amount,status\n2026-09-02,City taxi,42,filed\n2026-09-04,Cedar room deposit,600,filed\n2026-09-09,Print shop,18,filed\n2026-09-11,Client dinner,126,filed\n2026-09-14,Train,64,filed\n2026-09-18,Software,29,filed\n2026-09-21,Courier,15,filed\n2026-09-25,Office lunch,48,filed\n2026-09-28,Parking,22,filed\n",
  },
  {
    path: "Hiring/intros.md",
    body: "Three intros drafted in Armand's voice. Not sent.\n1. Dana — design, held.\n2. Chris — design, held.\n3. Noor — design, held.\n",
  },
];

function msg(id: string, role: ChatMessage["role"], text: string, extra?: Partial<ChatMessage>): ChatMessage {
  return { id, role, text, ...extra };
}

export function seedBots(): Bot[] {
  return [
    {
      id: "chief",
      name: "Chief",
      job: "Chief of staff. Book, schedule, and surface decisions. Do not fan out work the other bots already own.",
      color: "mint",
      shape: "circle",
      timeLabel: "Yesterday",
      screen: "calendar",
      messages: [
        msg("c1", "user", "Book the offsite venue we liked and send the hold."),
        msg(
          "c2",
          "assistant",
          "booked the venue and sent the calendar hold. Friday the 9th, the cedar room, 14 people. Calendar was already signed in, so the invite went out under your name.",
        ),
      ],
    },
    {
      id: "sales",
      name: "Sales Outbound",
      job: "Research accounts, score the pipeline, and draft email plus LinkedIn sequences in Armand's voice. Never send without approval. Salesforce is the source of accounts he owns.",
      color: "amber",
      shape: "circle",
      timeLabel: "2:02 PM",
      screen: "salesforce-login",
      messages: [
        msg(
          "s1",
          "user",
          "Pull the Q4 pipeline combo, and Salesforce. Draft email and LinkedIn sequences in my voice.",
        ),
        msg("s2", "system", "Renamed to Sales Outbound"),
        msg(
          "s3",
          "assistant",
          "Checking what's connected. Hex, Gmail, and LinkedIn are already signed in. Salesforce isn't.",
          {
            computer: {
              id: "card-sf",
              headline: "Computer",
              detail: "Sign in to Salesforce so I can see the accounts you own.",
              badge: "action",
              screen: "salesforce-login",
              purpose: "salesforce-auth",
              state: "open",
            },
          },
        ),
      ],
    },
    {
      id: "inbox",
      name: "Inbox Manager",
      job: "Clear mail. Park anything that is not Armand's to answer. Never send.",
      color: "iris",
      shape: "triangle",
      timeLabel: "11:02 AM",
      screen: "gmail",
      messages: [
        msg("i1", "user", "Clear overnight mail. Park anything that isn't mine to answer."),
        msg(
          "i2",
          "assistant",
          "sent. inbox at zero, 5 drafts parked for you — two from Helios, one vendor invoice, a intro from Dana, and the offsite thread. Nothing needed a send.",
        ),
      ],
    },
    {
      id: "account",
      name: "Account Manager",
      job: "Keep live accounts warm. Draft notes. Do not send until Armand approves.",
      color: "violet",
      shape: "circle",
      timeLabel: "9:02 AM",
      screen: "linkedin",
      messages: [
        msg("a1", "user", "Check Globex and get Vicky the note."),
        msg(
          "a2",
          "assistant",
          "invite's out to vicky. globex note is in the draft folder, not sent. Renewal stays in discovery until Salesforce is connected.",
        ),
      ],
    },
    {
      id: "talent",
      name: "Talent Scout",
      job: "Find candidates and draft intros in Armand's voice. Never contact anyone automatically.",
      color: "blue",
      shape: "circle",
      timeLabel: "6:02 AM",
      screen: "gmail",
      messages: [
        msg("t1", "user", "Draft intros for the three design candidates."),
        msg(
          "t2",
          "assistant",
          "3 intros drafted in your voice, held for approval. No one has been contacted. They're in Hiring/intros.md.",
        ),
      ],
    },
    {
      id: "expense",
      name: "Expense Manager",
      job: "Match receipts and file the report. Flag anything that doesn't belong.",
      color: "coral",
      shape: "circle",
      timeLabel: "10:02 AM",
      screen: "hex",
      messages: [
        msg("e1", "user", "Close September."),
        msg(
          "e2",
          "assistant",
          "report filed. 9 receipts, nothing outstanding. The sheet is on the computer at Finance/sept-expenses.csv.",
        ),
      ],
    },
    {
      id: "offsite",
      name: "Offsite crew",
      job: "A crew thread for the offsite. Chief, Sales, and Account compare notes. Do not send external messages.",
      color: "mint",
      shape: "group",
      members: ["mint", "violet"],
      timeLabel: "8:02 AM",
      screen: "desktop",
      messages: [
        msg("o1", "assistant", "cedar room is held for Friday. 14 people.", { fromBotId: "chief" }),
        msg(
          "o2",
          "assistant",
          "that leaves the pipeline. i'd spin a short sequence for the names already in Hex, and wait on Salesforce for the accounts you own.",
          { fromBotId: "sales" },
        ),
        msg("o3", "user", "Do that. Don't send anything."),
      ],
    },
  ];
}

export function seedConnectors(): Connector[] {
  return connectors.map((c) => ({ ...c }));
}

export function seedFiles(): VFile[] {
  return files.map((f) => ({ ...f }));
}

export function seedRoutines(): Routine[] {
  return [
    {
      id: "r1",
      botId: "sales",
      name: "Weekday pipeline check",
      when: "Weekdays 8:00",
      prompt:
        "Check the pipeline. If Salesforce is signed in, list the accounts I own. Do not send anything.",
    },
  ];
}

export function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
