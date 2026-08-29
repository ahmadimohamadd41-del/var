import React, { useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { agoFa, fa, ltrDigits, maskCard, money, timeFa, dateFa } from "../lib/format";
import type { AuditKind } from "../lib/types";
import {
  Chip, ConfirmBtn, Empty, IcActivity, IcAlert, IcCard, IcCheck, IcHistory, IcLock, IcMinus, IcPlus,
  IcReceipt, IcRefresh, IcServer, IcSettings, IcShield, IcUsers, IcWallet, IcX, Reveal, SectionHead, Toggle, payTone,
} from "../components/ui";

type Section = "health" | "payments" | "partners" | "wallet" | "products" | "settings" | "audit";

const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "health", label: "سلامت", icon: <IcActivity className="w-4 h-4" /> },
  { id: "payments", label: "پرداخت‌ها", icon: <IcReceipt className="w-4 h-4" /> },
  { id: "partners", label: "همکاران", icon: <IcUsers className="w-4 h-4" /> },
  { id: "wallet", label: "کیف پول", icon: <IcWallet className="w-4 h-4" /> },
  { id: "products", label: "محصولات", icon: <IcCard className="w-4 h-4" /> },
  { id: "settings", label: "تنظیمات", icon: <IcSettings className="w-4 h-4" /> },
  { id: "audit", label: "رویدادها", icon: <IcHistory className="w-4 h-4" /> },
];

export default function Admin() {
  const { me } = useStore();
  const [sec, setSec] = useState<Section>("health");

  if (me.role !== "admin") {
    return (
      <Reveal>
        <div className="card px-6 py-12 text-center">
          <span className="mx-auto w-14 h-14 rounded-full bg-deep-700 border border-coral-500/20 text-coral-300 flex items-center justify-center mb-3">
            <IcLock className="w-6 h-6" />
          </span>
          <p className="font-display text-xl text-mist-200">دسترسی فقط برای مدیر</p>
          <p className="text-xs text-mist-500 mt-2 leading-6">
            در نسخه سرور، نقش‌ها از تلگرام و فهرست ادمین‌ها می‌آیند.
            <br />
            برای تست لوکال، از صفحه «پروفایل» به‌عنوان «مدیریت VAR» وارد شوید.
          </p>
        </div>
      </Reveal>
    );
  }

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSec(s.id)}
            className={`btn shrink-0 px-3.5 py-2 text-xs ${sec === s.id ? "btn-gold" : "btn-ghost"}`}
          >
            {s.icon}
            {s.label}
            {s.id === "payments" && <PendingBadge />}
          </button>
        ))}
      </div>

      <div key={sec} className="anim-fade-up mt-4">
        {sec === "health" && <HealthSec />}
        {sec === "payments" && <PaymentsSec />}
        {sec === "partners" && <PartnersSec />}
        {sec === "wallet" && <WalletSec />}
        {sec === "products" && <ProductsSec />}
        {sec === "settings" && <SettingsSec />}
        {sec === "audit" && <AuditSec />}
      </div>
    </div>
  );
}

function PendingBadge() {
  const { state } = useStore();
  const n = state.payments.filter((p) => p.status === "pending").length;
  if (!n) return null;
  return <span className="w-5 h-5 rounded-full bg-coral-500 text-mist-100 text-[0.62rem] font-bold flex items-center justify-center tabular">{fa(n)}</span>;
}

/* ================= سلامت سیستم ================= */
function HealthSec() {
  const { api, toast } = useStore();
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ radiusMs: number; dbMs: number; workerMs: number; serverMs: number; at: number } | null>(null);

  const rows = [
    { k: "FreeRADIUS (هاست)", sub: "سرویس سیستمی — کانتینر نشده", ms: res?.radiusMs, icon: <IcShield className="w-5 h-5" /> },
    { k: "MariaDB «radius»", sub: "روی هاست — فقط‌خواندنی برای VAR", ms: res?.dbMs, icon: <IcServer className="w-5 h-5" /> },
    { k: "Worker پروویژنینگ", sub: "صف ساخت اکانت و تمدید", ms: res?.workerMs, icon: <IcRefresh className="w-5 h-5" /> },
    { k: "سرور آلمان ۱", sub: "Frankfurt — OpenVPN", ms: res?.serverMs, icon: <IcActivity className="w-5 h-5" /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-mist-500">{res ? `آخرین بررسی: ${timeFa(res.at)}` : "هنوز بررسی انجام نشده"}</p>
        <button
          className="btn btn-mint px-3.5 py-2 text-xs"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const r = await api.healthCheck();
            setRes(r);
            setBusy(false);
            toast("بررسی سلامت انجام شد — همه سرویس‌ها سالم", "ok");
          }}
        >
          <IcRefresh className={`w-4 h-4 ${busy ? "anim-spin-slow" : ""}`} />
          {busy ? "در حال بررسی…" : "بررسی دوباره"}
        </button>
      </div>
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <Reveal key={r.k} delay={i * 60}>
            <div className="card card-hover px-4 py-3.5 flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-deep-700 text-mint-300 flex items-center justify-center shrink-0">{r.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-mist-100">{r.k}</p>
                <p className="text-[0.68rem] text-mist-500 mt-0.5">{r.sub}</p>
              </div>
              {r.ms !== undefined ? (
                <div className="text-left">
                  <p className="text-sm font-bold text-mint-300 tabular" dir="ltr">{r.ms}ms</p>
                  <Chip tone="mint" className="mt-1">سالم</Chip>
                </div>
              ) : (
                <Chip tone="mist">نامشخص</Chip>
              )}
            </div>
          </Reveal>
        ))}
      </div>
      <p className="text-[0.68rem] text-mist-600 leading-6 mt-4">
        در نسخه سرور این مقادیر از health endpoint واقعی FastAPI می‌آیند. هیچ‌کدام از این بررسی‌ها سرویسی را restart نمی‌کنند.
      </p>
    </div>
  );
}

/* ================= پرداخت‌ها ================= */
function PaymentsSec() {
  const { state, api, toast } = useStore();
  const [busyId, setBusyId] = useState<string | null>(null);
  const pending = state.payments.filter((p) => p.status === "pending");
  const done = state.payments.filter((p) => p.status !== "pending").slice(0, 8);

  const decide = async (id: string, approve: boolean) => {
    setBusyId(id);
    const r = await api.confirmPayment(id, approve);
    setBusyId(null);
    if (r.already) toast(r.error ?? "قبلاً پردازش شده", "info");
    else if (r.ok) toast(approve ? "پرداخت تأیید و اکانت فعال شد" : "فیش رد شد", approve ? "ok" : "err");
  };

  return (
    <div>
      <SectionHead title="فیش‌های در انتظار" sub={`${fa(pending.length)} مورد`} icon={<IcReceipt className="w-5 h-5" />} />
      {pending.length === 0 ? (
        <Empty icon={<IcCheck className="w-6 h-6" />} title="صف بررسی خالی است" sub="همه فیش‌های کارت‌به‌کارت تعیین تکلیف شده‌اند." />
      ) : (
        <div className="space-y-3">
          {pending.map((p) => {
            const u = state.users.find((x) => x.id === p.userId);
            const o = state.orders.find((x) => x.id === p.orderId);
            const prod = state.products.find((x) => x.id === o?.productId);
            return (
              <div key={p.id} className="rounded-xl border border-dashed border-gold-500/45 bg-gold-500/5 overflow-hidden">
                <div className="px-4 py-2.5 bg-gold-500/10 flex items-center justify-between">
                  <span className="text-[0.7rem] font-bold text-gold-300">فیش کارت‌به‌کارت</span>
                  <span className="text-[0.65rem] text-mist-500">{agoFa(p.createdAt)}</span>
                </div>
                <div className="px-4 py-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-mist-100">{u?.name ?? "کاربر حذف‌شده"}</p>
                      <p className="text-[0.7rem] text-mist-500 mt-0.5">
                        {prod?.name ?? "—"} {o && o.qty > 1 ? `×${fa(o.qty)}` : ""} • فیش: <code dir="ltr">{p.receiptName ?? "—"}</code>
                      </p>
                    </div>
                    <span className="font-display text-xl text-gold-300 tabular">{money(p.amount)}</span>
                  </div>
                  <div className="flex gap-2 mt-3.5">
                    <button className="btn btn-mint flex-1 py-2.5 text-sm" disabled={busyId === p.id} onClick={() => decide(p.id, true)}>
                      {busyId === p.id ? <IcRefresh className="w-4 h-4 anim-spin-slow" /> : <IcCheck className="w-4 h-4" />}
                      تأیید و فعال‌سازی
                    </button>
                    <ConfirmBtn onConfirm={() => decide(p.id, false)} busy={busyId === p.id} className="btn btn-coral flex-1 py-2.5 text-sm">
                      <IcX className="w-4 h-4" />
                      رد فیش
                    </ConfirmBtn>
                  </div>
                  <p className="text-[0.63rem] text-mist-600 mt-2.5 leading-5">
                    تأیید → provisioning خودکار و آیدمپوتنت. کلیک تکراری یا callback دوم، پرداخت را دوباره پردازش نمی‌کند.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SectionHead title="تاریخچه پرداخت‌ها" icon={<IcHistory className="w-5 h-5" />} />
      <div className="card divide-y divide-mint-400/6">
        {done.map((p) => {
          const u = state.users.find((x) => x.id === p.userId);
          const t = payTone[p.status];
          return (
            <div key={p.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-mist-200">
                  {u?.name ?? "—"} • {p.method === "gateway" ? "درگاه" : p.method === "card" ? "کارت‌به‌کارت" : "کیف پول"}
                </p>
                <p className="text-[0.65rem] text-mist-600 mt-0.5">
                  {agoFa(p.createdAt)} {p.decidedBy ? `— بررسی: ${p.decidedBy}` : ""}
                </p>
              </div>
              <span className="text-sm font-bold text-mist-200 tabular">{money(p.amount)}</span>
              <Chip tone={t.tone}>{t.label}</Chip>
            </div>
          );
        })}
        {done.length === 0 && <p className="text-xs text-mist-500 text-center py-5">پرداختی ثبت نشده</p>}
      </div>
    </div>
  );
}

/* ================= همکاران ================= */
function PartnersSec() {
  const { state, api, toast } = useStore();
  const [busyId, setBusyId] = useState<string | null>(null);
  const pending = state.partnerRequests.filter((r) => r.status === "pending");
  const approved = state.users.filter((u) => u.role === "partner");

  const decide = async (id: string, approve: boolean) => {
    setBusyId(id);
    await api.decidePartner(id, approve);
    setBusyId(null);
    toast(approve ? "همکار تأیید شد — کیف پول صفر ایجاد شد" : "درخواست رد شد", approve ? "ok" : "info");
  };

  return (
    <div>
      <SectionHead title="درخواست‌های همکاری" sub={`${fa(pending.length)} در انتظار`} icon={<IcUsers className="w-5 h-5" />} />
      {pending.length === 0 ? (
        <Empty icon={<IcUsers className="w-6 h-6" />} title="درخواست جدیدی نیست" />
      ) : (
        <div className="space-y-3">
          {pending.map((r) => {
            const u = state.users.find((x) => x.id === r.userId);
            return (
              <div key={r.id} className="card px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-deep-700 border border-gold-400/25 text-gold-300 font-display text-lg flex items-center justify-center">
                    {u?.name.trim()[0]}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-mist-100">{u?.name}</p>
                    <p className="text-[0.68rem] text-mist-500 mt-0.5" dir="ltr">@{u?.tgId} • {agoFa(r.at)}</p>
                  </div>
                </div>
                <p className="text-xs text-mist-400 leading-6 mt-3 rounded-lg bg-deep-900/70 border border-mint-400/8 px-3 py-2.5">«{r.note}»</p>
                <div className="flex gap-2 mt-3">
                  <button className="btn btn-mint flex-1 py-2.5 text-sm" disabled={busyId === r.id} onClick={() => decide(r.id, true)}>
                    تأیید همکار
                  </button>
                  <ConfirmBtn onConfirm={() => decide(r.id, false)} busy={busyId === r.id} className="btn btn-coral flex-1 py-2.5 text-sm">
                    رد درخواست
                  </ConfirmBtn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SectionHead title="همکاران فعال" icon={<IcCheck className="w-5 h-5" />} />
      <div className="space-y-2.5">
        {approved.map((p) => {
          const w = state.wallets.find((x) => x.userId === p.id);
          const sold = state.accounts.filter((a) => a.soldBy === p.id).length;
          return (
            <div key={p.id} className="card px-4 py-3.5 flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-bold text-mist-100">{p.name}</p>
                <p className="text-[0.68rem] text-mist-500 mt-0.5">{fa(sold)} فروش • عضویت از {dateFa(p.joinedAt)}</p>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-mint-300 tabular">{money(w?.balance ?? 0)}</p>
                <p className="text-[0.62rem] text-mist-600">موجودی کیف پول</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================= کیف پول ================= */
function WalletSec() {
  const { state, api, toast } = useStore();
  const partners = state.users.filter((u) => u.role === "partner");
  const [userId, setUserId] = useState(partners[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [dir, setDir] = useState<1 | -1>(1);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const wallet = state.wallets.find((w) => w.userId === (userId || partners[0]?.id));
  const targetId = userId || partners[0]?.id;

  const submit = async () => {
    const amt = Math.abs(parseInt(ltrDigits(amount).replace(/[^\d]/g, ""), 10) || 0);
    if (!targetId) return setErr("همکاری وجود ندارد");
    if (amt <= 0) return setErr("مبلغ معتبر وارد کنید");
    if (dir === -1 && (wallet?.balance ?? 0) < amt) return setErr("موجودی برای کسر کافی نیست");
    if (reason.trim().length < 4) return setErr("دلیل عملیات الزامی است — هر تراکنش ممیزی می‌شود");
    setErr("");
    setBusy(true);
    const r = await api.walletAdjust(targetId, dir * amt, reason);
    setBusy(false);
    if (r.ok) {
      toast(dir === 1 ? "کیف پول شارژ شد" : "از کیف پول کسر شد", "ok");
      setAmount("");
      setReason("");
    } else setErr(r.error ?? "خطا");
  };

  return (
    <div>
      <div className="card px-4 py-4 space-y-3.5">
        <div>
          <label className="text-xs font-bold text-mist-400 block mb-1.5">همکار</label>
          <div className="grid grid-cols-2 gap-2">
            {partners.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setUserId(p.id)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-bold transition-all cursor-pointer ${
                  targetId === p.id ? "border-gold-400/70 bg-gold-500/10 text-gold-300" : "border-mint-400/12 bg-deep-900/60 text-mist-400"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
          <p className="text-[0.68rem] text-mist-500 mt-2">
            موجودی فعلی: <b className="text-mint-300 tabular">{money(wallet?.balance ?? 0)}</b>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-mint-400/15 shrink-0">
            <button type="button" onClick={() => setDir(1)} className={`px-3.5 py-2.5 text-sm font-bold transition-colors cursor-pointer ${dir === 1 ? "bg-mint-500/20 text-mint-300" : "bg-deep-900 text-mist-500"}`}>
              <IcPlus className="w-4 h-4 inline-block -mt-0.5" /> شارژ
            </button>
            <button type="button" onClick={() => setDir(-1)} className={`px-3.5 py-2.5 text-sm font-bold transition-colors cursor-pointer ${dir === -1 ? "bg-coral-500/20 text-coral-300" : "bg-deep-900 text-mist-500"}`}>
              <IcMinus className="w-4 h-4 inline-block -mt-0.5" /> کسر
            </button>
          </div>
          <input className="input num-input flex-1" inputMode="numeric" placeholder="مبلغ (تومان)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-bold text-mist-400 block mb-1.5">دلیل عملیات <span className="text-coral-300">*</span></label>
          <input className="input" placeholder="مثلاً: تأیید فیش واریزی ۵۰۰ هزار تومانی" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={80} />
        </div>
        {err && (
          <p className="text-[0.7rem] text-coral-300 flex items-center gap-1.5">
            <IcAlert className="w-3.5 h-3.5" /> {err}
          </p>
        )}
        <button className={`btn w-full py-3 ${dir === 1 ? "btn-mint" : "btn-coral"}`} disabled={busy} onClick={submit}>
          {busy ? "در حال ثبت…" : dir === 1 ? "شارژ کیف پول" : "کسر از کیف پول"}
        </button>
        <p className="text-[0.65rem] text-mist-600 text-center">هر شارژ/کسر در ledger و گزارش رویدادها با نام شما ثبت می‌شود.</p>
      </div>

      {wallet && wallet.ledger.length > 0 && (
        <>
          <SectionHead title={`گردش ${state.users.find((u) => u.id === targetId)?.name ?? ""}`} icon={<IcWallet className="w-5 h-5" />} />
          <div className="card divide-y divide-mint-400/6">
            {wallet.ledger.map((l) => (
              <div key={l.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-mist-200 truncate">{l.reason}</p>
                  <p className="text-[0.65rem] text-mist-600 mt-0.5">{agoFa(l.at)} • {l.actor}</p>
                </div>
                <div className="text-left shrink-0">
                  <p className={`text-sm font-bold tabular ${l.delta >= 0 ? "text-mint-300" : "text-coral-300"}`}>
                    {l.delta >= 0 ? "+" : "−"}{money(Math.abs(l.delta))}
                  </p>
                  <p className="text-[0.62rem] text-mist-600 tabular">→ {money(l.balanceAfter)}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ================= محصولات ================= */
function ProductsSec() {
  const { state, api, toast } = useStore();
  const [prices, setPrices] = useState<Record<string, string>>(() => Object.fromEntries(state.products.map((p) => [p.id, String(p.price)])));

  const save = async (id: string) => {
    const v = Math.abs(parseInt(ltrDigits(prices[id] ?? "").replace(/[^\d]/g, ""), 10) || 0);
    if (v <= 0) return toast("قیمت معتبر وارد کنید", "err");
    await api.updateProduct(id, { price: v });
    toast("قیمت ذخیره شد", "ok");
  };

  return (
    <div className="space-y-3">
      {state.products.map((p) => {
        const groupOk = state.availableGroups.includes(p.groupId);
        return (
          <div key={p.id} className={`card px-4 py-4 ${!p.active ? "opacity-60" : ""}`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-display text-lg text-mist-100">اشتراک {p.name} <span className="text-mist-500 text-sm">/ {fa(p.durationDays)} روزه</span></p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Chip tone={groupOk ? "mint" : "coral"}>گروه {p.groupId} {groupOk ? "موجود" : "ناموجود!"}</Chip>
                  <Chip tone="mist">فقط سهمیه ترافیک</Chip>
                </div>
              </div>
              <Toggle
                on={p.active}
                onChange={async (v) => {
                  await api.updateProduct(p.id, { active: v });
                  toast(v ? "محصول فعال شد" : "محصول غیرفعال شد", "info");
                }}
              />
            </div>
            <div className="flex items-center gap-2 mt-3.5">
              <input
                className="input num-input flex-1"
                inputMode="numeric"
                value={prices[p.id] ?? ""}
                onChange={(e) => setPrices((s) => ({ ...s, [p.id]: e.target.value }))}
              />
              <span className="text-xs text-mist-500 shrink-0">تومان</span>
              <button className="btn btn-ghost px-4 py-2.5 text-xs" onClick={() => save(p.id)}>
                ذخیره قیمت
              </button>
            </div>
            {!groupOk && (
              <p className="text-[0.68rem] text-coral-300 mt-2.5 leading-5 flex gap-1.5">
                <IcAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                این گروه در FreeRADIUS نیست — خرید این محصول با «شکست امن» مواجه می‌شود و گروه خودکار ساخته نخواهد شد.
              </p>
            )}
          </div>
        );
      })}
      <p className="text-[0.68rem] text-mist-600 leading-6">
        تغییر حجم/مدت محصول = نیاز به گروه RADIUS جدید و هماهنگی با ادمین سرور. در MVP فقط قیمت و فعال/غیرفعال از اینجا مدیریت می‌شود.
      </p>
    </div>
  );
}

/* ================= تنظیمات ================= */
function SettingsSec() {
  const { state, api, toast } = useStore();
  const [f, setF] = useState({ ...state.settings });
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setBusy(true);
    await api.updateSettings({
      cardNumber: f.cardNumber.trim(),
      cardHolder: f.cardHolder.trim(),
      supportHandle: f.supportHandle.trim(),
      apiBase: f.apiBase.trim(),
      minPartnerBalance: Math.max(0, Math.abs(parseInt(ltrDigits(String(f.minPartnerBalance)).replace(/[^\d]/g, ""), 10) || 0)),
      gatewayEnabled: f.gatewayEnabled,
      simulateMissingGroup: f.simulateMissingGroup,
    });
    setBusy(false);
    toast("تنظیمات ذخیره و ممیزی شد", "ok");
  };

  return (
    <div className="space-y-3.5">
      <div className="card px-4 py-4 space-y-3">
        <p className="text-xs font-bold text-gold-300">کارت‌به‌کارت</p>
        <Field label="شماره کارت">
          <input className="input num-input" dir="ltr" value={f.cardNumber} onChange={(e) => set("cardNumber", e.target.value)} />
        </Field>
        <Field label="به نام">
          <input className="input" value={f.cardHolder} onChange={(e) => set("cardHolder", e.target.value)} />
        </Field>
      </div>

      <div className="card px-4 py-4 space-y-3">
        <p className="text-xs font-bold text-gold-300">همکاران و پشتیبانی</p>
        <Field label="حداقل موجودی کیف پول همکار (تومان)">
          <input className="input num-input" inputMode="numeric" value={String(f.minPartnerBalance)} onChange={(e) => set("minPartnerBalance", e.target.value as never)} />
        </Field>
        <Field label="آیدی پشتیبانی تلگرام">
          <input className="input" dir="ltr" value={f.supportHandle} onChange={(e) => set("supportHandle", e.target.value)} />
        </Field>
        <Field label="آدرس API بک‌اند (آمادهٔ اتصال به FastAPI)">
          <input className="input num-input" dir="ltr" value={f.apiBase} onChange={(e) => set("apiBase", e.target.value)} />
        </Field>
      </div>

      <div className="card px-4 py-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-mist-100">درگاه پرداخت آنلاین</p>
            <p className="text-[0.68rem] text-mist-500 mt-0.5">در صورت غیرفعال‌بودن، فقط کارت‌به‌کارت و کیف پول ارائه می‌شود</p>
          </div>
          <Toggle on={f.gatewayEnabled} onChange={(v) => set("gatewayEnabled", v)} />
        </div>
        <div className="border-t border-mint-400/8 pt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-coral-300">حالت تست: گروه G50 ناموجود</p>
            <p className="text-[0.68rem] text-mist-500 mt-0.5">شبیه‌سازی شکست امن provisioning برای بسته ۵۰ گیگ — بدون نوشتن در RADIUS</p>
          </div>
          <Toggle on={f.simulateMissingGroup} onChange={(v) => set("simulateMissingGroup", v)} />
        </div>
      </div>

      <button className="btn btn-gold w-full py-3.5" disabled={busy} onClick={save}>
        {busy ? "در حال ذخیره…" : "ذخیره تنظیمات"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-mist-400 block mb-1.5">{label}</span>
      {children}
    </label>
  );
}

/* ================= گزارش رویدادها ================= */
function AuditSec() {
  const { state } = useStore();
  const [filter, setFilter] = useState<AuditKind | "all">("all");
  const list = useMemo(() => (filter === "all" ? state.audit : state.audit.filter((a) => a.kind === filter)), [state.audit, filter]);

  const kindChip: Record<AuditKind, React.ReactNode> = {
    info: <Chip tone="sky">عملیات</Chip>,
    money: <Chip tone="gold">مالی</Chip>,
    security: <Chip tone="mint">امنیتی</Chip>,
    danger: <Chip tone="coral">خطا</Chip>,
  };

  return (
    <div>
      <div className="flex gap-2 mb-3.5 flex-wrap">
        {([["all", "همه"], ["money", "مالی"], ["security", "امنیتی"], ["danger", "خطاها"], ["info", "عملیات"]] as const).map(([k, l]) => (
          <button key={k} className={`btn px-3 py-1.5 text-[0.7rem] ${filter === k ? "btn-gold" : "btn-ghost"}`} onClick={() => setFilter(k)}>
            {l}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {list.map((a, i) => (
          <Reveal key={a.id} delay={Math.min(i, 8) * 40}>
            <div className="card px-4 py-3 flex items-start gap-3">
              <span className={`w-1.5 self-stretch rounded-full shrink-0 ${a.kind === "danger" ? "bg-coral-400" : a.kind === "money" ? "bg-gold-400" : a.kind === "security" ? "bg-mint-400" : "bg-sky-350"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-bold text-mist-100">{a.action}</p>
                  {kindChip[a.kind]}
                </div>
                <p className="text-[0.7rem] text-mist-400 mt-1 leading-5">{a.detail}</p>
                <p className="text-[0.62rem] text-mist-600 mt-1">{a.actor} • {agoFa(a.at)} — {timeFa(a.at)}</p>
              </div>
            </div>
          </Reveal>
        ))}
        {list.length === 0 && <Empty title="رویدادی با این فیلتر نیست" />}
      </div>
    </div>
  );
}
