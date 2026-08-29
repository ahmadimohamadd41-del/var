import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Role, Snap } from "./types";
import * as api from "./backend";

export type ToastKind = "ok" | "err" | "info";
export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

export const TABS: Record<Role, { id: string; label: string }[]> = {
  customer: [
    { id: "shop", label: "فروشگاه" },
    { id: "accounts", label: "اکانت‌ها" },
    { id: "orders", label: "سفارش‌ها" },
  ],
  partner: [
    { id: "pshop", label: "خرید همکار" },
    { id: "pwallet", label: "کیف پول" },
    { id: "porders", label: "سفارش‌ها" },
  ],
  admin: [
    { id: "apay", label: "پرداخت‌ها" },
    { id: "apartners", label: "همکاران" },
    { id: "aconfig", label: "تنظیمات" },
    { id: "asystem", label: "سیستم" },
  ],
};

interface Ctx {
  snap: Snap | null;
  booted: boolean;
  role: Role;
  tab: string;
  toasts: Toast[];
  renewFor: string | null;
  devSheet: boolean;
  setRole: (r: Role) => void;
  setTab: (t: string) => void;
  setRenewFor: (u: string | null) => void;
  setDevSheet: (v: boolean) => void;
  toast: (kind: ToastKind, text: string) => void;
  refresh: (s: Snap) => void;
  run: <T>(fn: () => Promise<{ s: Snap } & T>, okMsg?: string) => Promise<({ s: Snap } & T) | null>;
  runSnap: (fn: () => Promise<Snap>, okMsg?: string) => Promise<Snap | null>;
}

const AppCtx = createContext<Ctx | null>(null);

let toastSeq = 1;

export function AppProvider({ children }: { children: ReactNode }) {
  const [snapState, setSnapState] = useState<Snap | null>(null);
  const [booted, setBooted] = useState(false);
  const [role, setRoleState] = useState<Role>("customer");
  const [tab, setTabState] = useState("shop");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [renewFor, setRenewFor] = useState<string | null>(null);
  const [devSheet, setDevSheet] = useState(false);
  const bootedAt = useRef(0);

  const toast = useCallback((kind: ToastKind, text: string) => {
    const id = toastSeq++;
    setToasts((t) => [...t.slice(-2), { id, kind, text }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3400);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const s = await api.apiList();
      if (!alive) return;
      setSnapState(s);
      window.setTimeout(() => setBooted(true), 650);
      bootedAt.current = Date.now();
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* تیک radacct — مصرف اکانت‌ها به‌صورت زنده بالا می‌رود */
  useEffect(() => {
    const t = window.setInterval(() => {
      if (document.hidden) return;
      const s = api.tickUsage();
      if (s) setSnapState(s);
    }, 3500);
    return () => window.clearInterval(t);
  }, []);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    setTabState(TABS[r][0].id);
    setRenewFor(null);
  }, []);

  const setTab = useCallback((t: string) => {
    setTabState(t);
  }, []);

  const refresh = useCallback((s: Snap) => setSnapState(s), []);

  const run = useCallback(
    async <T,>(fn: () => Promise<{ s: Snap } & T>, okMsg?: string) => {
      try {
        const res = await fn();
        setSnapState(res.s);
        if (okMsg) toast("ok", okMsg);
        return res;
      } catch (e) {
        toast("err", e instanceof Error ? e.message : "خطای نامشخص");
        return null;
      }
    },
    [toast],
  );

  const runSnap = useCallback(
    async (fn: () => Promise<Snap>, okMsg?: string) => {
      try {
        const s = await fn();
        setSnapState(s);
        if (okMsg) toast("ok", okMsg);
        return s;
      } catch (e) {
        toast("err", e instanceof Error ? e.message : "خطای نامشخص");
        return null;
      }
    },
    [toast],
  );

  return (
    <AppCtx.Provider
      value={{
        snap: snapState,
        booted,
        role,
        tab,
        toasts,
        renewFor,
        devSheet,
        setRole,
        setTab,
        setRenewFor,
        setDevSheet,
        toast,
        refresh,
        run,
        runSnap,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}
