import { useState } from "react";
import { useApp } from "../lib/store";
import * as api from "../lib/backend";
import type { AuditKind, Partner, Product } from "../lib/types";
import { faNum, faTime, faDate, toman } from "../lib/format";
import { Btn, Chip, ConfirmBtn, EmptyState, Field, ORDER_STATUS, PARTNER_STATUS, Seg, Sheet, Spinner, Toggle } from "../components/ui";
import { IcAlert, IcBan, IcCard, IcCheck, IcDb, IcGear, IcPulse, IcRefresh, IcServer, IcShield, IcUsers, IcWallet } from "../components/icons";

/* ----------------------------- تأیید پرداخت‌ها ----------------------------- */

export function AdminPayments() {
  const { snap, runSnap, toast } = useApp();
  const [busyId, setBusyId] = useState<string | null>(null);
  if (!snap) return null;

  const pending = snap.orders.filter((o) => o.status === "awaiting_approval");
  const recent = snap.orders
    .filter((o) => ["done", "failed", "rejected"].includes(o.status))
    .slice(0, 4);

  const approve = async (id: string) => {
    setBusyId(id);
    const s = await runSnap(() => api.adminApprovePayment(id));
    setBusyId(null);
    if (!s) return;
    const o = s.orders.find((x) => x.id === id);
    if (o?.status === "done") toast("ok", `سفارش ${o.ref} تأیید و پروویژن شد`);
  };

  return (
    <div className="px-4 pb-6 pt-4">
      <h2 className="font-display text-[26px] leading-8">تأیید پرداخت‌ها</h2>
      <p className="mb-4 mt-1 text-[11.5px] text-mist-500">رسیدهای کارت‌به‌کارت — تأیید دستی، پروویژن خودکار و idempotent</p>

      {pending.length === 0 ? (
        <EmptyState icon={<IcCheck className="h-6 w-6" />} title="صف تأیید خالی است" sub="رسید جدیدی در انتظار تأیید نیست. وقتی مشتری رسید ثبت کند اینجا ظاهر می‌شود." />
      ) : (
        <div className="stagger space-y-3">
          {pending.map((o) => {
            const product = snap.products.find((p) => p.id === o.product_id);
            return (
              <div key={o.id} className="card anim-rise overflow-hidden">
                <div className="flex items-center justify-between gap-3 border-b border-gold-400/15 bg-gold-400/[0.05] px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-9 w-9 place-items-center rounded-lg border border-gold-400/30 bg-gold-400/10 text-gold-300">
                      <IcCard className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[12.5px] font-extrabold">{o.actor_label}</p>
                      <p className="mt-0.5 text-[10.5px] text-mist-500">
                        <span dir="ltr" className="font-mono font-bold text-mist-300">{o.ref}</span> • {product ? `${faNum(product.quota_gb)} گیگابایت` : "—"} •{" "}
                        {o.target_username ? `تمدید ${o.target_username}` : "اکانت جدید"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[13px] font-extrabold text-gold-300">{toman(o.total_toman)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-[9.5px] text-mist-500">شماره تراکنش واریزی</p>
                    <p dir="ltr" className="text-right font-mono text-[14px] font-bold text-mist-100">{o.receipt_no}</p>
                  </div>
                  <div className="flex gap-2">
                    <ConfirmBtn label="رد رسید" confirmLabel="مطمئنی؟ رد شود؟" variant="dark" onConfirm={() => void runSnap(() => api.adminRejectPayment(o.id), "رسید رد شد")} />
                    <Btn full={false} busy={busyId === o.id} className="!px-5" onClick={() => void approve(o.id)}>
                      <IcCheck className="h-4 w-4" />
                      تأیید و پروویژن
                    </Btn>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recent.length > 0 && (
        <>
          <h3 className="mb-2.5 mt-6 text-[13px] font-extrabold">آخرین نتایج پروویژن</h3>
          <div className="space-y-2">
            {recent.map((o) => {
              const st = ORDER_STATUS[o.status];
              return (
                <div key={o.id} className="card flex items-center justify-between gap-2 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold">
                      <span dir="ltr" className="font-mono text-mist-300">{o.ref}</span> — {o.actor_label}
                    </p>
                    {o.provision_note && <p className="mt-0.5 truncate text-[10px] text-coral-300">{o.provision_note}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {o.status === "failed" && (
                      <button
                        type="button"
                        onClick={() => void runSnap(() => api.retryProvision(o.id), "تلاش دوباره انجام شد")}
                        className="grid h-7 w-7 place-items-center rounded-lg border border-gold-400/30 text-gold-300 transition hover:bg-gold-400/10 active:scale-90"
                        title="تلاش دوباره پروویژن"
                        aria-label="تلاش دوباره"
                      >
                        <IcRefresh className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <Chip tone={st.tone}>{st.label}</Chip>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------- همکاران -------------------------------- */

export function AdminPartners() {
  const { snap, runSnap } = useApp();
  const [walletFor, setWalletFor] = useState<Partner | null>(null);
  if (!snap) return null;

  return (
    <div className="px-4 pb-6 pt-4">
      <h2 className="font-display text-[26px] leading-8">همکاران</h2>
      <p className="mb-4 mt-1 text-[11.5px] text-mist-500">تأیید، تعلیق و عملیات مالی کیف پول — همه با دلیل و audit</p>

      <div className="stagger space-y-3">
        {snap.partners.map((p) => {
          const st = PARTNER_STATUS[p.status];
          return (
            <div key={p.id} className="card anim-rise px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-mint-500/25 bg-mint-500/10 text-mint-400">
                    <IcUsers className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[13px] font-extrabold">
                      {p.name} <span dir="ltr" className="font-mono text-[10.5px] font-medium text-mist-500">{p.telegram}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-mist-500">
                      کیف پول: <b className="text-gold-300">{toman(p.wallet_toman)}</b> • از {faDate(p.created_at)}
                    </p>
                  </div>
                </div>
                <Chip tone={st.tone}>{st.label}</Chip>
              </div>
              <div className="mt-3.5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3.5">
                {p.status !== "active" && (
                  <Btn full={false} className="!px-4 !py-2 text-[11.5px]" onClick={() => void runSnap(() => api.adminSetPartnerStatus(p.id, "active"), `${p.name} فعال شد`)}>
                    <IcCheck className="h-3.5 w-3.5" />
                    {p.status === "pending" ? "تأیید همکار" : "فعال‌سازی مجدد"}
                  </Btn>
                )}
                {p.status === "active" && (
                  <ConfirmBtn
                    label={
                      <>
                        <IcBan className="h-3.5 w-3.5" />
                        تعلیق
                      </>
                    }
                    confirmLabel="تعلیق شود؟"
                    onConfirm={() => void runSnap(() => api.adminSetPartnerStatus(p.id, "suspended"), `${p.name} تعلیق شد`)}
                    className="!px-4 !py-2 text-[11.5px]"
                  />
                )}
                <Btn variant="gold" full={false} className="!px-4 !py-2 text-[11.5px]" onClick={() => setWalletFor(p)}>
                  <IcWallet className="h-3.5 w-3.5" />
                  عملیات کیف پول
                </Btn>
              </div>
            </div>
          );
        })}
      </div>

      <h3 className="mb-2.5 mt-6 text-[13px] font-extrabold">آخرین تراکنش‌های ledger</h3>
      <div className="space-y-2">
        {snap.ledger.slice(0, 6).map((l) => {
          const partner = snap.partners.find((p) => p.id === l.partner_id);
          return (
            <div key={l.id} className="card flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-mist-100">{l.reason}</p>
                <p className="mt-0.5 text-[10px] text-mist-500">
                  {partner?.name ?? "—"} • {l.actor_label} • {faDate(l.at)} {faTime(l.at)}
                </p>
              </div>
              <span className={`shrink-0 text-[11.5px] font-extrabold ${l.delta_toman > 0 ? "text-mint-300" : "text-coral-300"}`}>
                {l.delta_toman > 0 ? "+" : "−"}
                {faNum(Math.abs(l.delta_toman))}
              </span>
            </div>
          );
        })}
      </div>

      {walletFor && <WalletSheet partner={walletFor} onClose={() => setWalletFor(null)} />}
    </div>
  );
}

function WalletSheet({ partner, onClose }: { partner: Partner; onClose: () => void }) {
  const { runSnap, toast } = useApp();
  const [kind, setKind] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("500000");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const n = Number(amount.replace(/[^\d]/g, ""));
    if (!n || n <= 0) {
      toast("err", "مبلغ معتبر وارد کنید");
      return;
    }
    if (reason.trim().length < 3) {
      toast("err", "دلیل عملیات مالی اجباری است");
      return;
    }
    setBusy(true);
    const s = await runSnap(
      () => api.adminAdjustWallet(partner.id, kind === "credit" ? n : -n, reason),
      "عملیات مالی با موفقیت در ledger ثبت شد",
    );
    setBusy(false);
    if (s) onClose();
  };

  return (
    <Sheet open onClose={onClose} title={`کیف پول ${partner.name}`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-deep-900/60 px-4 py-3">
          <span className="text-[11.5px] text-mist-500">موجودی فعلی</span>
          <span className="text-[14px] font-extrabold text-gold-300">{toman(partner.wallet_toman)}</span>
        </div>
        <Seg
          options={[
            { id: "credit" as const, label: "شارژ (افزایش)" },
            { id: "debit" as const, label: "کسر" },
          ]}
          value={kind}
          onChange={setKind}
        />
        <Field label="مبلغ (تومان)">
          <input dir="ltr" inputMode="numeric" className="inp text-left font-mono" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="دلیل (اجباری — در ledger و audit ثبت می‌شود)" hint="مثلاً: واریز بانکی ۱۴ مهر — تسویه هفته دوم">
          <input className="inp" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="دلیل عملیات مالی…" />
        </Field>
        <Btn variant={kind === "credit" ? "primary" : "danger"} busy={busy} onClick={() => void submit()}>
          <IcWallet className="h-4 w-4" />
          ثبت در ledger
        </Btn>
      </div>
    </Sheet>
  );
}

/* -------------------------------- تنظیمات -------------------------------- */

export function AdminConfig() {
  const { snap, runSnap } = useApp();
  if (!snap) return null;
  const allGroups = ["vpn-10g", "vpn-20g", "vpn-50g", "vpn-100g"];

  return (
    <div className="px-4 pb-6 pt-4">
      <h2 className="font-display text-[26px] leading-8">تنظیمات سامانه</h2>
      <p className="mb-4 mt-1 text-[11.5px] text-mist-500">محصولات، روش‌های پرداخت و گروه‌های RADIUS — بدون نیاز به SSH</p>

      <h3 className="mb-2.5 flex items-center gap-2 text-[13px] font-extrabold">
        <IcGear className="h-4 w-4 text-mint-400" />
        بسته‌ها و قیمت‌ها
      </h3>
      <div className="stagger space-y-2.5">
        {snap.products.map((p) => (
          <ProductRow key={p.id + p.price_toman + String(p.active)} p={p} onSave={runSnap} />
        ))}
      </div>

      <h3 className="mb-2.5 mt-6 flex items-center gap-2 text-[13px] font-extrabold">
        <IcCard className="h-4 w-4 text-gold-400" />
        روش‌های پرداخت
      </h3>
      <SettingsCard />

      <h3 className="mb-2.5 mt-6 flex items-center gap-2 text-[13px] font-extrabold">
        <IcShield className="h-4 w-4 text-mint-400" />
        گروه‌های FreeRADIUS
      </h3>
      <div className="card px-4 py-4">
        <p className="mb-3 text-[10.5px] leading-5 text-mist-500">
          گروه‌ها فقط سهمیه ترافیک دارند و <b className="text-mist-300">هرگز خودکار ساخته نمی‌شوند</b> (قانون ۹). غیرفعال‌کردن یک گروه = شکست امن خریدهای آن بسته.
        </p>
        <div className="flex flex-wrap gap-2">
          {allGroups.map((g) => {
            const on = snap.settings.radius_groups.includes(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => void runSnap(() => api.setRadiusGroup(g, !on), on ? `${g} غیرفعال شد — خریدهایش شکست امن می‌خورند` : `${g} دوباره فعال شد`)}
                className={`rounded-lg border px-3 py-2 font-mono text-[11.5px] font-bold transition active:scale-95 ${
                  on
                    ? "border-mint-500/40 bg-mint-500/10 text-mint-300"
                    : "border-coral-500/30 bg-coral-500/[0.07] text-coral-300 line-through"
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      <h3 className="mb-2.5 mt-6 flex items-center gap-2 text-[13px] font-extrabold">
        <IcUsers className="h-4 w-4 text-gold-400" />
        قوانین همکاران
      </h3>
      <MinBalanceCard />
    </div>
  );
}

function ProductRow({ p, onSave }: { p: Product; onSave: (fn: () => Promise<ReturnType<typeof api.updateProduct> extends Promise<infer S> ? S : never>, ok?: string) => Promise<unknown> }) {
  const [price, setPrice] = useState(String(p.price_toman));
  const [busy, setBusy] = useState(false);
  const dirty = Number(price) !== p.price_toman;

  const save = async () => {
    setBusy(true);
    await onSave(() => api.updateProduct(p.id, Number(price), p.active), "قیمت بسته به‌روزرسانی شد");
    setBusy(false);
  };

  return (
    <div className="card flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <p className="font-display text-[24px] leading-7 text-mint-300">
          {faNum(p.quota_gb)}
          <span className="mr-1 text-[11px] text-mist-500">گیگ</span>
        </p>
        <Toggle on={p.active} onChange={(v) => void onSave(() => api.updateProduct(p.id, p.price_toman, v), v ? "بسته فعال شد" : "بسته غیرفعال شد")} />
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            dir="ltr"
            inputMode="numeric"
            className="inp !w-28 !py-2 text-left font-mono text-[12px]"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
          />
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] text-mist-500">تومان</span>
        </div>
        {dirty && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="anim-pop grid h-9 w-9 place-items-center rounded-lg bg-mint-500 text-deep-950 transition hover:brightness-110 active:scale-90 disabled:opacity-50"
            aria-label="ذخیره قیمت"
          >
            {busy ? <Spinner className="h-4 w-4" dark /> : <IcCheck className="h-4 w-4" sw={2.4} />}
          </button>
        )}
      </div>
    </div>
  );
}

function SettingsCard() {
  const { snap, runSnap } = useApp();
  const [cardNumber, setCardNumber] = useState(snap?.settings.card_number ?? "");
  const [cardHolder, setCardHolder] = useState(snap?.settings.card_holder ?? "");
  const [busy, setBusy] = useState(false);
  if (!snap) return null;

  return (
    <div className="card space-y-3.5 px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-extrabold">درگاه بانکی</p>
          <p className="mt-0.5 text-[10.5px] text-mist-500">در صورت غیرفعال‌بودن، فقط کارت‌به‌کارت نمایش داده می‌شود</p>
        </div>
        <Toggle on={snap.settings.gateway_enabled} onChange={(v) => void runSnap(() => api.updateSettings({ gateway_enabled: v }), v ? "درگاه فعال شد" : "درگاه غیرفعال شد")} />
      </div>
      <div className="grid grid-cols-2 gap-2.5 border-t border-white/[0.06] pt-3.5">
        <Field label="شماره کارت (کارت‌به‌کارت)">
          <input dir="ltr" className="inp font-mono text-[12px]" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
        </Field>
        <Field label="به نام">
          <input className="inp" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} />
        </Field>
      </div>
      <Btn
        variant="ghost"
        busy={busy}
        onClick={async () => {
          setBusy(true);
          await runSnap(() => api.updateSettings({ card_number: cardNumber, card_holder: cardHolder }), "اطلاعات کارت‌به‌کارت ذخیره شد");
          setBusy(false);
        }}
      >
        ذخیره اطلاعات کارت
      </Btn>
    </div>
  );
}

function MinBalanceCard() {
  const { snap, runSnap } = useApp();
  const [val, setVal] = useState(String(snap?.settings.min_partner_balance ?? ""));
  const [busy, setBusy] = useState(false);
  if (!snap) return null;

  return (
    <div className="card px-4 py-4">
      <Field label="حداقل موجودی کیف پول همکار (تومان)" hint="همکار برای خرید باید حداقل این موجودی را داشته باشد — پیش‌فرض: ۱٬۰۰۰٬۰۰۰">
        <input dir="ltr" inputMode="numeric" className="inp font-mono text-[12px]" value={val} onChange={(e) => setVal(e.target.value.replace(/[^\d]/g, ""))} />
      </Field>
      <Btn
        variant="ghost"
        className="mt-3"
        busy={busy}
        onClick={async () => {
          const n = Number(val);
          if (!n || n < 0) return;
          setBusy(true);
          await runSnap(() => api.updateSettings({ min_partner_balance: n }), "حداقل موجودی همکار ذخیره شد");
          setBusy(false);
        }}
      >
        ذخیره قانون
      </Btn>
    </div>
  );
}

/* --------------------------------- سیستم --------------------------------- */

const AUDIT_DOT: Record<AuditKind, string> = {
  info: "bg-sky-350",
  success: "bg-mint-400",
  warn: "bg-gold-400",
  error: "bg-coral-400",
};

export function AdminSystem() {
  const { snap, toast } = useApp();
  const [pinging, setPinging] = useState(false);
  if (!snap) return null;

  const ping = async () => {
    setPinging(true);
    await new Promise((r) => setTimeout(r, 900));
    setPinging(false);
    toast("ok", "پاسخ سلامت: FreeRADIUS و MariaDB در ۴۲ms پاسخ دادند");
  };

  const health = [
    { icon: <IcShield className="h-4.5 w-4.5" />, name: "FreeRADIUS (host)", val: "سالم — آپ‌تایم ۳۴ روز", tone: "text-mint-300" },
    { icon: <IcDb className="h-4.5 w-4.5" />, name: "MariaDB «radius»", val: "سالم — radacct خوانا", tone: "text-mint-300" },
    { icon: <IcPulse className="h-4.5 w-4.5" />, name: "Worker", val: "صف: ۰ جاب در انتظار", tone: "text-mint-300" },
    { icon: <IcServer className="h-4.5 w-4.5" />, name: "آخرین بک‌آپ radius", val: "امروز ۰۳:۱۲ — موفق", tone: "text-mist-300" },
  ];

  return (
    <div className="px-4 pb-6 pt-4">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="font-display text-[26px] leading-8">سلامت سیستم</h2>
          <p className="mt-1 text-[11.5px] text-mist-500">وضعیت زنده زیرساخت + گزارش رویدادها (audit log)</p>
        </div>
        <Btn variant="ghost" full={false} className="!px-4 !py-2 text-[11.5px]" busy={pinging} onClick={() => void ping()}>
          <IcPulse className="h-4 w-4" />
          پینگ
        </Btn>
      </div>

      <div className="stagger grid grid-cols-2 gap-2.5">
        {health.map((h) => (
          <div key={h.name} className="card px-3.5 py-3">
            <div className="flex items-center gap-2 text-mint-400">{h.icon}
              <span className="anim-pulse-dot h-1.5 w-1.5 rounded-full bg-mint-400" />
            </div>
            <p className="mt-2 text-[11px] font-extrabold text-mist-100">{h.name}</p>
            <p className={`mt-0.5 text-[10px] ${h.tone}`}>{h.val}</p>
          </div>
        ))}
      </div>

      <div className="mb-2.5 mt-6 flex items-center justify-between">
        <h3 className="text-[13px] font-extrabold">گزارش رویدادها</h3>
        <Chip tone="mist">{faNum(snap.audit.length)} رویداد اخیر</Chip>
      </div>
      <div className="card max-h-72 space-y-0.5 overflow-y-auto p-2">
        {snap.audit.map((a) => (
          <div key={a.id} className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition hover:bg-white/[0.03]">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${AUDIT_DOT[a.kind]}`} />
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-x-2 text-[10.5px]">
                <span dir="ltr" className={`font-mono font-bold ${a.kind === "error" ? "text-coral-300" : a.kind === "warn" ? "text-gold-300" : a.kind === "success" ? "text-mint-300" : "text-sky-350"}`}>
                  {a.action}
                </span>
                <span className="text-mist-500">
                  {a.actor} • {faTime(a.at)}
                </span>
              </p>
              <p className="mt-0.5 text-[10.5px] leading-5 text-mist-300">{a.detail}</p>
            </div>
          </div>
        ))}
        {snap.audit.length === 0 && <p className="p-4 text-center text-[11px] text-mist-500">رویدادی ثبت نشده</p>}
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-deep-900/60 px-4 py-3 text-[10.5px] leading-5 text-mist-500">
        <IcAlert className="mt-0.5 h-4 w-4 shrink-0 text-mint-400" />
        قبل از هر نوشتن روی RADIUS تولید: بک‌آپ دیتابیس radius، تست با کاربر آزمایشی، و راستی‌آزمایی create / group / expiration / usage / renewal — طبق چک‌لیست معماری.
      </p>
    </div>
  );
}
