import { useEffect, useRef, useState, type ReactNode } from "react";
import type { OrderStatus, PartnerStatus, PaymentStatus } from "../lib/types";
import { pct } from "../lib/format";
import { IcCheck, IcCopy, IcMinus, IcPlus, IcX } from "./icons";

/* --------------------------------- Button ---------------------------------- */

type BtnVariant = "primary" | "gold" | "ghost" | "danger" | "dark";

export function Btn({
  variant = "primary",
  busy = false,
  disabled = false,
  full = true,
  className = "",
  onClick,
  children,
}: {
  variant?: BtnVariant;
  busy?: boolean;
  disabled?: boolean;
  full?: boolean;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45";
  const styles: Record<BtnVariant, string> = {
    primary:
      "bg-gradient-to-b from-mint-400 to-mint-600 text-deep-950 shadow-[0_6px_20px_-6px_rgba(35,201,147,0.55)] hover:brightness-110",
    gold: "bg-gradient-to-b from-gold-300 to-gold-500 text-deep-950 shadow-[0_6px_20px_-6px_rgba(246,189,90,0.5)] hover:brightness-110",
    ghost:
      "border border-white/12 bg-white/[0.04] text-mist-100 hover:border-mint-500/40 hover:bg-mint-500/10",
    danger:
      "border border-coral-500/35 bg-coral-500/12 text-coral-300 hover:bg-coral-500/20",
    dark: "bg-deep-700 text-mist-300 hover:bg-deep-600 hover:text-mist-100",
  };
  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={onClick}
      className={`${base} ${styles[variant]} ${full ? "w-full" : ""} ${className}`}
    >
      {busy && <Spinner className="h-4 w-4" dark={variant === "primary" || variant === "gold"} />}
      {children}
    </button>
  );
}

export function Spinner({ className = "h-5 w-5", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${className} ${dark ? "text-deep-900/40" : "text-white/25"}`}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke={dark ? "#06141a" : "#46dca8"}
        strokeWidth="3"
        strokeLinecap="round"
        className="origin-center animate-spin"
        style={{ animationDuration: "0.8s" }}
      />
    </svg>
  );
}

/* ---------------------------------- Chips ---------------------------------- */

export type Tone = "mint" | "gold" | "coral" | "mist" | "sky";

const toneCls: Record<Tone, string> = {
  mint: "border-mint-500/30 bg-mint-500/12 text-mint-300",
  gold: "border-gold-400/30 bg-gold-400/12 text-gold-300",
  coral: "border-coral-500/30 bg-coral-500/12 text-coral-300",
  mist: "border-white/12 bg-white/[0.05] text-mist-300",
  sky: "border-sky-350/30 bg-sky-350/12 text-sky-350",
};

export function Chip({ tone = "mist", className = "", children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${toneCls[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  pending_payment: { label: "در انتظار پرداخت", tone: "gold" },
  awaiting_approval: { label: "در انتظار تأیید مدیر", tone: "gold" },
  paid: { label: "پرداخت شده", tone: "sky" },
  provisioning: { label: "در حال پروویژن", tone: "sky" },
  done: { label: "فعال شد", tone: "mint" },
  failed: { label: "شکست امن", tone: "coral" },
  rejected: { label: "رد شده", tone: "coral" },
};

export const PAY_STATUS: Record<PaymentStatus, { label: string; tone: Tone }> = {
  pending: { label: "در انتظار", tone: "gold" },
  approved: { label: "تأیید شده", tone: "mint" },
  rejected: { label: "رد شده", tone: "coral" },
};

export const PARTNER_STATUS: Record<PartnerStatus, { label: string; tone: Tone }> = {
  pending: { label: "در انتظار تأیید", tone: "gold" },
  active: { label: "فعال", tone: "mint" },
  suspended: { label: "تعلیق شده", tone: "coral" },
};

export function LiveDot({ className = "" }: { className?: string }) {
  return <span className={`anim-pulse-dot inline-block h-2 w-2 rounded-full bg-mint-400 ${className}`} />;
}

/* ------------------------------- Usage meter ------------------------------- */

export function UsageBar({ used, quota, capped }: { used: number; quota: number; capped: boolean }) {
  const p = pct(used, quota);
  const color = capped ? "bg-coral-500" : p > 85 ? "bg-gold-400" : "bg-gradient-to-l from-mint-400 to-mint-600";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-deep-950/80 ring-1 ring-white/[0.06]">
      <div
        className={`relative h-full rounded-full transition-[width] duration-1000 ease-out ${color}`}
        style={{ width: `${p}%` }}
      >
        {!capped && (
          <div
            className="anim-stripes absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(255,255,255,0.9) 0 6px, transparent 6px 12px)",
              backgroundSize: "24px 24px",
            }}
          />
        )}
      </div>
    </div>
  );
}

/* --------------------------------- Stepper --------------------------------- */

export function Stepper({
  value,
  min = 1,
  max = 10,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-white/12 bg-deep-800/80 p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid h-8 w-8 place-items-center rounded-lg text-mist-300 transition hover:bg-deep-700 hover:text-mist-100 active:scale-90"
        aria-label="کم کردن"
      >
        <IcMinus className="h-4 w-4" />
      </button>
      <span className="w-9 text-center text-base font-extrabold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid h-8 w-8 place-items-center rounded-lg text-mist-300 transition hover:bg-deep-700 hover:text-mist-100 active:scale-90"
        aria-label="زیاد کردن"
      >
        <IcPlus className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------ Segmented tabs ------------------------------ */

export function Seg<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className={`inline-flex w-full gap-1 rounded-xl border border-white/[0.08] bg-deep-900/80 p-1 ${size === "sm" ? "text-[11px]" : "text-xs"}`}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-lg px-2 font-bold transition-all duration-200 ${size === "sm" ? "py-1.5" : "py-2"} ${
            value === o.id
              ? "bg-deep-700 text-mint-300 shadow-[inset_0_0_0_1px_rgba(70,220,168,0.25)]"
              : "text-mist-500 hover:text-mist-300"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* --------------------------------- Toggle ---------------------------------- */

export function Toggle({ on, onChange, disabled }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-40 ${
        on ? "bg-mint-500" : "bg-deep-600"
      }`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-mist-100 shadow transition-all duration-200 ${
          on ? "right-[22px]" : "right-0.5"
        }`}
      />
    </button>
  );
}

/* --------------------------------- CopyBtn --------------------------------- */

export function CopyBtn({ text, label = "کپی" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  const t = useRef<number | null>(null);
  useEffect(() => () => { if (t.current) window.clearTimeout(t.current); }, []);
  const copy = async () => {
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
    setDone(true);
    if (t.current) window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setDone(false), 1600);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-all active:scale-95 ${
        done
          ? "border-mint-500/40 bg-mint-500/15 text-mint-300"
          : "border-white/12 bg-white/[0.05] text-mist-300 hover:border-mint-500/40 hover:text-mint-300"
      }`}
    >
      {done ? <IcCheck className="h-3.5 w-3.5" /> : <IcCopy className="h-3.5 w-3.5" />}
      {done ? "کپی شد" : label}
    </button>
  );
}

/* ---------------------------------- Field ---------------------------------- */

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <span className="lbl">{label}</span>
      {children}
      {hint && <p className="mt-1 text-[10.5px] leading-5 text-mist-500">{hint}</p>}
    </div>
  );
}

/* -------------------------------- EmptyState ------------------------------- */

export function EmptyState({ icon, title, sub }: { icon: ReactNode; title: string; sub?: string }) {
  return (
    <div className="anim-fade flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/10 bg-deep-900/50 px-6 py-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-deep-800 text-mist-500">
        {icon}
      </div>
      <p className="text-sm font-bold text-mist-300">{title}</p>
      {sub && <p className="max-w-[240px] text-xs leading-6 text-mist-500">{sub}</p>}
    </div>
  );
}

/* ---------------------------------- Sheet ---------------------------------- */

export function Sheet({
  open,
  onClose,
  title,
  children,
  locked = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  locked?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !locked) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, locked]);

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        aria-label="بستن"
        onClick={() => !locked && onClose()}
        className="anim-fade absolute inset-0 bg-deep-950/75 backdrop-blur-[3px]"
      />
      <div className="anim-sheet relative flex max-h-[88%] flex-col rounded-t-3xl border border-b-0 border-white/10 bg-deep-850 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
          <div className="mx-auto absolute right-1/2 top-1.5 h-1 w-10 translate-x-1/2 rounded-full bg-white/15" />
          <h3 className="font-display text-lg text-mist-100">{title}</h3>
          {!locked && (
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-mist-500 transition hover:border-coral-500/40 hover:text-coral-300 active:scale-90"
              aria-label="بستن پنل"
            >
              <IcX className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* -------------------------------- ConfirmBtn -------------------------------- */

export function ConfirmBtn({
  label,
  confirmLabel = "مطمئنم؟",
  onConfirm,
  variant = "danger",
  className = "",
}: {
  label: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  variant?: BtnVariant;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 2600);
    return () => window.clearTimeout(t);
  }, [armed]);
  return (
    <Btn
      variant={armed ? "danger" : variant}
      full={false}
      className={className}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmLabel : label}
    </Btn>
  );
}
