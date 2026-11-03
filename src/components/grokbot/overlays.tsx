import { AI_MODELS, useAiSettings } from "@/lib/agents/ai-settings";
import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import type { Connector } from "@/lib/agents/model";
import { connectionSentence } from "@/lib/agents/model";
import { useBotStore, type ThemeName } from "@/lib/agents/store";

export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-os/40 p-3 md:items-center" role="presentation" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-surface p-4 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-inset">
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function NewBotDialog({ onClose }: { onClose: () => void }) {
  const createBot = useBotStore((s) => s.createBot);
  const [name, setName] = useState("");
  const [job, setJob] = useState("Research, draft, and stop before anything is sent.");
  const presets = [
    ["Research", "Read what's already signed in and come back with a short brief. Do not send."],
    ["Inbox", "Clear mail. Park what isn't mine. Never send."],
    ["Outreach", "Draft email and LinkedIn in my voice. Salesforce for accounts I own. Never send without approval."],
  ] as const;

  return (
    <Dialog title="New bot" onClose={onClose}>
      <label className="mb-3 block text-sm">
        <span className="mb-1 block text-muted">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Bug Reproduction"
          className="h-11 w-full rounded-xl border border-line bg-inset px-3 outline-none"
        />
      </label>
      <div className="mb-3 flex flex-wrap gap-2">
        {presets.map(([label, value]) => (
          <button
            key={label}
            type="button"
            onClick={() => setJob(value)}
            className="h-9 rounded-full bg-inset px-3 text-xs font-medium"
          >
            {label}
          </button>
        ))}
      </div>
      <label className="mb-4 block text-sm">
        <span className="mb-1 block text-muted">Job</span>
        <textarea
          value={job}
          onChange={(e) => setJob(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-line bg-inset px-3 py-2 outline-none"
        />
      </label>
      <button
        type="button"
        disabled={!name.trim() || !job.trim()}
        onClick={() => {
          createBot(name, job);
          onClose();
        }}
        className="h-11 w-full rounded-full bg-ink text-sm font-medium text-ink-fg disabled:opacity-40"
      >
        Create bot
      </button>
    </Dialog>
  );
}

export function RenameDialog({ onClose }: { onClose: () => void }) {
  const bot = useBotStore((s) => s.bots.find((b) => b.id === s.activeId));
  const rename = useBotStore((s) => s.renameActive);
  const [name, setName] = useState(bot?.name ?? "");
  return (
    <Dialog title="Rename" onClose={onClose}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-4 h-11 w-full rounded-xl border border-line bg-inset px-3 outline-none"
      />
      <button
        type="button"
        disabled={!name.trim()}
        onClick={() => {
          rename(name);
          onClose();
        }}
        className="h-11 w-full rounded-full bg-ink text-sm font-medium text-ink-fg disabled:opacity-40"
      >
        Rename
      </button>
    </Dialog>
  );
}

export function AiSettingsDialog({ onClose }: { onClose: () => void }) {
  const st = useAiSettings();
  const pill = (on: boolean) =>
    "rounded-lg px-3 py-1.5 text-sm " + (on ? "bg-fg text-surface" : "bg-inset text-fg hover:opacity-80");
  return (
    <Dialog title="AI settings" onClose={onClose}>
      <p className="mb-2 text-xs font-medium text-muted">Model</p>
      <div className="mb-4 flex flex-col gap-1.5">
        {AI_MODELS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => st.update({ model: m.id })}
            className={"flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm " + (st.model === m.id ? "bg-fg text-surface" : "bg-inset text-fg")}
          >
            <span className="font-medium">{m.label}</span>
            <span className="text-xs opacity-70">{m.note}</span>
          </button>
        ))}
      </div>
      <p className="mb-2 text-xs font-medium text-muted">Reply length</p>
      <div className="mb-4 flex gap-2">
        {(["short", "medium", "long"] as const).map((l) => (
          <button key={l} type="button" className={pill(st.length === l)} onClick={() => st.update({ length: l })}>
            {l[0].toUpperCase() + l.slice(1)}
          </button>
        ))}
      </div>
      <p className="mb-2 text-xs font-medium text-muted">Tone</p>
      <div className="mb-4 flex gap-2">
        {([["coworker", "Coworker"], ["friendly", "Friendly"], ["formal", "Formal"]] as const).map(([t, label]) => (
          <button key={t} type="button" className={pill(st.tone === t)} onClick={() => st.update({ tone: t })}>
            {label}
          </button>
        ))}
      </div>
      <label className="mb-4 flex items-center justify-between gap-3 text-sm">
        <span>
          <span className="block font-medium">Visa consultant knowledge</span>
          <span className="text-xs text-muted">Poland & Europe work visa guidance, no prices, no guarantees</span>
        </span>
        <input type="checkbox" className="size-5" checked={st.visaKnowledge} onChange={(e) => st.update({ visaKnowledge: e.target.checked })} />
      </label>
      <p className="mb-2 text-xs font-medium text-muted">Extra instructions</p>
      <textarea
        value={st.extra}
        onChange={(e) => st.update({ extra: e.target.value })}
        rows={3}
        maxLength={1000}
        placeholder="e.g. Always answer in Bangla"
        className="w-full rounded-lg border border-line bg-inset p-2 text-sm text-fg"
      />
    </Dialog>
  );
}

export function ProfileDialog({ onClose }: { onClose: () => void }) {
  const theme = useBotStore((s) => s.theme);
  const setTheme = useBotStore((s) => s.setTheme);
  const connectors = useBotStore((s) => s.connectors);
  const voice = useBotStore((s) => s.voice);
  return (
    <Dialog title="Armand Segall" onClose={onClose}>
      <p className="mb-3 text-sm text-muted">
        One shared computer. {connectionSentence(connectors)}
      </p>
      <p className="mb-2 text-xs font-medium text-muted">Theme</p>
      <div className="mb-4 flex gap-2">
        <ThemeBtn name="light" current={theme} label="White" onPick={setTheme} />
        <ThemeBtn name="dark" current={theme} label="Dark" onPick={setTheme} />
      </div>
      <p className="mb-1 text-xs font-medium text-muted">Your voice</p>
      <p className="mb-4 text-sm">{voice}</p>
      <ul className="flex flex-col gap-1.5">
        {connectors.map((c) => (
          <li key={c.id} className="flex items-center justify-between text-sm">
            <span>{c.name}</span>
            <Status c={c} />
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

function ThemeBtn({
  name,
  current,
  label,
  onPick,
}: {
  name: ThemeName;
  current: ThemeName;
  label: string;
  onPick: (t: ThemeName) => void;
}) {
  const on = name === current;
  return (
    <button
      type="button"
      onClick={() => onPick(name)}
      className={
        "h-10 flex-1 rounded-full text-sm font-medium " +
        (on ? "bg-ink text-ink-fg" : "bg-inset text-fg")
      }
    >
      {label}
    </button>
  );
}

function Status({ c }: { c: Connector }) {
  const label = !c.installed ? "Not installed" : c.signedIn ? "Signed in" : "Needs auth";
  return <span className="text-xs text-muted">{label}</span>;
}

export function AppsDialog({ onClose }: { onClose: () => void }) {
  const connectors = useBotStore((s) => s.connectors);
  const install = useBotStore((s) => s.installConnector);
  const setConnector = useBotStore((s) => s.setConnector);
  const setPanel = useBotStore((s) => s.setPanel);
  const setScreen = useBotStore((s) => s.setScreen);
  return (
    <Dialog title="Connect apps" onClose={onClose}>
      <p className="mb-3 text-sm text-muted">
        Installed is not signed in. A connected app is available to every bot on this computer.
      </p>
      <ul className="flex flex-col gap-2">
        {connectors.map((c) => (
          <li key={c.id} className="rounded-xl border border-line p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted">{c.blurb}</p>
                {c.account && c.signedIn && (
                  <p className="mt-1 text-xs text-muted">As {c.account}</p>
                )}
              </div>
              <Status c={c} />
            </div>
            <div className="mt-2 flex gap-2">
              {!c.installed && (
                <button
                  type="button"
                  onClick={() => install(c.id)}
                  className="h-9 rounded-full bg-ink px-3 text-xs font-medium text-ink-fg"
                >
                  Add
                </button>
              )}
              {c.installed && !c.signedIn && c.id === "salesforce" && (
                <button
                  type="button"
                  onClick={() => {
                    setScreen("salesforce-login");
                    setPanel("drive");
                    onClose();
                  }}
                  className="h-9 rounded-full bg-ink px-3 text-xs font-medium text-ink-fg"
                >
                  Authenticate
                </button>
              )}
              {c.installed && !c.signedIn && c.id !== "salesforce" && (
                <button
                  type="button"
                  onClick={() =>
                    setConnector(c.id, { signedIn: true, account: "armand@segall.co" })
                  }
                  className="h-9 rounded-full bg-ink px-3 text-xs font-medium text-ink-fg"
                >
                  Authenticate
                </button>
              )}
              {c.signedIn && (
                <button
                  type="button"
                  onClick={() => setConnector(c.id, { signedIn: false, account: undefined })}
                  className="h-9 rounded-full bg-inset px-3 text-xs font-medium"
                >
                  Disconnect
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

export function RoutinesDialog({ onClose }: { onClose: () => void }) {
  const routines = useBotStore((s) => s.routines);
  const bots = useBotStore((s) => s.bots);
  const add = useBotStore((s) => s.addRoutine);
  const send = useBotStore((s) => s.send);
  const setActive = useBotStore((s) => s.setActive);
  const activeId = useBotStore((s) => s.activeId);
  const [name, setName] = useState("");
  const [when, setWhen] = useState("Weekdays 8:00");
  const [prompt, setPrompt] = useState("");

  return (
    <Dialog title="Routines" onClose={onClose}>
      <ul className="mb-4 flex flex-col gap-2">
        {routines.filter((r) => r.botId === activeId).length === 0 && (
          <li className="text-sm text-muted">No routines on this bot yet.</li>
        )}
        {routines
          .filter((r) => r.botId === activeId)
          .map((r) => (
            <li key={r.id} className="rounded-xl border border-line p-3">
              <p className="text-sm font-medium">{r.name}</p>
              <p className="text-xs text-muted">{r.when}</p>
              <p className="mt-1 text-xs text-muted">{r.prompt}</p>
              <button
                type="button"
                onClick={() => {
                  const owner = bots.find((b) => b.id === r.botId);
                  if (owner) setActive(owner.id);
                  onClose();
                  void send(r.prompt);
                }}
                className="mt-2 h-9 rounded-full bg-ink px-3 text-xs font-medium text-ink-fg"
              >
                Run now
              </button>
            </li>
          ))}
      </ul>
      <p className="mb-2 text-xs font-medium text-muted">New routine for this bot</p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        className="mb-2 h-10 w-full rounded-xl border border-line bg-inset px-3 text-sm outline-none"
      />
      <input
        value={when}
        onChange={(e) => setWhen(e.target.value)}
        placeholder="When"
        className="mb-2 h-10 w-full rounded-xl border border-line bg-inset px-3 text-sm outline-none"
      />
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="What should it ask the bot?"
        rows={3}
        className="mb-3 w-full rounded-xl border border-line bg-inset px-3 py-2 text-sm outline-none"
      />
      <button
        type="button"
        disabled={!name.trim() || !prompt.trim()}
        onClick={() => {
          add(name, when, prompt);
          setName("");
          setPrompt("");
        }}
        className="h-10 w-full rounded-full bg-inset text-sm font-medium disabled:opacity-40"
      >
        Save routine
      </button>
    </Dialog>
  );
}

export function FilesDialog({ onClose }: { onClose: () => void }) {
  const files = useBotStore((s) => s.files);
  const setScreen = useBotStore((s) => s.setScreen);
  const openFile = useBotStore((s) => s.openFile);
  return (
    <Dialog title="Files on the computer" onClose={onClose}>
      <p className="mb-3 text-sm text-muted">Every bot can read these. They're on the shared computer, not your laptop.</p>
      <ul className="flex flex-col gap-1">
        {files.map((f) => (
          <li key={f.path}>
            <button
              type="button"
              onClick={() => {
                setScreen("files");
                openFile(f.path);
                onClose();
              }}
              className="w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-inset"
            >
              {f.path}
            </button>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
