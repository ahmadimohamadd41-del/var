import React, { useEffect, useState } from "react";
import { StoreProvider, initTelegram, useStore, haptic } from "./lib/store";
import { fa, serverLabel } from "./lib/format";
import { IcAlert, IcCheck, IcHome, IcShield, IcSpark, IcStore, IcUser, IcUsers, LogoMark } from "./components/ui";
import Dashboard from "./tabs/Dashboard";
import Shop from "./tabs/Shop";
import Partner from "./tabs/Partner";
import Admin from "./tabs/Admin";
import Profile from "./tabs/Profile";

type Tab = "home" | "shop" | "partner" | "admin" | "profile";

const TABS: { id: Tab; label: string; icon: (p: { className?: string }) => React.ReactNode }[] = [
  { id: "home", label: "خانه", icon: (p) => <IcHome {...p} /> },
  { id: "shop", label: "فروشگاه", icon: (p) => <IcStore {...p} /> },
  { id: "partner", label: "همکاران", icon: (p) => <IcUsers {...p} /> },
  { id: "admin", label: "مدیریت", icon: (p) => <IcShield {...p} /> },
  { id: "profile", label: "پروفایل", icon: (p) => <IcUser {...p} /> },
];

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

function Shell() {
  const { state, me, toasts, dismissToast } = useStore();
  const [tab, setTab] = useState<Tab>("home");

  useEffect(() => {
    initTelegram();
  }, []);

  // اگر نقش عوض شد و تب قفل بود، به خانه برگرد
  useEffect(() => {
    if (tab === "admin" && me.role !== "admin") setTab("home");
  }, [me.role, tab]);

  const pendingPays = state.payments.filter((p) => p.status === "pending").length;

  return (
    <div className="min-h-dvh">
      <div className="ambient" />

      {/* ---------- header ---------- */}
      <header className="sticky top-0 z-40 bg-deep-950/80 backdrop-blur-md border-b border-mint-400/8">
        <div className="max-w-md mx-auto px-4 h-15 py-2.5 flex items-center gap-3">
          <LogoMark className="w-9 h-9" />
          <div className="flex-1 leading-none">
            <p className="font-display text-xl text-mist-100">
              ور <span className="text-gold-400">وی‌پی‌ان</span>
              <span className="text-[0.68rem] text-mist-500 align-middle ms-2 tracking-widest" dir="ltr">VAR VPN</span>
            </p>
            <p className="text-[0.62rem] text-mist-500 mt-1">مینی‌اپ تلگرام • فروش و تمدید اکانت</p>
          </div>
          <ServerPill />
        </div>
      </header>

      {/* ---------- content ---------- */}
      <main className="max-w-md mx-auto px-4 pt-5 pb-28">
        <div key={tab + me.id} className="anim-fade-up">
          {tab === "home" && <Dashboard onGoShop={() => setTab("shop")} />}
          {tab === "shop" && <Shop />}
          {tab === "partner" && <Partner />}
          {tab === "admin" && <Admin />}
          {tab === "profile" && <Profile />}
        </div>
      </main>

      {/* ---------- tab bar ---------- */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-deep-900/92 backdrop-blur-md border-t border-mint-400/10" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="max-w-md mx-auto grid grid-cols-5">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  haptic("tap");
                }}
                className="relative flex flex-col items-center gap-1 py-2.5 cursor-pointer group"
                aria-label={t.label}
              >
                <span
                  className={`relative w-11 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                    active ? "bg-gold-500/18 text-gold-300 shadow-[0_0_18px_rgba(246,189,90,0.25)]" : "text-mist-500 group-hover:text-mist-300"
                  }`}
                >
                  {t.icon({ className: "w-5 h-5" })}
                  {t.id === "admin" && pendingPays > 0 && me.role === "admin" && (
                    <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-coral-500 text-mist-100 text-[0.58rem] font-bold flex items-center justify-center tabular">
                      {fa(pendingPays)}
                    </span>
                  )}
                </span>
                <span className={`text-[0.62rem] font-bold transition-colors ${active ? "text-gold-300" : "text-mist-600 group-hover:text-mist-400"}`}>{t.label}</span>
                <span className={`absolute top-0 h-0.5 w-8 rounded-full bg-gold-400 transition-all duration-300 ${active ? "opacity-100 scale-100" : "opacity-0 scale-50"}`} />
              </button>
            );
          })}
        </div>
      </nav>

      {/* ---------- toasts ---------- */}
      <div className="fixed bottom-20 inset-x-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <button
            key={t.id}
            onClick={() => dismissToast(t.id)}
            className={`anim-toast pointer-events-auto max-w-sm w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border text-right shadow-xl shadow-black/50 backdrop-blur-md cursor-pointer ${
              t.kind === "ok"
                ? "bg-mint-900/90 border-mint-500/40 text-mint-300"
                : t.kind === "err"
                  ? "bg-coral-900/90 border-coral-500/40 text-coral-300"
                  : "bg-deep-800/95 border-gold-500/30 text-gold-300"
            }`}
          >
            {t.kind === "ok" ? <IcCheck className="w-4.5 h-4.5 shrink-0" /> : t.kind === "err" ? <IcAlert className="w-4.5 h-4.5 shrink-0" /> : <IcSpark className="w-4.5 h-4.5 shrink-0" />}
            <span className="text-xs font-bold leading-5">{t.msg}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ServerPill() {
  const { state } = useStore();
  const server = state.servers.find((s) => s.status === "online") ?? state.servers[0];
  const [ping, setPing] = useState(server?.latencyMs ?? 40);

  useEffect(() => {
    const t = setInterval(() => setPing(36 + Math.round(Math.random() * 24)), 2800);
    return () => clearInterval(t);
  }, []);

  if (!server) return null;
  return (
    <div className="flex items-center gap-2 rounded-full border border-mint-400/20 bg-deep-800/80 px-3 py-1.5">
      <span className={`w-2 h-2 rounded-full ${server.status === "online" ? "bg-mint-400 pulse-dot" : "bg-gold-400"}`} />
      <div className="leading-none text-left">
        <p className="text-[0.65rem] font-bold text-mist-200">{serverLabel(server.code)}</p>
        <p className="text-[0.58rem] text-mint-400 mt-0.5 tabular" dir="ltr">{ping}ms</p>
      </div>
    </div>
  );
}
