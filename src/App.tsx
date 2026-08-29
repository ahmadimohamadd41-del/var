import { useEffect, useState, type ReactNode } from "react";
import { AppProvider, TABS, useApp, type Toast } from "./lib/store";
import { faClockNow } from "./lib/format";
import type { Role } from "./lib/types";
import { Chip, Sheet } from "./components/ui";
import { DevPanel, DevRail } from "./components/DevRail";
import {
  IcAlert,
  IcCard,
  IcCheck,
  IcGear,
  IcKey,
  IcLogo,
  IcPulse,
  IcReceipt,
  IcStore,
  IcUsers,
  IcWallet,
  IcWrench,
  IcX,
} from "./components/icons";
import ShopView from "./views/ShopView";
import AccountsView from "./views/AccountsView";
import OrdersView from "./views/OrdersView";
import { PartnerShopView, PartnerWalletView } from "./views/PartnerView";
import { AdminConfig, AdminPartners, AdminPayments, AdminSystem } from "./views/AdminView";

const ROLE_LABEL: Record<Role, string> = {
  customer: "مشتری",
  partner: "همکار",
  admin: "مدیر",
};

const TAB_ICONS: Record<string, (p: { className?: string }) => ReactNode> = {
  shop: (p) => <IcStore {...p} />,
  accounts: (p) => <IcKey {...p} />,
  orders: (p) => <IcReceipt {...p} />,
  pshop: (p) => <IcStore {...p} />,
  pwallet: (p) => <IcWallet {...p} />,
  porders: (p) => <IcReceipt {...p} />,
  apay: (p) => <IcCard {...p} />,
  apartners: (p) => <IcUsers {...p} />,
  aconfig: (p) => <IcGear {...p} />,
  asystem: (p) => <IcPulse {...p} />,
};

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

function Shell() {
  const { booted } = useApp();
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <BgScene />
      {!booted ? (
        <BootSplash />
      ) : (
        <>
          <div className="anim-fade relative z-10 flex min-h-dvh items-center justify-center gap-7 p-0 lg:p-8">
            <DevRail />
            <Phone />
          </div>
          <MobileDevGate />
        </>
      )}
    </div>
  );
}

/* -------------------------------- Boot splash -------------------------------- */

function BootSplash() {
  return (
    <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center gap-5">
      <div className="anim-pop">
        <IcLogo className="h-20 w-20" />
      </div>
      <div className="text-center">
        <p className="font-display text-3xl tracking-wide text-mist-100">
          VAR <span className="text-mint-400">VPN</span>
        </p>
        <p className="mt-1 text-[11px] text-mist-500">در حال اتصال به سرور آلمان-۱…</p>
      </div>
      <div className="h-1 w-44 overflow-hidden rounded-full bg-white/[0.07]">
        <div className="anim-boot h-full w-24 rounded-full bg-gradient-to-l from-mint-400 to-gold-400" />
      </div>
    </div>
  );
}

/* --------------------------------- Bg scene --------------------------------- */

function BgScene() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(1100px_750px_at_88%_-12%,rgba(35,201,147,0.11),transparent_62%),radial-gradient(950px_700px_at_6%_112%,rgba(246,189,90,0.08),transparent_60%),linear-gradient(180deg,#07171d_0%,#06141a_55%,#081a20_100%)]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(233,246,242,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(233,246,242,0.04) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 45%, black 25%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 45%, black 25%, transparent 78%)",
        }}
      />
      <div className="anim-drift-a absolute -top-32 left-[8%] h-96 w-96 rounded-full bg-mint-500/[0.07] blur-3xl" />
      <div className="anim-drift-b absolute -bottom-24 right-[6%] h-[26rem] w-[26rem] rounded-full bg-gold-400/[0.06] blur-3xl" />

      <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <g stroke="rgba(70,220,168,0.16)" strokeWidth="1.2" fill="none">
          <path d="M120 640 L340 480 L560 560 L820 380 L1080 470" strokeDasharray="4 10" className="anim-dash" />
          <path d="M200 160 L420 300 L700 190 L960 300 L1120 180" strokeDasharray="4 10" className="anim-dash" style={{ animationDelay: "-3s" }} />
          <path d="M340 480 L420 300 M820 380 L960 300 M560 560 L700 190" strokeDasharray="3 9" className="anim-dash" style={{ animationDelay: "-5s" }} />
        </g>
        <g fill="rgba(70,220,168,0.5)">
          <circle cx="340" cy="480" r="3.5" className="anim-blink" />
          <circle cx="820" cy="380" r="3.5" className="anim-blink" style={{ animationDelay: "-0.7s" }} />
          <circle cx="420" cy="300" r="3" className="anim-blink" style={{ animationDelay: "-1.1s" }} />
        </g>
        <g fill="rgba(246,189,90,0.55)">
          <circle cx="560" cy="560" r="3" className="anim-blink" style={{ animationDelay: "-0.4s" }} />
          <circle cx="960" cy="300" r="3" className="anim-blink" style={{ animationDelay: "-1.4s" }} />
        </g>
      </svg>

      <p className="absolute -bottom-8 left-1 select-none font-display text-[38vw] leading-none text-white/[0.02] lg:text-[300px]">
        VAR
      </p>
    </div>
  );
}

/* ---------------------------------- Phone ---------------------------------- */

function Phone() {
  const { role, tab, setTab, setDevSheet, toast } = useApp();
  const tabs = TABS[role];
  const [clock, setClock] = useState(faClockNow());

  useEffect(() => {
    const t = window.setInterval(() => setClock(faClockNow()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const view = (() => {
    switch (tab) {
      case "shop":
        return <ShopView />;
      case "accounts":
        return <AccountsView />;
      case "orders":
      case "porders":
        return <OrdersView />;
      case "pshop":
        return <PartnerShopView />;
      case "pwallet":
        return <PartnerWalletView />;
      case "apay":
        return <AdminPayments />;
      case "apartners":
        return <AdminPartners />;
      case "aconfig":
        return <AdminConfig />;
      case "asystem":
        return <AdminSystem />;
      default:
        return <ShopView />;
    }
  })();

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-deep-900 lg:h-[min(880px,94vh)] lg:w-[402px] lg:shrink-0 lg:rounded-[2.9rem] lg:border-[7px] lg:border-[#0a0f12] lg:shadow-[0_50px_140px_-40px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.09),inset_0_0_0_1px_rgba(255,255,255,0.04)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-52 bg-[radial-gradient(420px_220px_at_50%_-40px,rgba(35,201,147,0.14),transparent_70%)]" />
      <div className="pointer-events-none absolute -bottom-20 left-1/2 z-0 h-44 w-72 -translate-x-1/2 rounded-full bg-gold-400/[0.05] blur-3xl" />
      <div className="absolute left-1/2 top-2.5 z-50 hidden h-[22px] w-24 -translate-x-1/2 rounded-full bg-[#0a0f12] lg:block" />

      {/* status bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pb-1 pt-3 text-[11px] font-bold text-mist-300 lg:pt-8">
        <span className="tabular-nums">{clock}</span>
        <span className="flex items-center gap-1.5">
          <SignalIcon />
          <WifiIcon />
          <BatteryIcon />
        </span>
      </div>

      {/* top bar */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/[0.06] px-4 pb-3 pt-2">
        <div className="flex items-center gap-2.5">
          <IcLogo className="h-9 w-9" />
          <div>
            <p className="font-display text-[17px] leading-5 tracking-wide">
              VAR <span className="text-mint-400">VPN</span>
            </p>
            <p className="text-[9.5px] text-mist-500">مینی‌اپ تلگرام — نسخه لوکال</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.innerWidth < 1024) setDevSheet(true);
          }}
          className="lg:cursor-default"
          aria-label="تغییر نقش"
        >
          <span className="flex items-center gap-2">
            <Chip tone="mint">آلمان-۱</Chip>
            <Chip tone={role === "admin" ? "coral" : role === "partner" ? "gold" : "sky"}>
              {ROLE_LABEL[role]}
              <span className="lg:hidden">· تعویض</span>
            </Chip>
          </span>
        </button>
      </div>

      {/* main */}
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto pb-24">
        <div key={role + tab} className="anim-fade">
          {view}
        </div>
      </div>

      {/* tab bar */}
      <div className="absolute inset-x-0 bottom-0 z-30 border-t border-white/[0.07] bg-deep-900/95 px-2 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map((t) => {
            const active = tab === t.id;
            const Icon = TAB_ICONS[t.id];
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTab(t.id);
                  if (active) return;
                }}
                className={`group relative flex flex-col items-center gap-1 rounded-xl py-1.5 transition-colors ${
                  active ? "text-mint-300" : "text-mist-500 hover:text-mist-300"
                }`}
              >
                <span
                  className={`absolute -top-1.5 h-1 w-8 rounded-full bg-mint-400 transition-all duration-300 ${
                    active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-50"
                  }`}
                />
                <span className={`transition-transform duration-200 ${active ? "scale-110" : "group-active:scale-90"}`}>
                  {Icon && Icon({ className: "h-5 w-5" })}
                </span>
                <span className="text-[10px] font-bold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <ToastHost />
    </div>
  );
}

/* --------------------------------- Toasts ---------------------------------- */

function ToastHost() {
  const { toasts } = useApp();
  return (
    <div className="pointer-events-none absolute inset-x-3 top-14 z-[70] flex flex-col items-center gap-2">
      {toasts.map((t) => (
        <ToastCard key={t.id} t={t} />
      ))}
    </div>
  );
}

function ToastCard({ t }: { t: Toast }) {
  const cls =
    t.kind === "ok"
      ? "border-mint-500/35 bg-deep-850/95 text-mint-300"
      : t.kind === "err"
        ? "border-coral-500/35 bg-deep-850/95 text-coral-300"
        : "border-sky-350/30 bg-deep-850/95 text-sky-350";
  return (
    <div className={`anim-pop flex w-full max-w-[330px] items-start gap-2.5 rounded-xl border px-3.5 py-2.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur ${cls}`}>
      <span className="mt-0.5 shrink-0">
        {t.kind === "ok" ? <IcCheck className="h-4 w-4" /> : t.kind === "err" ? <IcX className="h-4 w-4" /> : <IcAlert className="h-4 w-4" />}
      </span>
      <p className="text-[11.5px] font-bold leading-5 text-mist-100">{t.text}</p>
    </div>
  );
}

/* ------------------------------ status icons ------------------------------ */

function SignalIcon() {
  return (
    <svg viewBox="0 0 16 12" className="h-3 w-4" fill="currentColor" aria-hidden="true">
      <rect x="0" y="8" width="3" height="4" rx="0.8" />
      <rect x="4.3" y="5.5" width="3" height="6.5" rx="0.8" />
      <rect x="8.6" y="3" width="3" height="9" rx="0.8" />
      <rect x="12.9" y="0.5" width="3" height="11.5" rx="0.8" opacity="0.4" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg viewBox="0 0 16 12" className="h-3 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <path d="M1.5 4.5a10 10 0 0 1 13 0M4 7.2a6.3 6.3 0 0 1 8 0" />
      <circle cx="8" cy="10" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg viewBox="0 0 22 11" className="h-3 w-5" aria-hidden="true">
      <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" fill="none" stroke="currentColor" opacity="0.5" />
      <rect x="2.5" y="2.5" width="12" height="6" rx="1.2" fill="#46dca8" />
      <rect x="20" y="3.5" width="2" height="4" rx="1" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

/* --------------------------- mobile dev controls --------------------------- */

export function MobileDevGate() {
  const { devSheet, setDevSheet } = useApp();
  return (
    <>
      <button
        type="button"
        onClick={() => setDevSheet(true)}
        className="anim-pop fixed bottom-24 left-3 z-40 grid h-11 w-11 place-items-center rounded-full border border-mint-500/40 bg-deep-850/95 text-mint-300 shadow-[0_12px_30px_-8px_rgba(35,201,147,0.5)] backdrop-blur transition hover:brightness-110 active:scale-90 lg:hidden"
        aria-label="پیشخوان مهندسی"
      >
        <IcWrench className="h-5 w-5" />
      </button>
      <Sheet open={devSheet} onClose={() => setDevSheet(false)} title="پیشخوان مهندسی — لوکال">
        <DevPanel />
      </Sheet>
    </>
  );
}
