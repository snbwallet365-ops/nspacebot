import { useEffect, useRef, useState } from "react";
import { ArrowRight, Mic, Monitor, Plus, Sparkles } from "lucide-react";
import type { Bot, ChatMessage } from "@/lib/agents/model";
import { useBotStore } from "@/lib/agents/store";
import { BotMark } from "@/components/grokbot/avatars";
import { ScreenStage } from "@/components/grokbot/computer";

export function ChatPane({
  bot,
  bots,
  onOpenNav,
  onMenu,
}: {
  bot: Bot;
  bots: Bot[];
  onOpenNav: () => void;
  onMenu: (which: "rename" | "routines" | "apps" | "files") => void;
}) {
  const panel = useBotStore((s) => s.panel);
  const setPanel = useBotStore((s) => s.setPanel);
  const typing = useBotStore((s) => s.typing);
  const scroller = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState(false);

  useEffect(() => {
    if (!stick) return;
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [bot.messages.length, typing, stick, bot.id]);

  return (
    <section className="relative flex min-w-0 flex-1 flex-col bg-surface">
      <header className="flex items-center gap-2 border-b border-line px-3 py-2.5 md:px-4">
        <button
          type="button"
          className="grid size-10 place-items-center rounded-lg hover:bg-inset md:hidden"
          aria-label="Open bots"
          onClick={onOpenNav}
        >
          <span className="flex flex-col gap-1">
            <span className="block h-0.5 w-4 bg-fg" />
            <span className="block h-0.5 w-4 bg-fg" />
            <span className="block h-0.5 w-4 bg-fg" />
          </span>
        </button>
        <BotMark color={bot.color} shape={bot.shape} members={bot.members} className="size-7" />
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold">{bot.name}</h1>
        <button
          type="button"
          aria-label={panel === "closed" ? "Open computer" : "Hide computer"}
          onClick={() => setPanel(panel === "closed" ? "watch" : "closed")}
          className={
            "grid size-10 place-items-center rounded-lg " +
            (panel !== "closed" ? "bg-inset text-fg" : "text-fg hover:bg-inset")
          }
        >
          <Monitor className="size-5" strokeWidth={1.75} />
        </button>
      </header>

      <div
        ref={scroller}
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-6"
        onScroll={(e) => {
          const el = e.currentTarget;
          const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          setStick(near);
        }}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 pr-0 md:pr-16">
          {bot.messages.map((message) => (
            <MessageBubble key={message.id} message={message} bots={bots} />
          ))}
          {typing && (
            <div className="flex w-fit items-center gap-1 rounded-2xl bg-agent px-4 py-3">
              <span className="typing-dot size-1.5 rounded-full bg-muted" />
              <span className="typing-dot size-1.5 rounded-full bg-muted" style={{ animationDelay: "120ms" }} />
              <span className="typing-dot size-1.5 rounded-full bg-muted" style={{ animationDelay: "240ms" }} />
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        aria-label={panel === "closed" ? "Open computer" : "Hide computer"}
        onClick={() => setPanel(panel === "closed" ? "watch" : "closed")}
        className="absolute top-1/2 right-3 z-20 hidden size-16 -translate-y-1/2 place-items-center rounded-full bg-os text-os-fg shadow-lg md:grid"
      >
        <ArrowRight className={"size-7 " + (panel === "closed" ? "" : "rotate-180")} strokeWidth={2.25} />
      </button>

      <Composer botName={bot.name} onMenu={onMenu} onSend={() => setStick(true)} />
    </section>
  );
}

function MessageBubble({ message, bots }: { message: ChatMessage; bots: Bot[] }) {
  const handBack = useBotStore((s) => s.handBack);
  const takeOver = useBotStore((s) => s.takeOver);
  const decide = useBotStore((s) => s.decideApproval);

  if (message.role === "system") {
    return <p className="py-1 text-center text-xs text-muted">{message.text}</p>;
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl bg-bubble px-3.5 py-2.5 text-sm leading-relaxed text-bubble-fg whitespace-pre-wrap">
          {message.text}
        </p>
      </div>
    );
  }

  const speaker = message.fromBotId ? bots.find((b) => b.id === message.fromBotId) : null;

  return (
    <div className="flex flex-col gap-2">
      {speaker && (
        <span className="flex items-center gap-2 text-xs text-muted">
          <BotMark color={speaker.color} shape={speaker.shape} className="size-5" />
          {speaker.name}
        </span>
      )}
      {message.text && (
        <p className="rounded-2xl bg-agent px-3.5 py-3 text-sm leading-relaxed whitespace-pre-wrap text-fg">
          {message.text}
        </p>
      )}
      {message.computer && (
        <article className="rounded-2xl border border-line bg-surface p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">{message.computer.headline}</h2>
            <span
              className={
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium " +
                (message.computer.badge === "done"
                  ? "bg-inset text-muted"
                  : "bg-warn-bg text-warn-fg")
              }
            >
              {message.computer.badge !== "done" && <Sparkles className="size-3" />}
              {message.computer.badge === "action"
                ? "Action needed"
                : message.computer.badge === "working"
                  ? "On the computer"
                  : "Done"}
            </span>
          </div>
          <p className="mb-3 text-sm text-fg">{message.computer.detail}</p>
          <ScreenStage screen={message.computer.screen} compact />
          {message.computer.state === "open" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => takeOver(message.computer!.id)}
                className="h-10 rounded-full bg-ink px-4 text-sm font-medium text-ink-fg"
              >
                Take over
              </button>
              <button
                type="button"
                onClick={() => handBack(message.computer!.id)}
                className="h-10 rounded-full bg-inset px-4 text-sm font-medium text-fg"
              >
                I'm done
              </button>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted">Handed back</p>
          )}
        </article>
      )}
      {message.approval && (
        <article className="rounded-2xl border border-line bg-surface p-3 shadow-sm">
          <p className="text-sm">{message.approval.prompt}</p>
          {message.approval.state === "open" ? (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => decide(message.id, true)}
                className="h-10 rounded-full bg-ink px-4 text-sm font-medium text-ink-fg"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => decide(message.id, false)}
                className="h-10 rounded-full bg-inset px-4 text-sm font-medium"
              >
                Don't send
              </button>
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted">
              {message.approval.state === "approved" ? "Approved" : "Not sent"}
            </p>
          )}
        </article>
      )}
    </div>
  );
}

function Composer({
  botName,
  onMenu,
  onSend,
}: {
  botName: string;
  onMenu: (which: "rename" | "routines" | "apps" | "files") => void;
  onSend: () => void;
}) {
  const send = useBotStore((s) => s.send);
  const typing = useBotStore((s) => s.typing);
  const [text, setText] = useState("");
  const [menu, setMenu] = useState(false);
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [text]);

  async function submit() {
    const value = text.trim();
    if (!value || typing) return;
    setText("");
    setMenu(false);
    onSend();
    await send(value);
  }

  function mic() {
    const w = window as unknown as {
      SpeechRecognition?: new () => Rec;
      webkitSpeechRecognition?: new () => Rec;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setHint("Voice input isn't available in this browser. Type instead.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (ev) => {
      const said = ev.results[0]?.[0]?.transcript ?? "";
      setText((t) => (t ? `${t} ${said}` : said));
    };
    rec.onend = () => setListening(false);
    setListening(true);
    setHint("");
    try {
      rec.start();
    } catch {
      setListening(false);
      setHint("The mic didn't start. Type the message instead.");
    }
  }

  return (
    <div className="relative px-3 pt-1 pb-3 md:px-4">
      {menu && (
        <div className="absolute bottom-16 left-4 z-30 w-56 rounded-xl border border-line bg-surface p-1 shadow-lg">
          <MenuBtn label="Connect apps" onClick={() => { setMenu(false); onMenu("apps"); }} />
          <MenuBtn label="Routines" onClick={() => { setMenu(false); onMenu("routines"); }} />
          <MenuBtn label="Rename this bot" onClick={() => { setMenu(false); onMenu("rename"); }} />
          <MenuBtn label="Files on the computer" onClick={() => { setMenu(false); onMenu("files"); }} />
        </div>
      )}
      {hint && <p className="mb-1 px-3 text-xs text-muted">{hint}</p>}
      <div className="flex items-end gap-2 rounded-full border border-line bg-surface py-1 pr-1 pl-1.5 shadow-sm">
        <button
          type="button"
          aria-label="More"
          onClick={() => setMenu((v) => !v)}
          className="mb-0.5 grid size-9 shrink-0 place-items-center rounded-full text-fg hover:bg-inset"
        >
          <Plus className="size-5" />
        </button>
        <textarea
          ref={box}
          rows={1}
          value={text}
          placeholder={`Message ${botName}`}
          aria-label={`Message ${botName}`}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          className="max-h-36 min-h-9 w-full resize-none bg-transparent py-2 text-sm leading-relaxed outline-none placeholder:text-muted"
        />
        {text.trim() ? (
          <button
            type="button"
            onClick={() => void submit()}
            disabled={typing}
            aria-label="Send"
            className="mb-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-ink text-ink-fg disabled:opacity-50"
          >
            <ArrowRight className="size-4 -rotate-90" />
          </button>
        ) : (
          <button
            type="button"
            onClick={mic}
            aria-pressed={listening}
            aria-label={listening ? "Listening" : "Voice message"}
            className={
              "mb-0.5 grid size-9 shrink-0 place-items-center rounded-full " +
              (listening ? "bg-ink text-ink-fg" : "bg-inset text-fg")
            }
          >
            <Mic className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function MenuBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-inset"
    >
      {label}
    </button>
  );
}

type Rec = {
  lang: string;
  interimResults: boolean;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
};
