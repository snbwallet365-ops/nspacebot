import { Plus, Search } from "lucide-react";
import { previewText, USER_NAME, type Bot } from "@/lib/agents/model";
import { BotMark } from "@/components/grokbot/avatars";

export function Sidebar({
  bots,
  activeId,
  query,
  onQuery,
  onSelect,
  onNew,
  onProfile,
  mobile,
  onClose,
}: {
  bots: Bot[];
  activeId: string;
  query: string;
  onQuery: (q: string) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onProfile: () => void;
  mobile?: boolean;
  onClose?: () => void;
}) {
  const q = query.trim().toLowerCase();
  const shown = bots.filter((b) => {
    if (!q) return true;
    return (
      b.name.toLowerCase().includes(q) ||
      previewText(b).toLowerCase().includes(q) ||
      b.job.toLowerCase().includes(q)
    );
  });

  return (
    <aside
      className={
        mobile
          ? "flex h-full w-72 shrink-0 flex-col bg-sidebar"
          : "hidden h-full w-[300px] shrink-0 flex-col border-r border-line bg-sidebar md:flex"
      }
    >
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <span className="flex items-center gap-1.5 pl-1" aria-hidden="true">
          <span className="size-3 rounded-full bg-traffic-red" />
          <span className="size-3 rounded-full bg-traffic-yellow" />
          <span className="size-3 rounded-full bg-traffic-green" />
        </span>
        <button
          type="button"
          onClick={onNew}
          aria-label="New bot"
          className="grid size-8 place-items-center rounded-lg text-fg hover:bg-inset"
        >
          <Plus className="size-5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="px-3 pb-2">
        <label className="flex h-10 items-center gap-2 rounded-xl bg-inset px-3 text-muted">
          <Search className="size-4 shrink-0" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            id={mobile ? undefined : "bot-search"}
            placeholder="Search"
            className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted"
          />
        </label>
      </div>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {shown.length === 0 && (
          <p className="px-3 py-6 text-sm text-muted">No bots match that search.</p>
        )}
        <ul className="flex flex-col gap-0.5">
          {shown.map((bot) => {
            const selected = bot.id === activeId;
            return (
              <li key={bot.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(bot.id);
                    onClose?.();
                  }}
                  className={
                    "flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left " +
                    (selected ? "bg-surface shadow-sm" : "hover:bg-surface/70")
                  }
                >
                  <BotMark color={bot.color} shape={bot.shape} members={bot.members} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-fg">{bot.name}</span>
                      <span className="shrink-0 text-xs text-muted tabular-nums">{bot.timeLabel}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">{previewText(bot)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        type="button"
        onClick={onProfile}
        className="flex items-center gap-2.5 border-t border-line px-4 py-3 text-left hover:bg-surface"
      >
        <span className="grid size-8 place-items-center rounded-full bg-inset text-xs font-semibold text-fg">
          AS
        </span>
        <span className="text-sm font-medium text-fg">{USER_NAME}</span>
      </button>
    </aside>
  );
}
