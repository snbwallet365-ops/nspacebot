import { useEffect, useState } from "react";
import { useAiSettings } from "@/lib/agents/ai-settings";
import { activeBot, bindPersistence, useBotStore } from "@/lib/agents/store";
import { Sidebar } from "@/components/grokbot/sidebar";
import { Gate } from "@/components/grokbot/gate";
import { useAccess } from "@/lib/agents/access";
import { ChatPane } from "@/components/grokbot/chat";
import { ComputerPanel } from "@/components/grokbot/computer";
import {
  AiSettingsDialog,
  AppsDialog,
  FilesDialog,
  NewBotDialog,
  ProfileDialog,
  RenameDialog,
  RoutinesDialog,
} from "@/components/grokbot/overlays";

type Menu = "ai" | "rename" | "routines" | "apps" | "files" | "profile" | "new" | null;

export function GrokBotApp() {
  const theme = useBotStore((s) => s.theme);
  const bots = useBotStore((s) => s.bots);
  const activeId = useBotStore((s) => s.activeId);
  const setActive = useBotStore((s) => s.setActive);
  const panel = useBotStore((s) => s.panel);
  const [query, setQuery] = useState("");
  const [nav, setNav] = useState(false);
  const [menu, setMenu] = useState<Menu>(null);
  const bot = activeBot(useBotStore());
  const { role, hidden, toggleHidden } = useAccess();

  useEffect(() => bindPersistence(), []);
  useEffect(() => useAiSettings.getState().load(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("bot-search")?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!bot) return null;

  return (
    <Gate>
    <div data-theme={theme} className="h-dvh bg-canvas text-fg">
      <div className="flex h-full overflow-hidden bg-surface">
        <Sidebar
          bots={bots}
          activeId={activeId}
          query={query}
          onQuery={setQuery}
          onSelect={setActive}
          onNew={() => setMenu("new")}
          onProfile={() => setMenu("profile")}
          onSettings={() => setMenu("ai")}
          role={role}
          hidden={hidden}
          onToggleHidden={toggleHidden}
        />
        {nav && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="h-full bg-sidebar shadow-xl">
              <Sidebar
                mobile
                bots={bots}
                activeId={activeId}
                query={query}
                onQuery={setQuery}
                onSelect={setActive}
                onNew={() => {
                  setNav(false);
                  setMenu("new");
                }}
                onProfile={() => {
                  setNav(false);
                  setMenu("profile");
                }}
                onClose={() => setNav(false)}
              />
            </div>
            <button type="button" aria-label="Close bots" className="h-full flex-1 bg-os/40" onClick={() => setNav(false)} />
          </div>
        )}
        <ChatPane
          bot={bot}
          bots={bots}
          onOpenNav={() => setNav(true)}
          onMenu={(which) => setMenu(which)}
        />
        {panel !== "closed" && (
          <div className="fixed inset-0 z-30 flex flex-col bg-surface md:static md:w-[400px] md:shrink-0">
            <ComputerPanel />
          </div>
        )}
      </div>
      {menu === "new" && <NewBotDialog onClose={() => setMenu(null)} />}
      {menu === "rename" && <RenameDialog onClose={() => setMenu(null)} />}
      <button
        type="button"
        onClick={() => setMenu("ai")}
        aria-label="AI settings"
        className="fixed right-4 bottom-24 z-30 rounded-full border border-line bg-surface/80 px-4 py-2 text-sm font-medium text-fg shadow-lg backdrop-blur-xl"
      >
        AI settings
      </button>
      {menu === "ai" && <AiSettingsDialog onClose={() => setMenu(null)} />}
      {menu === "profile" && <ProfileDialog onClose={() => setMenu(null)} />}
      {menu === "apps" && <AppsDialog onClose={() => setMenu(null)} />}
      {menu === "routines" && <RoutinesDialog onClose={() => setMenu(null)} />}
      {menu === "files" && <FilesDialog onClose={() => setMenu(null)} />}
    </div>
    </Gate>
  );
}
