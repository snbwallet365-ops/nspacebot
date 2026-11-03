import { useState, type FormEvent, type ReactNode } from "react";
import { Folder, Globe, Terminal } from "lucide-react";
import {
  ACCOUNTS,
  GMAIL_DRAFTS,
  HEX_NOTES,
  type ScreenKind,
} from "@/lib/agents/model";
import { useBotStore } from "@/lib/agents/store";

export function ScreenStage({
  screen,
  live,
  compact,
}: {
  screen: ScreenKind;
  live?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={
        "relative overflow-hidden bg-os " +
        (compact ? "h-52 rounded-xl" : "h-full min-h-64 rounded-xl")
      }
    >
      <img
        src="/wallpaper.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="relative flex h-full items-center justify-center p-3">
        {screen === "desktop" && <DesktopHint compact={compact} />}
        {screen === "salesforce-login" && <LoginWindow live={!!live} compact={!!compact} />}
        {screen === "salesforce-accounts" && <AccountsWindow compact={!!compact} />}
        {screen === "gmail" && <MailWindow compact={!!compact} />}
        {screen === "linkedin" && <LinkedInWindow compact={!!compact} />}
        {screen === "hex" && <HexWindow compact={!!compact} />}
        {screen === "calendar" && <CalendarWindow compact={!!compact} />}
        {screen === "files" && <FilesWindow live={!!live} compact={!!compact} />}
        {screen === "terminal" && <TerminalWindow live={!!live} compact={!!compact} />}
        {screen === "browser" && <BrowserWindow live={!!live} compact={!!compact} />}
      </div>
    </div>
  );
}

function Window({
  title,
  children,
  dark,
  compact,
}: {
  title: string;
  children: ReactNode;
  dark?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={
        "w-full max-w-md overflow-hidden rounded-xl shadow-lg " +
        (dark ? "bg-os text-os-fg" : "border border-line bg-surface text-fg") +
        (compact ? " max-w-[280px]" : "")
      }
    >
      <div
        className={
          "flex items-center gap-2 px-3 py-2 " + (dark ? "border-b border-os-line" : "border-b border-line")
        }
      >
        <span className="flex gap-1" aria-hidden="true">
          <span className="size-2 rounded-full bg-traffic-red" />
          <span className="size-2 rounded-full bg-traffic-yellow" />
          <span className="size-2 rounded-full bg-traffic-green" />
        </span>
        <span className={"truncate text-xs " + (dark ? "text-os-muted" : "text-muted")}>{title}</span>
      </div>
      <div className={compact ? "p-3" : "p-4"}>{children}</div>
    </div>
  );
}

function DesktopHint({ compact }: { compact?: boolean }) {
  return (
    <Window title="Computer" compact={compact}>
      <p className="text-sm text-fg">This screen is idle.</p>
      {!compact && (
        <p className="mt-1 text-sm text-muted">
          Open the browser, files, or terminal from the dock. Sign-ins here are shared with every bot.
        </p>
      )}
    </Window>
  );
}

function LoginWindow({ live, compact }: { live: boolean; compact: boolean }) {
  const signIn = useBotStore((s) => s.signInSalesforce);
  const signed = useBotStore((s) => s.connectors.find((c) => c.id === "salesforce")?.signedIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (signed) {
    return <AccountsWindow compact={compact} />;
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!live) return;
    if (!email.includes("@") || password.length < 4) {
      setError("Use an email and a password of at least 4 characters.");
      return;
    }
    setError("");
    signIn(email);
    setPassword("");
  }

  return (
    <Window title="Salesforce" dark compact={compact}>
      <form onSubmit={submit} className="flex flex-col items-center">
        <span className="mb-3 grid size-8 place-items-center rounded-full bg-os-line" aria-hidden="true" />
        {live ? (
          <>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="off"
              aria-label="Salesforce email"
              className="mb-2 w-full rounded-md border border-os-line bg-os px-2 py-1.5 text-xs text-os-fg outline-none placeholder:text-os-muted"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              autoComplete="off"
              aria-label="Salesforce password"
              className="mb-2 w-full rounded-md border border-os-line bg-os px-2 py-1.5 text-xs text-os-fg outline-none placeholder:text-os-muted"
            />
            {error && <p className="mb-2 w-full text-xs text-warn">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-md bg-os-btn py-1.5 text-xs font-medium text-os-btn-fg"
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            <div className="mb-2 w-full rounded-md border border-os-line px-2 py-1.5 text-center text-xs text-os-muted">
              Email
            </div>
            <div className="mb-2 w-full rounded-md border border-os-line px-2 py-1.5 text-center text-xs text-os-muted">
              Password
            </div>
            <div className="w-full rounded-md bg-os-btn py-1.5 text-center text-xs font-medium text-os-btn-fg">
              Sign in
            </div>
          </>
        )}
      </form>
    </Window>
  );
}

function AccountsWindow({ compact }: { compact?: boolean }) {
  const account = useBotStore((s) => s.connectors.find((c) => c.id === "salesforce")?.account);
  return (
    <Window title={account ? `Salesforce · ${account}` : "Salesforce"} compact={compact}>
      <p className="mb-2 text-xs font-medium text-muted">Accounts you own</p>
      <ul className="flex flex-col gap-1.5">
        {(compact ? ACCOUNTS.slice(0, 3) : ACCOUNTS).map((a) => (
          <li key={a.name} className="flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate font-medium">{a.name}</span>
            <span className="shrink-0 text-muted tabular-nums">
              {a.amount} · {a.stage}
            </span>
          </li>
        ))}
      </ul>
    </Window>
  );
}

function MailWindow({ compact }: { compact?: boolean }) {
  return (
    <Window title="Gmail · Drafts" compact={compact}>
      <p className="mb-2 text-xs text-muted">Inbox at zero. Parked, not sent.</p>
      <ul className="flex flex-col gap-1.5">
        {(compact ? GMAIL_DRAFTS.slice(0, 3) : GMAIL_DRAFTS).map((t) => (
          <li key={t.subject} className="text-xs">
            <span className="font-medium">{t.from}</span>
            <span className="text-muted"> — {t.subject}</span>
          </li>
        ))}
      </ul>
    </Window>
  );
}

function LinkedInWindow({ compact }: { compact?: boolean }) {
  return (
    <Window title="LinkedIn · Drafts" compact={compact}>
      <ul className="flex flex-col gap-2 text-xs">
        <li>Priya Raman — Northwind. Draft, not sent.</li>
        {!compact && <li>Vicky Chen — Globex. Draft, not sent.</li>}
        <li>3 design intros — held in Hiring/intros.md.</li>
      </ul>
    </Window>
  );
}

function HexWindow({ compact }: { compact?: boolean }) {
  return (
    <Window title="Hex · Q4 pipeline" compact={compact}>
      <ul className="flex flex-col gap-1.5 text-xs">
        {(compact ? HEX_NOTES.slice(0, 2) : HEX_NOTES).map((n) => (
          <li key={n} className="text-fg">
            {n}
          </li>
        ))}
      </ul>
    </Window>
  );
}

function CalendarWindow({ compact }: { compact?: boolean }) {
  return (
    <Window title="Calendar" compact={compact}>
      <p className="text-sm font-medium">Cedar room</p>
      <p className="mt-1 text-xs text-muted">Friday the 9th · 14 people · hold sent as Armand Segall</p>
    </Window>
  );
}

function FilesWindow({ live, compact }: { live: boolean; compact: boolean }) {
  const files = useBotStore((s) => s.files);
  const openFile = useBotStore((s) => s.openFile);
  const notice = useBotStore((s) => s.notice);
  const selected = files.find((f) => f.path === notice) ?? null;
  return (
    <Window title="Files" compact={compact}>
      {!selected || compact ? (
        <ul className="flex flex-col gap-1">
          {(compact ? files.slice(0, 3) : files).map((f) => (
            <li key={f.path}>
              <button
                type="button"
                disabled={!live || compact}
                onClick={() => openFile(f.path)}
                className="w-full truncate rounded-md px-1 py-1 text-left text-xs hover:bg-inset disabled:hover:bg-transparent"
              >
                {f.path}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div>
          <button type="button" onClick={() => openFile("")} className="mb-2 text-xs text-muted">
            All files
          </button>
          <p className="mb-1 text-xs font-medium">{selected.path}</p>
          <pre className="max-h-48 overflow-auto text-xs leading-relaxed whitespace-pre-wrap text-fg">
            {selected.body}
          </pre>
        </div>
      )}
    </Window>
  );
}

function TerminalWindow({ live, compact }: { live: boolean; compact: boolean }) {
  const lines = useBotStore((s) => s.terminal);
  const run = useBotStore((s) => s.runCommand);
  const [line, setLine] = useState("");
  const shown = compact ? lines.slice(-4) : lines.slice(-12);
  return (
    <Window title="Terminal" dark compact={compact}>
      <pre className="max-h-40 overflow-auto font-mono text-xs leading-relaxed text-os-fg">
        {shown.join("\n")}
      </pre>
      {live && !compact && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(line);
            setLine("");
          }}
        >
          <input
            value={line}
            onChange={(e) => setLine(e.target.value)}
            aria-label="Terminal command"
            placeholder="ls"
            className="w-full rounded-md border border-os-line bg-os px-2 py-1 font-mono text-xs text-os-fg outline-none"
          />
          <button type="submit" className="rounded-md bg-os-btn px-2 text-xs font-medium text-os-btn-fg">
            Run
          </button>
        </form>
      )}
    </Window>
  );
}

function BrowserWindow({ live, compact }: { live: boolean; compact: boolean }) {
  const setScreen = useBotStore((s) => s.setScreen);
  const signed = useBotStore((s) => s.connectors.find((c) => c.id === "salesforce")?.signedIn);
  const [url, setUrl] = useState("https://");

  function go(e?: FormEvent) {
    e?.preventDefault();
    const u = url.toLowerCase();
    if (u.includes("salesforce")) setScreen(signed ? "salesforce-accounts" : "salesforce-login");
    else if (u.includes("gmail") || u.includes("mail.google")) setScreen("gmail");
    else if (u.includes("linkedin")) setScreen("linkedin");
    else if (u.includes("hex")) setScreen("hex");
    else if (u.includes("calendar")) setScreen("calendar");
    else setScreen("browser");
  }

  return (
    <Window title="Browser" compact={compact}>
      {live && !compact ? (
        <form onSubmit={go} className="mb-2 flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label="Address"
            className="w-full rounded-md border border-line bg-inset px-2 py-1 text-xs outline-none"
          />
          <button type="submit" className="rounded-md bg-ink px-2 text-xs font-medium text-ink-fg">
            Go
          </button>
        </form>
      ) : null}
      <p className="text-xs text-muted">
        Try salesforce.com, gmail.com, linkedin.com, hex.tech, or calendar. Other sites aren't loaded on this
        computer.
      </p>
    </Window>
  );
}

const DOCK: { id: ScreenKind; label: string; icon: typeof Globe }[] = [
  { id: "browser", label: "Browser", icon: Globe },
  { id: "files", label: "Files", icon: Folder },
  { id: "terminal", label: "Terminal", icon: Terminal },
];

export function ComputerPanel() {
  const panel = useBotStore((s) => s.panel);
  const setPanel = useBotStore((s) => s.setPanel);
  const bot = useBotStore((s) => s.bots.find((b) => b.id === s.activeId));
  const connectors = useBotStore((s) => s.connectors);
  const driveCardId = useBotStore((s) => s.driveCardId);
  const handBack = useBotStore((s) => s.handBack);
  const takeOver = useBotStore((s) => s.takeOver);
  const setScreen = useBotStore((s) => s.setScreen);
  const notice = useBotStore((s) => s.notice);
  if (!bot || panel === "closed") return null;

  const openCard = [...bot.messages].reverse().find((m) => m.computer && m.computer.state === "open")?.computer;
  const cardId = driveCardId ?? openCard?.id ?? null;
  const driving = panel === "drive";

  return (
    <section className="flex h-full min-h-0 w-full flex-col border-l border-line bg-sidebar md:w-[400px] md:shrink-0">
      <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Computer</p>
          <p className="truncate text-xs text-muted">
            {bot.name} · {driving ? "you're driving" : "watching"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {driving && cardId ? (
            <button
              type="button"
              onClick={() => handBack(cardId)}
              className="h-9 rounded-full bg-ink px-3 text-xs font-medium text-ink-fg"
            >
              I'm done
            </button>
          ) : openCard ? (
            <button
              type="button"
              onClick={() => takeOver(openCard.id)}
              className="h-9 rounded-full bg-ink px-3 text-xs font-medium text-ink-fg"
            >
              Take over
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setPanel("closed")}
            className="h-9 rounded-full bg-inset px-3 text-xs font-medium"
          >
            Close
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 p-3">
        <div className="h-full">
          <ScreenStage screen={bot.screen} live={driving || bot.screen === "terminal" || bot.screen === "files" || bot.screen === "browser"} />
        </div>
      </div>
      <div className="px-3 pb-2">
        <p className="text-xs text-muted">
          {notice ||
            (connectors.find((c) => c.id === "salesforce")?.signedIn
              ? "Sessions on this computer are shared. Each bot keeps its own screen."
              : "Salesforce isn't signed in. Hex, Gmail, LinkedIn, and Calendar are.")}
        </p>
        {driving && (
          <p className="mt-1 text-xs text-warn-fg">
            Simulated handoff. Don't type a real password — it is discarded and the bot never sees it.
          </p>
        )}
      </div>
      <div className="flex items-center justify-center gap-2 border-t border-line px-3 py-2">
        {DOCK.map((item) => {
          const Icon = item.icon;
          const on = bot.screen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setScreen(item.id)}
              className={
                "flex h-11 items-center gap-1.5 rounded-full px-3 text-xs font-medium " +
                (on ? "bg-ink text-ink-fg" : "bg-surface text-fg")
              }
            >
              <Icon className="size-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
