"use client";

import { useCallback, useEffect, useState } from "react";

export type Role = "admin" | "staff";

const ROLE_KEY = "nspacebot.role.v1";
const HIDDEN_KEY = "nspacebot.hidden.v1";
const EVENT = "nspacebot:access";

export const ADMIN_PASSWORD = "VisaHOBe1323@";
export const STAFF_PASSWORD = "132313";

export function matchRole(password: string): Role | null {
  if (password === ADMIN_PASSWORD) return "admin";
  if (password === STAFF_PASSWORD) return "staff";
  return null;
}

export function readRole(): Role | null {
  try {
    const v = localStorage.getItem(ROLE_KEY);
    return v === "admin" || v === "staff" ? v : null;
  } catch {
    return null;
  }
}

export function writeRole(role: Role) {
  try {
    localStorage.setItem(ROLE_KEY, role);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

export function clearRole() {
  try {
    localStorage.removeItem(ROLE_KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

export function readHidden(): string[] {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeHidden(ids: string[]) {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

/** Live access state shared by the shell, sidebar and dialogs. */
export function useAccess() {
  const [role, setRole] = useState<Role | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => {
      setRole(readRole());
      setHidden(readHidden());
    };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHidden = useCallback((id: string) => {
    const current = readHidden();
    writeHidden(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }, []);

  const restoreAll = useCallback(() => writeHidden([]), []);

  return { role, hidden, toggleHidden, restoreAll };
}
