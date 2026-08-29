import { useEffect, useRef, useState } from "react";
import { useApp } from "../lib/store";
import * as api from "../lib/backend";
import type { Product, RadiusAccount, Snap } from "../lib/types";
import { daysLeftLabel, faDate, faNum, gbLabel, gbOf, toman } from "../lib/format";
import { Btn, Chip, Field, LiveDot, Sheet, Spinner, UsageBar } from "../components/ui";
import { IcAlert, IcCard, IcCheck, IcDownload, IcGlobe, IcKey, IcRefresh, IcServer, IcZap } from "../components/icons";
import { GB } from "../lib/format";

const FEATURES = ["اتصال همزمان ۲ دستگاه", "OpenVPN + WireGuard"];

export default function ShopView() {
  const { snap, renewFor, setRenewFor, setTab, toast } = useApp();
  const [picked, setPicked] = useState<Product | null>(null);
  if (!snap) return null;
  const myAccount = snap.accounts.find((a) => a.owner === "customer");
  const renewTarget = renewFor
    ? snap.accounts.find((a) => a.username === renewFor) ?? myAccount
    : myAccount;

  return (
    <div className="px-4 pb-6 pt-4">
      {/* نوار وضعیت سرور */}
      <div className="anim-rise card mb-4 flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-mint-500/25 bg-mint-500/10 text-mint-400">
            <IcServer className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[13px] font-extrabold">سرور آلمان-۱</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-mist-500">
              <LiveDot className="h-1.5 w-1.5" />
              آنلاین — پینگ <span className="font-bold text-mint-300">۴۸ms</span>
            </p>
          </div>
        </div>
        <Chip tone="mint">
          <IcGlobe className="h-3.5 w-3.5" />
          DE-1
        </Chip>
      </div>

      {renewTarget && (
        <div className="anim-rise mb-4 flex items-center justify-between gap-2 rounded-xl border border-gold-400/25 bg-gold-400/8 px-4 py-2.5">
          <p className="text-[11.5px] font-semibold leading-5 text-gold-300">
            در حال تمدید اکانت <span dir="ltr" className="font-mono font-bold">{renewTarget.username}</span> — بسته را انتخاب کنید
          </p>
          <button
            type="button"
            onClick={() => setRenewFor(null)}
            className="shrink-0 text-[10.5px] font-bold text-mist-500 underline-offset-2 hover:text-mist-300 hover:underline"
          >
            لغو
          </button>
        </div>
      )}

      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="font-display text-[26px] leading-8 text-mist-100">بسته‌های ترافیک</h2>
          <p className="mt-1 text-[11.5px] text-mist-500">حجم خالص — انقضای ۳۰ روزه — بدون ریست مصرف هنگام تمدید</p>
        </div>
        <IcZap className="h-6 w-6 text-gold-400" />
      </div>

      <div className="stagger grid grid-cols-2 gap-3">
        {snap.products.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={!p.active}
            onClick={() => setPicked(p)}
            className={`card group relative overflow-hidden p-4 text-right transition-all duration-200 hover:-translate-y-1 hover:border-mint-500/40 hover:shadow-[0_14px_36px_-14px_rgba(35,201,147,0.35)] active:scale-[0.98] disabled:opacity-40 ${
              p.popular ? "border-gold-400/35" : ""
            }`}
          >
            <div className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full bg-mint-500/8 blur-2xl transition group-hover:bg-mint-500/15" />
            {p.popular && (
              <span className="absolute left-3 top-3 rounded-full border border-gold-400/40 bg-gold-400/12 px-2 py-0.5 text-[9.5px] font-extrabold text-gold-300">
                پرفروش
              </span>
            )}
            <p className="font-display text-[42px] leading-10 text-mint-300">
              {faNum(p.quota_gb)}
              <span className="mr-1 text-base text-mist-500">گیگ</span>
            </p>
            <p className="mt-1 text-[11px] font-semibold text-mist-500">{faNum(p.duration_days)} روز اعتبار</p>
            <ul className="mt-3 space-y-1">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-[10.5px] text-mist-500">
                  <IcCheck className="h-3 w-3 text-mint-500" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
              <span className="text-[13px] font-extrabold text-gold-300">{toman(p.price_toman)}</span>
              <span className="rounded-lg bg-mint-500/12 px-2 py-1 text-[10.5px] font-bold text-mint-300 transition group-hover:bg-mint-500/25">
                خرید
              </span>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-5 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-deep-900/60 px-4 py-3 text-[10.5px] leading-5 text-mist-500">
        <IcAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
        هنگام تمدید، حجم باقی‌مانده‌ی شما نمی‌سوزد؛ حجم جدید = حجم فعلی + بسته‌ی خریداری‌شده و مصرف گذشته هرگز ریست نمی‌شود.
      </p>

      {picked && (
        <CheckoutSheet
          product={picked}
          account={renewTarget ?? null}
          gatewayEnabled={snap.settings.gateway_enabled}
          onClose={() => {
            setPicked(null);
            setRenewFor(null);
          }}
          onGoAccounts={() => {
            setPicked(null);
            setRenewFor(null);
            setTab("accounts");
            toast("info", "اکانت شما در تب «اکانت‌ها» آماده است");
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------ Checkout sheet ------------------------------ */

type Step = "config" | "card" | "processing" | "success" | "failed" | "submitted";

function CheckoutSheet({
  product,
  account,
  gatewayEnabled,
  onClose,
  onGoAccounts,
}: {
  product: Product;
  account: RadiusAccount | null;
  gatewayEnabled: boolean;
  onClose: () => void;
  onGoAccounts: () => void;
}) {
  const { snap, run, runSnap, toast } = useApp();
  const [step, setStep] = useState<Step>("config");
  const [mode, setMode] = useState<"renew" | "new">(account ? "renew" : "new");
  const [method, setMethod] = useState<"gateway" | "card">(gatewayEnabled ? "gateway" : "card");
  const [receipt, setReceipt] = useState("");
  const [stage, setStage] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [result, setResult] = useState<{ order: Snap["orders"][number]; account?: RadiusAccount } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const newQuotaGb = account ? Math.round(account.quota_bytes / GB) + product.quota_gb : product.quota_gb;
  const futureExp = new Date(Date.now() + product.duration_days * 86_400_000).toISOString();

  const startGateway = async () => {
    const created = await run(
      () => api.createCustomerOrder(product.id, "gateway", mode === "renew" && account ? account.username : null),
    );
    if (!created) return;
    setOrderId(created.orderId);
    setStep("processing");
    setStage(0);
    [400, 1000, 1600].forEach((ms, i) =>
      timers.current.push(window.setTimeout(() => setStage(i + 1), ms)),
    );
    let s: Awaited<ReturnType<typeof api.gatewayCallback>>;
    try {
      s = await api.gatewayCallback(created.orderId);
    } catch (e) {
      toast("err", e instanceof Error ? e.message : "خطا در کال‌بک درگاه");
      setStep("config");
      return;
    }
    const order = s.orders.find((o) => o.id === created.orderId);
    if (!order) return;
    timers.current.push(
      window.setTimeout(() => {
        if (order.status === "done") {
          const acc = s.accounts.find((a) => a.username === order.result_usernames[0]);
          setResult({ order, account: acc });
          setStep("success");
        } else {
          setNote(order.provision_note);
          setStep("failed");
        }
      }, 600),
    );
  };

  const submitCard = async () => {
    if (receipt.trim().length < 4) {
      toast("err", "شماره تراکنش را کامل وارد کنید");
      return;
    }
    const created = await run(() =>
      api.createCustomerOrder(product.id, "card", mode === "renew" && account ? account.username : null),
    );
    if (!created) return;
    const s = await runSnap(() => api.submitReceipt(created.orderId, receipt.trim()));
    if (!s) return;
    setStep("submitted");
  };

  const stages = [
    "اتصال به درگاه پرداخت",
    "دریافت کال‌بک و بررسی idempotency",
    "تأیید پرداخت و ثبت در ledger",
    "پروویژن در FreeRADIUS (radcheck + radgroupcheck)",
  ];

  return (
    <Sheet
      open
      locked={step === "processing"}
      onClose={onClose}
      title={
        step === "success"
          ? "اکانت فعال شد"
          : step === "failed"
            ? "شکست امن پروویژن"
            : step === "submitted"
              ? "رسید ثبت شد"
              : `بسته ${gbLabel(product.quota_gb)}`
      }
    >
      {step === "config" && (
        <div className="anim-fade space-y-4">
          <div className="card flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-display text-2xl text-mint-300">{gbLabel(product.quota_gb)}</p>
              <p className="mt-0.5 text-[11px] text-mist-500">{faNum(product.duration_days)} روز • سرور آلمان-۱</p>
            </div>
            <p className="text-[15px] font-extrabold text-gold-300">{toman(product.price_toman)}</p>
          </div>

          {account && (
            <div>
              <span className="lbl">نوع خرید</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("renew")}
                  className={`rounded-xl border px-3 py-2.5 text-right transition ${
                    mode === "renew"
                      ? "border-mint-500/50 bg-mint-500/10"
                      : "border-white/10 bg-deep-900/60 hover:border-white/20"
                  }`}
                >
                  <p className="flex items-center gap-1.5 text-[12px] font-extrabold">
                    <IcRefresh className="h-3.5 w-3.5 text-mint-400" />
                    تمدید اکانت فعلی
                  </p>
                  <p dir="ltr" className="mt-1 text-left font-mono text-[10px] text-mist-500">{account.username}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("new")}
                  className={`rounded-xl border px-3 py-2.5 text-right transition ${
                    mode === "new"
                      ? "border-mint-500/50 bg-mint-500/10"
                      : "border-white/10 bg-deep-900/60 hover:border-white/20"
                  }`}
                >
                  <p className="flex items-center gap-1.5 text-[12px] font-extrabold">
                    <IcKey className="h-3.5 w-3.5 text-mint-400" />
                    اکانت جدید
                  </p>
                  <p className="mt-1 text-[10px] text-mist-500">ساخت کاربر تازه در RADIUS</p>
                </button>
              </div>
            </div>
          )}

          {mode === "renew" && account && (
            <div className="anim-fade rounded-xl border border-mint-500/25 bg-mint-500/[0.07] px-4 py-3">
              <p className="text-[11.5px] font-bold text-mint-300">پیش‌نمایش تمدید (قانون ۵ و ۷)</p>
              <div className="mt-2 space-y-1.5 text-[11px] leading-5 text-mist-300">
                <p>
                  حجم: <b dir="ltr" className="text-mist-100">{faNum(Math.round(account.quota_bytes / GB))} + {faNum(product.quota_gb)} = {faNum(newQuotaGb)}</b> گیگابایت
                </p>
                <p>
                  مصرف فعلی: <b className="text-mist-100">{gbOf(account.used_bytes)} گیگ</b> — بدون تغییر (reset=never)
                </p>
                <p>
                  مانده‌ی جدید: <b className="text-mint-300">{gbOf(newQuotaGb * GB - account.used_bytes)} گیگابایت</b>
                </p>
                <p>
                  انقضای جدید: <b className="text-mist-100">{faDate(futureExp)}</b> ({daysLeftLabel(futureExp)})
                </p>
              </div>
            </div>
          )}

          <div>
            <span className="lbl">روش پرداخت</span>
            <div className="space-y-2">
              {gatewayEnabled && (
                <button
                  type="button"
                  onClick={() => setMethod("gateway")}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition ${
                    method === "gateway"
                      ? "border-mint-500/50 bg-mint-500/10"
                      : "border-white/10 bg-deep-900/60 hover:border-white/20"
                  }`}
                >
                  <span className="flex items-center gap-2.5 text-[12.5px] font-extrabold">
                    <IcGlobe className="h-4.5 w-4.5 text-mint-400" />
                    درگاه بانکی (شبیه‌سازی)
                  </span>
                  <Chip tone="mint">فوری</Chip>
                </button>
              )}
              <button
                type="button"
                onClick={() => setMethod("card")}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 transition ${
                  method === "card"
                    ? "border-mint-500/50 bg-mint-500/10"
                    : "border-white/10 bg-deep-900/60 hover:border-white/20"
                }`}
              >
                <span className="flex items-center gap-2.5 text-[12.5px] font-extrabold">
                  <IcCard className="h-4.5 w-4.5 text-gold-400" />
                  کارت‌به‌کارت
                </span>
                <Chip tone="gold">تأیید دستی</Chip>
              </button>
            </div>
          </div>

          <Btn
            variant={method === "gateway" ? "primary" : "gold"}
            onClick={() => (method === "gateway" ? void startGateway() : setStep("card"))}
          >
            {method === "gateway" ? "پرداخت و دریافت کال‌بک" : "مشاهده شماره کارت"}
            <span className="rounded-md bg-deep-950/15 px-2 py-0.5 text-[11px]">{toman(product.price_toman)}</span>
          </Btn>
        </div>
      )}

      {step === "card" && snap && (
        <div className="anim-fade space-y-4">
          <div className="rounded-xl border border-gold-400/25 bg-gradient-to-b from-gold-400/12 to-transparent px-4 py-4 text-center">
            <p className="text-[11px] text-mist-500">مبلغ قابل واریز</p>
            <p className="mt-1 font-display text-3xl text-gold-300">{toman(product.price_toman)}</p>
            <div className="mt-4 rounded-xl bg-deep-950/70 px-4 py-3">
              <p className="text-[10.5px] text-mist-500">{snap.settings.card_holder}</p>
              <p dir="ltr" className="mt-1 font-mono text-lg font-bold tracking-widest text-mist-100">
                {snap.settings.card_number}
              </p>
            </div>
            <p className="mt-2 text-[10.5px] text-mist-500">پس از واریز، شماره تراکنش را ثبت کنید تا مدیر تأیید کند</p>
          </div>
          <Field label="شماره تراکنش (رسید واریز)">
            <input
              dir="ltr"
              className="inp text-left font-mono"
              placeholder="مثلاً ۸۸۴۲۱۹۳۷"
              value={receipt}
              onChange={(e) => setReceipt(e.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <Btn variant="dark" full={false} className="flex-1" onClick={() => setStep("config")}>
              بازگشت
            </Btn>
            <Btn variant="gold" full={false} className="flex-[2]" onClick={() => void submitCard()}>
              ثبت رسید و ارسال برای تأیید
            </Btn>
          </div>
        </div>
      )}

      {step === "processing" && (
        <div className="anim-fade space-y-3 py-2">
          {stages.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300 ${
                i < stage
                  ? "border-mint-500/30 bg-mint-500/[0.07]"
                  : i === stage
                    ? "border-sky-350/30 bg-sky-350/[0.06]"
                    : "border-white/[0.06] bg-deep-900/50 opacity-50"
              }`}
            >
              {i < stage ? (
                <IcCheck className="h-4.5 w-4.5 shrink-0 text-mint-400" />
              ) : i === stage ? (
                <Spinner className="h-4.5 w-4.5 shrink-0" />
              ) : (
                <span className="h-4.5 w-4.5 shrink-0 rounded-full border border-white/15" />
              )}
              <p className="text-[11.5px] font-semibold text-mist-300">{s}</p>
            </div>
          ))}
          <p dir="ltr" className="pt-1 text-center font-mono text-[10px] text-mist-500">
            idempotency_key: {orderId ? orderId.slice(-10) : "…"}
          </p>
        </div>
      )}

      {step === "success" && result && (
        <div className="anim-fade space-y-4">
          <div className="anim-pop mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-mint-400 bg-mint-500/15 text-mint-400">
            <IcCheck className="h-8 w-8" sw={2.4} />
          </div>
          <p className="text-center text-[12px] text-mist-500">
            سفارش <span dir="ltr" className="font-mono font-bold text-mist-300">{result.order.ref}</span> تکمیل شد
          </p>

          {result.account && (
            <div className="card space-y-3 px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10.5px] text-mist-500">نام کاربری</p>
                  <p dir="ltr" className="font-mono text-[15px] font-bold text-mist-100">{result.account.username}</p>
                </div>
                <CopyInline text={result.account.username} />
              </div>
              <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                <div>
                  <p className="text-[10.5px] text-mist-500">رمز عبور</p>
                  <p dir="ltr" className="font-mono text-[15px] font-bold text-mint-300">{result.account.password}</p>
                </div>
                <CopyInline text={result.account.password} />
              </div>
              <div className="border-t border-white/[0.06] pt-3">
                <div className="mb-1.5 flex items-center justify-between text-[11px] text-mist-500">
                  <span>مصرف</span>
                  <span>
                    <b className="text-mist-100">{gbOf(result.account.used_bytes)}</b> از{" "}
                    <b className="text-mist-100">{gbOf(result.account.quota_bytes)}</b> گیگ
                  </span>
                </div>
                <UsageBar
                  used={result.account.used_bytes}
                  quota={result.account.quota_bytes}
                  capped={result.account.capped}
                />
                <p className="mt-2 text-[10.5px] text-mist-500">
                  انقضا: <b className="text-mist-300">{faDate(result.account.expiration)}</b> ({daysLeftLabel(result.account.expiration)}) • گروه <span dir="ltr" className="font-mono">{result.account.group_name}</span>
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Btn variant="ghost" full={false} className="flex-1" onClick={onGoAccounts}>
              دیدن اکانت‌ها
            </Btn>
            <Btn
              full={false}
              className="flex-1"
              onClick={() => {
                if (!result.account) return;
                const blob = new Blob([api.buildOvpn(result.account)], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${result.account.username}.ovpn`;
                a.click();
                URL.revokeObjectURL(url);
                toast("ok", "کانفیگ OVPN دانلود شد");
              }}
            >
              <IcDownload className="h-4 w-4" />
              دانلود OVPN
            </Btn>
          </div>
        </div>
      )}

      {step === "failed" && (
        <div className="anim-fade space-y-4">
          <div className="anim-pop mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-coral-500 bg-coral-500/12 text-coral-400">
            <IcAlert className="h-8 w-8" />
          </div>
          <p className="text-center text-[13px] font-bold text-coral-300">پروویژن متوقف شد — هیچ اکانتی ساخته نشد</p>
          <div className="rounded-xl border border-coral-500/25 bg-coral-500/[0.07] px-4 py-3 text-[11.5px] leading-6 text-mist-300">
            {note}
          </div>
          <p className="text-center text-[10.5px] leading-5 text-mist-500">
            پرداخت شما محفوظ است و با رفع مشکل از تب «سفارش‌ها» قابل تلاش دوباره است — بدون هیچ پرداخت مجدد.
          </p>
          <Btn variant="dark" onClick={onClose}>باشه، متوجه شدم</Btn>
        </div>
      )}

      {step === "submitted" && (
        <div className="anim-fade space-y-4 py-2 text-center">
          <div className="anim-pop mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-gold-400 bg-gold-400/12 text-gold-300">
            <IcClockIcon />
          </div>
          <p className="text-[13px] font-bold text-mist-100">رسید شما ثبت شد</p>
          <p className="mx-auto max-w-[260px] text-[11.5px] leading-6 text-mist-500">
            سفارش در صف «در انتظار تأیید مدیر» قرار گرفت. معمولاً کمتر از ۱۰ دقیقه تأیید می‌شود و اکانت بلافاصله ساخته خواهد شد.
          </p>
          <Btn variant="gold" onClick={onClose}>پیگیری از تب سفارش‌ها</Btn>
        </div>
      )}
    </Sheet>
  );
}

function CopyInline({ text }: { text: string }) {
  const { toast } = useApp();
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          /* ignore */
        }
        setOk(true);
        toast("ok", "کپی شد");
        window.setTimeout(() => setOk(false), 1400);
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 ${
        ok ? "border-mint-500/40 bg-mint-500/15 text-mint-300" : "border-white/12 bg-white/[0.05] text-mist-300 hover:text-mint-300"
      }`}
    >
      {ok ? <IcCheck className="h-3.5 w-3.5" /> : <IcCopyIcon />}
      {ok ? "کپی شد" : "کپی"}
    </button>
  );
}

function IcClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-8 w-8">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function IcCopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
      <path d="M5.5 14.5h-.7A1.8 1.8 0 0 1 3 12.7V4.8A1.8 1.8 0 0 1 4.8 3h7.9a1.8 1.8 0 0 1 1.8 1.8v.7" />
    </svg>
  );
}
