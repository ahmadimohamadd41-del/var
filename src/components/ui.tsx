import React, { useEffect, useRef, useState } from "react";
import type { OrderStatus, PaymentStatus } from "../lib/types";
import { haptic } from "../lib/store";

/* ============================= ICONS (inline SVG) ============================= */

type IcProps = { className?: string };
const S = ({ className = "w-5 h-5", children, vb = "0 0 24 24" }: IcProps & { children: React.ReactNode; vb?: string }) => (
  <svg viewBox={vb} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {children}
  </svg>
);

export const LogoMark = ({ className = "w-8 h-8" }: IcProps) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <path d="M20 4l12 5.6v9.2c0 7.2-5 11.6-12 14.4-7-2.8-12-7.2-12-14.4V9.6L20 4z" fill="rgba(35,201,147,0.12)" stroke="#f6bd5a" strokeWidth="2" />
    <path d="M13 21l5 5 9-10" fill="none" stroke="#46dca8" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 1.5l2.4 2.5M20 1.5l-2.4 2.5" stroke="#7cc7e8" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const IcHome = (p: IcProps) => (
  <S {...p}><path d="M3.5 10.5L12 3.5l8.5 7" /><path d="M5.5 9.5V20h13V9.5" /><path d="M9.5 20v-5.5h5V20" /></S>
);
export const IcStore = (p: IcProps) => (
  <S {...p}><path d="M4 7.5L5.5 3.5h13L20 7.5" /><path d="M4 7.5h16v3a2.6 2.6 0 01-5.2 0 2.7 2.7 0 01-5.6 0A2.6 2.6 0 014 10.5v-3z" /><path d="M5.5 13.5V20.5h13v-7" /><path d="M9.5 20.5v-4h5v4" /></S>
);
export const IcUsers = (p: IcProps) => (
  <S {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20c.6-3.4 2.8-5.3 5.5-5.3s4.9 1.9 5.5 5.3" /><path d="M15.5 5.2a3.2 3.2 0 010 5.9M17.5 14.9c1.7.7 2.8 2.4 3 5.1" /></S>
);
export const IcShield = (p: IcProps) => (
  <S {...p}><path d="M12 3l7.5 3.2v5.6c0 4.5-3.1 7.4-7.5 9.2-4.4-1.8-7.5-4.7-7.5-9.2V6.2L12 3z" /><path d="M9 12l2.2 2.2L15.5 10" /></S>
);
export const IcUser = (p: IcProps) => (
  <S {...p}><circle cx="12" cy="8" r="3.5" /><path d="M5 20.5c.8-4 3.6-6 7-6s6.2 2 7 6" /></S>
);
export const IcBolt = (p: IcProps) => (
  <S {...p}><path d="M13 2.5L5 13.5h5.5L10 21.5l8-11h-5.5L13 2.5z" /></S>
);
export const IcDownload = (p: IcProps) => (
  <S {...p}><path d="M12 4v10.5M7.5 11l4.5 4.5L16.5 11" /><path d="M4.5 19.5h15" /></S>
);
export const IcCopy = (p: IcProps) => (
  <S {...p}><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M5.5 14.5h-1a1.5 1.5 0 01-1.5-1.5V5a1.5 1.5 0 011.5-1.5H13A1.5 1.5 0 0114.5 5v.5" /></S>
);
export const IcCheck = (p: IcProps) => (
  <S {...p}><path d="M4.5 12.5l5 5 10-11" /></S>
);
export const IcX = (p: IcProps) => (
  <S {...p}><path d="M6 6l12 12M18 6L6 18" /></S>
);
export const IcClock = (p: IcProps) => (
  <S {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2.5" /></S>
);
export const IcWallet = (p: IcProps) => (
  <S {...p}><path d="M4 7.5A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v9a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 16.5v-9z" /><path d="M15 12h5v3h-5a1.5 1.5 0 010-3z" /><path d="M4 8.5h12" /></S>
);
export const IcCard = (p: IcProps) => (
  <S {...p}><rect x="3.5" y="5.5" width="17" height="13" rx="2.5" /><path d="M3.5 10h17" /><path d="M7 15h4" /></S>
);
export const IcReceipt = (p: IcProps) => (
  <S {...p}><path d="M6 3.5h12V20l-2.4-1.6L13.2 20l-2.4-1.6L8.4 20 6 18.4V3.5z" /><path d="M9 8h6M9 11.5h6M9 15h3.5" /></S>
);
export const IcActivity = (p: IcProps) => (
  <S {...p}><path d="M3.5 12h4l2.5-6.5 4 13L16.5 12h4" /></S>
);
export const IcSettings = (p: IcProps) => (
  <S {...p}><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4L18 18M18 6l-1.6 1.6M7.6 16.4L6 18" /></S>
);
export const IcRefresh = (p: IcProps) => (
  <S {...p}><path d="M20 12a8 8 0 11-2.3-5.6" /><path d="M20 3.5V8h-4.5" /></S>
);
export const IcAlert = (p: IcProps) => (
  <S {...p}><path d="M12 4L2.8 19.5h18.4L12 4z" /><path d="M12 10v4M12 16.8v.4" /></S>
);
export const IcLock = (p: IcProps) => (
  <S {...p}><rect x="5.5" y="10.5" width="13" height="9.5" rx="2" /><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" /></S>
);
export const IcPlus = (p: IcProps) => (
  <S {...p}><path d="M12 5v14M5 12h14" /></S>
);
export const IcMinus = (p: IcProps) => (
  <S {...p}><path d="M5 12h14" /></S>
);
export const IcServer = (p: IcProps) => (
  <S {...p}><rect x="4" y="4.5" width="16" height="6" rx="1.5" /><rect x="4" y="13.5" width="16" height="6" rx="1.5" /><path d="M7.5 7.5h.01M7.5 16.5h.01" /></S>
);
export const IcSignal = (p: IcProps) => (
  <S {...p}><path d="M4 19.5v-3M9 19.5v-6.5M14 19.5V9M19 19.5V4.5" /></S>
);
export const IcEye = (p: IcProps) => (
  <S {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></S>
);
export const IcEyeOff = (p: IcProps) => (
  <S {...p}><path d="M4 4l16 16" /><path d="M9.9 5.9A9.4 9.4 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 01-3.2 3.9M6 8.2A16 16 0 002.5 12S6 18.5 12 18.5a9 9 0 003.5-.7" /></S>
);
export const IcSend = (p: IcProps) => (
  <S {...p}><path d="M20.5 3.5L3.5 10l6 2.5 2.5 6 8.5-15z" /><path d="M9.5 12.5l11-9" /></S>
);
export const IcChevD = (p: IcProps) => (
  <S {...p}><path d="M6 9.5l6 6 6-6" /></S>
);
export const IcHistory = (p: IcProps) => (
  <S {...p}><path d="M4 6v4h4" /><path d="M4.5 10A8 8 0 1112 20a8 8 0 01-7.4-5" /><path d="M12 8v4.5l3 2" /></S>
);
export const IcPower = (p: IcProps) => (
  <S {...p}><path d="M12 3.5V11" /><path d="M7 6.5a7.5 7.5 0 1010 0" /></S>
);
export const IcTg = (p: IcProps) => (
  <S {...p}><path d="M20.5 4.5L3.5 11.2l5.4 2 2 5.8 3-3.6 4.6 3.1 2-14z" /><path d="M8.9 13.2l9.6-6.9" /></S>
);
export const IcSpark = (p: IcProps) => (
  <S {...p}><path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8L12 3.5z" /><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" /></S>
);
export const IcFile = (p: IcProps) => (
  <S {...p}><path d="M6 3.5h8L19 8.5v12H6V3.5z" /><path d="M13.5 3.5v5.5H19" /></S>
);

/* ============================= PRIMITIVES ============================= */

export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("rv-in");
            io.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`rv ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function SectionHead({ title, sub, icon }: { title: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mt-7 mb-3.5">
      {icon && <span className="text-gold-400">{icon}</span>}
      <h2 className="font-display text-[1.45rem] leading-7 text-mist-100">{title}</h2>
      <span className="flex-1 h-px bg-gradient-to-l from-transparent via-mint-400/25 to-transparent" />
      {sub && <span className="text-[0.68rem] text-mist-500 font-medium">{sub}</span>}
    </div>
  );
}

export type Tone = "gold" | "mint" | "coral" | "sky" | "mist";

const chipTones: Record<Tone, string> = {
  gold: "bg-gold-500/12 text-gold-300 border-gold-500/30",
  mint: "bg-mint-500/12 text-mint-300 border-mint-500/30",
  coral: "bg-coral-500/12 text-coral-300 border-coral-500/30",
  sky: "bg-sky-350/12 text-sky-350 border-sky-350/30",
  mist: "bg-mist-300/8 text-mist-400 border-mist-300/15",
};

export function Chip({ tone = "mist", children, className = "" }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return <span className={`chip border ${chipTones[tone]} ${className}`}>{children}</span>;
}

export const orderTone: Record<OrderStatus, { label: string; tone: Tone }> = {
  awaiting_payment: { label: "در انتظار تأیید فیش", tone: "gold" },
  provisioning: { label: "در حال ساخت اکانت", tone: "sky" },
  active: { label: "فعال", tone: "mint" },
  failed: { label: "ناموفق", tone: "coral" },
};

export const payTone: Record<PaymentStatus, { label: string; tone: Tone }> = {
  pending: { label: "در انتظار بررسی", tone: "gold" },
  confirmed: { label: "تأیید شده", tone: "mint" },
  rejected: { label: "رد شده", tone: "coral" },
};

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        haptic("tap");
        onChange(!on);
      }}
      className="flex items-center gap-2.5 cursor-pointer select-none group"
      aria-pressed={on}
    >
      <span className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${on ? "bg-mint-500/80" : "bg-deep-600"}`}>
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-mist-100 shadow transition-all duration-300 ${on ? "right-[22px]" : "right-0.5"}`}
        />
      </span>
      {label && <span className="text-sm text-mist-200 group-hover:text-mist-100 transition-colors">{label}</span>}
    </button>
  );
}

export function Stepper({ value, onChange, min = 1, max = 10 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-1.5" dir="ltr">
      <button type="button" className="btn btn-ghost w-9 h-9" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="کاهش">
        <IcMinus className="w-4 h-4" />
      </button>
      <span className="w-11 text-center font-display text-xl text-mist-100 tabular">{value.toLocaleString("fa-IR")}</span>
      <button type="button" className="btn btn-ghost w-9 h-9" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="افزایش">
        <IcPlus className="w-4 h-4" />
      </button>
    </div>
  );
}

export function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-ghost px-2.5 py-1.5 text-xs"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        haptic("ok");
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
    >
      {done ? <IcCheck className="w-3.5 h-3.5 text-mint-400" /> : <IcCopy className="w-3.5 h-3.5" />}
      {label && <span>{done ? "کپی شد" : label}</span>}
    </button>
  );
}

/** دکمه با تأیید دومرحله‌ای برای عملیات حساس */
export function ConfirmBtn({
  onConfirm,
  children,
  confirmLabel = "مطمئن هستید؟",
  className = "btn btn-coral px-3 py-1.5 text-xs",
  busy = false,
}: {
  onConfirm: () => void;
  children?: React.ReactNode;
  confirmLabel?: string;
  className?: string;
  busy?: boolean;
}) {
  const [arm, setArm] = useState(false);
  useEffect(() => {
    if (!arm) return;
    const t = setTimeout(() => setArm(false), 3000);
    return () => clearTimeout(t);
  }, [arm]);
  return (
    <button
      type="button"
      disabled={busy}
      className={`${className} ${arm ? "!bg-coral-500/25 !border-coral-400 !text-coral-300" : ""}`}
      onClick={() => {
        haptic("tap");
        if (!arm) setArm(true);
        else {
          setArm(false);
          onConfirm();
        }
      }}
    >
      {busy ? "…" : arm ? confirmLabel : (children ?? <><IcX className="w-3.5 h-3.5" /> حذف</>)}
    </button>
  );
}

/* ============================= RING GAUGE ============================= */

export function Ring({
  value,
  size = 172,
  stroke = 13,
  tone = "mint",
  children,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  tone?: "mint" | "gold" | "coral";
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [off, setOff] = useState(c);
  useEffect(() => {
    const t = setTimeout(() => setOff(c * (1 - Math.max(0, Math.min(1, value)))), 80);
    return () => clearTimeout(t);
  }, [value, c]);
  const color = tone === "mint" ? "#46dca8" : tone === "gold" ? "#f6bd5a" : "#f58a80";
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(127,232,198,0.1)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.25,0.7,0.2,1), stroke 0.4s", filter: `drop-shadow(0 0 8px ${color}55)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* ============================= MODAL (bottom sheet) ============================= */

export function Modal({ open, onClose, children, tall = false }: { open: boolean; onClose: () => void; children: React.ReactNode; tall?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-deep-950/75 backdrop-blur-[3px]" onClick={onClose} />
      <div
        className={`anim-sheet relative w-full sm:max-w-md bg-deep-850 border border-mint-400/15 sm:rounded-xl rounded-t-xl shadow-2xl shadow-black/60 ${tall ? "max-h-[92dvh]" : "max-h-[86dvh]"} overflow-y-auto`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="sticky top-0 z-10 flex justify-center pt-2.5 pb-1 bg-gradient-to-b from-deep-850 via-deep-850/95 to-transparent">
          <span className="w-10 h-1 rounded-full bg-deep-500" />
        </div>
        {children}
      </div>
    </div>
  );
}

/* ============================= EMPTY STATE ============================= */

export function Empty({ icon, title, sub }: { icon?: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="card px-6 py-10 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-deep-700/60 border border-mint-400/10 flex items-center justify-center text-mist-500 mb-3">
        {icon ?? <IcFile className="w-6 h-6" />}
      </div>
      <p className="font-display text-lg text-mist-200">{title}</p>
      {sub && <p className="text-xs text-mist-500 mt-1 leading-5">{sub}</p>}
    </div>
  );
}
