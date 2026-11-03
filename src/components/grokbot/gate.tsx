"use client";

import { useEffect, useState, type ReactNode } from "react";
import { matchRole, readRole, writeRole } from "@/lib/agents/access";

/**
 * First-open splash + password gate.
 * Admin: VisaHOBe1323@ — full access. Staff: 132313 — read only.
 * Pure CSS animation (no animation library) so it ships light and never blocks.
 */
export function Gate({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<"boot" | "locked" | "flash" | "open">("boot");
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    if (readRole()) {
      setStage("open");
      return;
    }
    const t = setTimeout(() => setStage("locked"), 2200);
    return () => clearTimeout(t);
  }, []);

  function unlock() {
    const next = matchRole(value);
    if (!next) {
      setWrong(true);
      setTimeout(() => setWrong(false), 760);
      return;
    }
    writeRole(next);
    setStage("flash");
    setTimeout(() => setStage("open"), 1300);
  }

  return (
    <>
      {stage === "open" ? children : null}
      {stage !== "open" && (
        <div className="gb-gate fixed inset-0 z-[200] overflow-hidden">
          <span className="gb-blob gb-blob-a" />
          <span className="gb-blob gb-blob-b" />

          <div className="relative flex h-full flex-col items-center justify-center px-6">
            {stage === "boot" && (
              <div className="flex flex-col items-center gap-7">
                <div className="relative grid place-items-center">
                  <span className="gb-ring" />
                  <span className="gb-ring gb-ring-2" />
                  <span className="gb-logo size-28 text-3xl">GB</span>
                </div>
                <div className="flex items-end gap-[3px]">
                  {"NSPACE BOT".split("").map((ch, i) => (
                    <span key={i} className="gb-letter text-[15px] font-semibold tracking-[0.3em] text-[#1C1C1E]/75" style={{ animationDelay: `${i * 50}ms` }}>
                      {ch === " " ? "\u00A0" : ch}
                    </span>
                  ))}
                </div>
                <div className="h-[3px] w-28 overflow-hidden rounded-full bg-black/10">
                  <span className="gb-progress block h-full rounded-full bg-gradient-to-r from-[#0A84FF] via-[#5AC8FA] to-[#BF5AF2]" />
                </div>
              </div>
            )}

            {stage === "locked" && (
              <div className="gb-rise w-full max-w-[360px]">
                <div className="flex flex-col items-center gap-3">
                  <span className="gb-logo size-16 text-lg">GB</span>
                  <div className="text-center">
                    <h1 className="text-[21px] font-semibold tracking-tight text-[#1C1C1E]">N Space Bot</h1>
                    <p className="mt-1 text-[13px] text-[#8E8E93]">Enter your password to unlock</p>
                  </div>
                </div>

                <div className={`gb-glass mt-6 p-3 ${wrong ? "gb-shake" : ""}`}>
                  <input
                    type="password"
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && unlock()}
                    placeholder="Password"
                    className="w-full rounded-[14px] bg-white/85 px-4 py-3 text-[16px] text-[#1C1C1E] outline-none placeholder:text-[#AEAEB2]"
                  />
                  <button
                    onClick={unlock}
                    className="mt-2.5 w-full rounded-[14px] bg-gradient-to-b from-[#0A84FF] to-[#0060DF] py-3 text-[15px] font-semibold text-white shadow-[0_10px_24px_rgba(0,96,223,0.35)] active:scale-[0.99]"
                  >
                    Unlock
                  </button>
                </div>

                {wrong && <p className="mt-3 text-center text-[12.5px] font-medium text-[#FF3B30]">Wrong password</p>}
              </div>
            )}

            {stage === "flash" && (
              <div className="flex flex-col items-center gap-5">
                <div className="relative grid size-40 place-items-center">
                  <span className="gb-ring" />
                  <span className="gb-ring gb-ring-2" />
                  <span className="grid size-20 place-items-center rounded-[26px] bg-gradient-to-br from-[#0A84FF] to-[#5AC8FA] text-xl font-bold text-white shadow-[0_18px_40px_rgba(10,120,255,0.35)]">
                    GB
                  </span>
                </div>
                <p className="text-[13px] font-medium text-[#1C1C1E]/70">Unlocking your workspace…</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
