import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Account, PayMethod, Product, PurchaseResult } from "../lib/types";
import { haptic, useStore } from "../lib/store";
import { fa, faGb, gbOf, maskCard, money, remainFa, serverLabel } from "../lib/format";
import { Chip, IcAlert, IcBolt, IcCard, IcCheck, IcClock, IcCopy, IcDownload, IcEye, IcEyeOff, IcReceipt, IcServer, IcWallet, IcX, Modal, CopyBtn } from "./ui";

type Phase = "method" | "card" | "processing" | "result";

const STEP_LABELS = ["ثبت و تأیید پرداخت", "بررسی گروه RADIUS", "ساخت / تمدید اکانت", "فعال‌سازی روی سرور"];

function ovpnContent(acc: Account, host: string, serverName: string): string {
  return [
    `# VAR VPN — ${serverName}`,
    `# تولیدشده برای کاربر ${acc.radiusUsername} — ${new Date().toLocaleString("fa-IR")}`,
    `# کلید خصوصی سرور فقط روی خود سرور نگهداری می‌شود و هرگز اینجا ارسال نمی‌شود.`,
    `client`,
    `dev tun`,
    `proto udp`,
    `remote ${host} 1194`,
    `resolv-retry infinite`,
    `nobind`,
    `persist-key`,
    `persist-tun`,
    `remote-cert-tls server`,
    `cipher AES-256-GCM`,
    `auth SHA256`,
    `verb 3`,
    `auth-user-pass`,
    `# username: ${acc.radiusUsername}`,
    ``,
  ].join("\n");
}

function downloadOvpn(acc: Account, host: string, serverName: string) {
  const blob = new Blob([ovpnContent(acc, host, serverName)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `var-vpn-${acc.radiusUsername}.ovpn`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  haptic("ok");
}

export default function PurchaseFlow({
  product,
  onClose,
  initialQty = 1,
  allowQty = false,
  forCustomer,
}: {
  product: Product;
  onClose: () => void;
  initialQty?: number;
  allowQty?: boolean;
  forCustomer?: string;
}) {
  const { state, me, api, toast } = useStore();
  const onlineServers = state.servers.filter((s) => s.status === "online");
  const [serverId, setServerId] = useState<string>(onlineServers[0]?.id ?? "");
  const [phase, setPhase] = useState<Phase>("method");
  const [qty, setQty] = useState(initialQty);
  const [method, setMethod] = useState<PayMethod>(me.role === "partner" ? "wallet" : state.gateways.some((g) => g.enabled) ? "gateway" : "card");
  const [receipt, setReceipt] = useState<string>("");
  const [stepIdx, setStepIdx] = useState(0);
  const [failedStep, setFailedStep] = useState<number | null>(null);
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  const total = product.price * qty;
  const wallet = state.wallets.find((w) => w.userId === me.id);
  const server = state.servers.find((s) => s.id === serverId) ?? onlineServers[0] ?? state.servers[0];

  // درگاه‌ها و کارت‌های فعال — مدیریت‌شده توسط ادمین
  const enabledGateways = state.gateways.filter((g) => g.enabled);
  const enabledCards = state.cards.filter((c) => c.enabled);
  const [gatewayId, setGatewayId] = useState("");
  const [cardId, setCardId] = useState("");
  const selGateway = enabledGateways.find((g) => g.id === gatewayId) ?? enabledGateways[0];
  const selCard = enabledCards.find((c) => c.id === cardId) ?? enabledCards[0];

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const methods: { id: PayMethod; label: string; sub: string; icon: React.ReactNode; disabled?: boolean; disabledReason?: string }[] = [
    {
      id: "gateway",
      label: "درگاه بانکی",
      sub: "پرداخت آنلاین و فعال‌سازی آنی",
      icon: <IcBolt className="w-5 h-5" />,
      disabled: enabledGateways.length === 0,
      disabledReason: enabledGateways.length === 0 ? "درگاه فعالی تعریف نشده" : undefined,
    },
    {
      id: "card",
      label: "کارت به کارت",
      sub: "ارسال فیش — تأیید توسط مدیر",
      icon: <IcCard className="w-5 h-5" />,
      disabled: enabledCards.length === 0,
      disabledReason: enabledCards.length === 0 ? "کارت فعالی تعریف نشده" : undefined,
    },
    {
      id: "wallet",
      label: "کیف پول همکار",
      sub: wallet ? `موجودی: ${money(wallet.balance)}` : "مخصوص همکاران تأییدشده",
      icon: <IcWallet className="w-5 h-5" />,
      disabled: me.role !== "partner",
      disabledReason: me.role !== "partner" ? "مخصوص همکاران" : undefined,
    },
  ];

  const run = async (m: PayMethod, receiptName?: string) => {
    setPhase("processing");
    setStepIdx(0);
    setFailedStep(null);
    haptic("tap");

    // انیمیشن گام‌ها همزمان با اجرای واقعی API
    timers.current.push(window.setTimeout(() => setStepIdx(1), m === "card" ? 500 : 900));
    timers.current.push(window.setTimeout(() => setStepIdx(2), m === "card" ? 1000 : 1700));
    timers.current.push(window.setTimeout(() => setStepIdx(3), m === "card" ? 1400 : 2500));

    const res = await api.purchase({ productId: product.id, method: m, qty, forCustomer, receiptName, serverId: server?.id });

    // صبر تا پایان انیمیشن گام‌ها
    await new Promise((r) => timers.current.push(window.setTimeout(r, m === "card" ? 1600 : 2900)));

    if (!res.ok && res.failReason) {
      setFailedStep(1); // شکست در بررسی گروه RADIUS
    }
    setResult(res);
    setPhase("result");
    if (res.ok && res.status === "active") {
      haptic("ok");
      toast("اکانت شما فعال شد", "ok");
    } else if (res.ok && res.status === "awaiting_payment") {
      toast("فیش ثبت شد — در انتظار تأیید مدیر", "info");
    } else {
      haptic("err");
    }
  };

  const canWallet = me.role === "partner" && (wallet?.balance ?? 0) >= total;

  return (
    <Modal open onClose={phase === "processing" ? () => undefined : onClose} tall>
      <div className="px-5 pb-7">
        {/* ---------- header ---------- */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[0.7rem] text-mist-500 font-medium">{forCustomer ? `فروش همکار — مشتری: ${forCustomer}` : "خرید / تمدید اکانت"}</p>
            <h3 className="font-display text-2xl text-mist-100 mt-0.5">
              اشتراک {product.name} <span className="text-mist-500 text-base">/ {fa(product.durationDays)} روزه</span>
            </h3>
          </div>
          {phase !== "processing" && (
            <button className="btn btn-ghost w-9 h-9 shrink-0" onClick={onClose} aria-label="بستن">
              <IcX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ---------- phase: method ---------- */}
        {phase === "method" && (
          <div className="anim-fade-up">
            {allowQty && (
              <div className="card px-4 py-3.5 mb-4 flex items-center justify-between">
                <span className="text-sm text-mist-300">تعداد اکانت</span>
                <QtyControl qty={qty} setQty={setQty} />
              </div>
            )}

            <p className="text-xs font-bold text-mist-400 mb-2">روش پرداخت</p>
            <div className="space-y-2.5">
              {methods.map((m) => {
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={m.disabled}
                    onClick={() => {
                      setMethod(m.id);
                      haptic("tap");
                    }}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border text-right transition-all duration-200 ${
                      active
                        ? "border-gold-400/70 bg-gold-500/8 shadow-[0_0_0_3px_rgba(246,189,90,0.1)]"
                        : "border-mint-400/10 bg-deep-800/70 hover:border-mint-400/30"
                    } ${m.disabled ? "opacity-45 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-gold-500/15 text-gold-300" : "bg-deep-700 text-mist-400"}`}>
                      {m.icon}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-bold text-mist-100">{m.label}</span>
                      <span className="block text-[0.7rem] text-mist-500 mt-0.5">{m.disabledReason ?? m.sub}</span>
                    </span>
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${active ? "border-gold-400" : "border-deep-500"}`}>
                      {active && <span className="w-2.5 h-2.5 rounded-full bg-gold-400" />}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* انتخاب درگاه — اگر ادمین چند درگاه فعال کرده باشد */}
            {method === "gateway" && enabledGateways.length > 1 && (
              <div className="anim-fade-up mt-4">
                <p className="text-xs font-bold text-mist-400 mb-2">انتخاب درگاه</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {enabledGateways.map((g) => {
                    const active = selGateway?.id === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setGatewayId(g.id);
                          haptic("tap");
                        }}
                        className={`shrink-0 px-3.5 py-2.5 rounded-lg border text-sm font-bold transition-all cursor-pointer ${
                          active ? "border-mint-400/60 bg-mint-500/12 text-mint-300" : "border-mint-400/10 bg-deep-800/70 text-mist-400 hover:border-mint-400/30"
                        }`}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* انتخاب کارت مقصد — اگر ادمین چند کارت فعال کرده باشد */}
            {method === "card" && enabledCards.length > 1 && (
              <div className="anim-fade-up mt-4">
                <p className="text-xs font-bold text-mist-400 mb-2">واریز به کارت</p>
                <div className="space-y-2">
                  {enabledCards.map((c) => {
                    const active = selCard?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCardId(c.id);
                          haptic("tap");
                        }}
                        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-right transition-all cursor-pointer ${
                          active ? "border-gold-400/60 bg-gold-500/10" : "border-mint-400/10 bg-deep-800/70 hover:border-mint-400/30"
                        }`}
                      >
                        <span className={`text-[0.72rem] ${active ? "text-gold-300" : "text-mist-400"}`}>{c.holder || "—"}</span>
                        <code dir="ltr" className={`text-[0.72rem] tabular ${active ? "text-mist-100" : "text-mist-500"}`}>{c.number}</code>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* انتخاب سرور — فقط اگر ادمین بیش از یک سرور آنلاین داشته باشد */}
            {onlineServers.length > 1 && (
              <div className="anim-fade-up mt-4">
                <p className="text-xs font-bold text-mist-400 mb-2 flex items-center gap-1.5">
                  <IcServer className="w-4 h-4 text-sky-350" />
                  سرور مقصد
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {onlineServers.map((s) => {
                    const active = server?.id === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setServerId(s.id);
                          haptic("tap");
                        }}
                        className={`px-3.5 py-2.5 rounded-lg border text-sm font-bold transition-all cursor-pointer ${
                          active ? "border-sky-350/60 bg-sky-350/12 text-sky-350" : "border-mint-400/10 bg-deep-800/70 text-mist-400 hover:border-mint-400/30"
                        }`}
                      >
                        {serverLabel(s.code)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between card px-4 py-3.5">
              <span className="text-sm text-mist-300">مبلغ قابل پرداخت</span>
              <span className="font-display text-xl text-gold-300 tabular">{money(total)}</span>
            </div>

            <button
              className="btn btn-gold w-full py-3.5 mt-4 text-base"
              disabled={method === "wallet" && !canWallet}
              onClick={() => {
                if (method === "card") setPhase("card");
                else run(method);
              }}
            >
              {method === "gateway" ? "پرداخت در درگاه" : method === "card" ? "مرحله بعد — ارسال فیش" : "پرداخت از کیف پول"}
            </button>
            {method === "wallet" && !canWallet && me.role === "partner" && (
              <p className="text-[0.7rem] text-coral-300 text-center mt-2">موجودی کیف پول کمتر از مبلغ سفارش است</p>
            )}
          </div>
        )}

        {/* ---------- phase: card to card ---------- */}
        {phase === "card" && (
          <div className="anim-fade-up">
            <div className="rounded-xl border border-dashed border-gold-500/40 bg-gold-500/5 overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between bg-gold-500/8">
                <span className="text-xs font-bold text-gold-300">فیش واریز — کارت به کارت</span>
                <Chip tone="gold">تأیید توسط مدیر</Chip>
              </div>
              <div className="px-4 py-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-mist-500">شماره کارت</span>
                  <span className="flex items-center gap-2" dir="ltr">
                    <code className="text-sm font-bold text-mist-100 tracking-wider tabular">{selCard?.number ?? "—"}</code>
                    {selCard && <CopyBtn text={selCard.number.replace(/\s/g, "")} />}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-mist-500">به نام</span>
                  <span className="text-sm font-bold text-mist-200">{selCard?.holder ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-mist-500">مبلغ دقیق</span>
                  <span className="font-display text-lg text-gold-300 tabular">{money(total)}</span>
                </div>
              </div>
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setReceipt(e.target.files?.[0]?.name ?? "")} />
            <button type="button" onClick={() => fileRef.current?.click()} className="card card-hover w-full px-4 py-4 mt-4 flex items-center gap-3 text-right cursor-pointer">
              <span className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${receipt ? "bg-mint-500/15 text-mint-300" : "bg-deep-700 text-mist-400"}`}>
                {receipt ? <IcCheck className="w-5 h-5" /> : <IcReceipt className="w-5 h-5" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-mist-100">{receipt || "انتخاب تصویر فیش واریز"}</span>
                <span className="block text-[0.7rem] text-mist-500 mt-0.5">{receipt ? "فیش آماده ارسال است" : "JPG یا PNG — حداکثر ۵ مگابایت"}</span>
              </span>
            </button>

            <button className="btn btn-gold w-full py-3.5 mt-4" disabled={!receipt} onClick={() => run("card", receipt)}>
              ارسال فیش برای تأیید
            </button>
            <button className="btn btn-ghost w-full py-2.5 mt-2 text-sm" onClick={() => setPhase("method")}>
              بازگشت به روش پرداخت
            </button>
            <p className="text-[0.68rem] text-mist-500 text-center mt-3 leading-5">
              پس از تأیید مدیر، اکانت به‌صورت خودکار ساخته می‌شود. اگر فیش رد شود، سفارش لغو و هیچ مبلغی کسر نمی‌شود.
            </p>
          </div>
        )}

        {/* ---------- phase: processing ---------- */}
        {phase === "processing" && (
          <div className="anim-fade-up py-2">
            <div className="card px-5 py-6">
              <p className="text-sm font-bold text-mist-200 mb-5">
                {method === "gateway" ? "در حال انجام پرداخت و ساخت اکانت…" : method === "wallet" ? "کسر از کیف پول و ساخت اکانت…" : "در حال ثبت فیش…"}
              </p>
              <div className="space-y-4">
                {STEP_LABELS.map((label, i) => {
                  const done = stepIdx > i;
                  const active = stepIdx === i;
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 ${
                          done ? "bg-mint-500/20 border-mint-500/60 text-mint-300" : active ? "border-gold-400/70 text-gold-300" : "border-deep-500 text-mist-600"
                        }`}
                      >
                        {done ? <IcCheck className="w-3.5 h-3.5" /> : active ? <span className="w-3 h-3 rounded-full border-2 border-gold-400 border-t-transparent anim-spin-slow" /> : <span className="text-[0.65rem]">{fa(i + 1)}</span>}
                      </span>
                      <span className={`text-sm transition-colors duration-300 ${done ? "text-mist-100" : active ? "text-gold-300 font-bold" : "text-mist-600"}`}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-[0.68rem] text-mist-500 text-center mt-4">
              کلید یکتای سفارش: <code dir="ltr" className="text-mist-400">{product.id}-{qty}-{me.tgId.slice(-4)}</code> — پرداخت تکراری پردازش نمی‌شود
            </p>
          </div>
        )}

        {/* ---------- phase: result ---------- */}
        {phase === "result" && result && (
          <div className="anim-pop">
            {failedStep !== null && (
              <div className="card !border-coral-500/40 px-4 py-3.5 mb-4 flex gap-3">
                <IcAlert className="w-5 h-5 text-coral-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-coral-300">شکست امن در provisioning</p>
                  <p className="text-xs text-mist-400 mt-1 leading-5">
                    {result.failReason}. طبق قانون ۹، گروه جدید به‌صورت خودکار ساخته نمی‌شود.
                    {result.error?.includes("کیف پول") ? "" : " مبلغ به‌صورت خودکار بازگردانده شد."}
                  </p>
                </div>
              </div>
            )}

            {result.ok && result.status === "awaiting_payment" && (
              <div className="card !border-gold-500/40 px-4 py-5 text-center">
                <span className="mx-auto w-12 h-12 rounded-full bg-gold-500/15 text-gold-300 flex items-center justify-center mb-3">
                  <IcClock className="w-6 h-6" />
                </span>
                <p className="font-display text-xl text-gold-300">فیش شما ثبت شد</p>
                <p className="text-xs text-mist-400 mt-2 leading-6">
                  سفارش در صف بررسی مدیر قرار گرفت و معمولاً در کمتر از ۱ ساعت تأیید می‌شود.
                  <br />
                  وضعیت را می‌توانید در صفحه «خانه» دنبال کنید.
                </p>
                <button className="btn btn-gold w-full py-3 mt-4" onClick={onClose}>
                  متوجه شدم
                </button>
              </div>
            )}

            {result.ok && result.status === "active" && result.accounts && (
              <div>
                <div className="card !border-mint-500/35 px-4 py-4 mb-4 text-center">
                  <span className="mx-auto w-12 h-12 rounded-full bg-mint-500/15 text-mint-300 flex items-center justify-center mb-2 pulse-dot">
                    <IcCheck className="w-6 h-6" />
                  </span>
                  <p className="font-display text-xl text-mint-300">
                    {result.accounts.length > 1 ? `${fa(result.accounts.length)} اکانت فعال شد` : "اکانت شما فعال شد"}
                  </p>
                  <p className="text-[0.7rem] text-mist-500 mt-1">{serverLabel(server.code)} — گروه {product.groupId} — {fa(product.quotaGb * (result.accounts.length > 1 ? 1 : qty))} گیگابایت</p>
                </div>

                <div className="space-y-3">
                  {result.accounts.map((acc) => (
                    <AccountCreds key={acc.id} acc={acc} host={server.host} serverName={`ور وی‌پی‌ان — ${serverLabel(server.code)}`} showPass={showPass} setShowPass={setShowPass} />
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  {result.accounts.length === 1 && (
                    <button className="btn btn-gold flex-1 py-3" onClick={() => downloadOvpn(result.accounts![0], server.host, `ور وی‌پی‌ان — ${serverLabel(server.code)}`)}>
                      <IcDownload className="w-4 h-4" />
                      دانلود تنظیمات OVPN
                    </button>
                  )}
                  <button className="btn btn-mint flex-1 py-3" onClick={onClose}>
                    عالی، تمام شد
                  </button>
                </div>
              </div>
            )}

            {!result.ok && result.status !== "failed" && (
              <div className="card !border-coral-500/40 px-4 py-5 text-center">
                <IcAlert className="w-10 h-10 text-coral-300 mx-auto mb-2" />
                <p className="font-display text-xl text-coral-300">خطا در ثبت سفارش</p>
                <p className="text-xs text-mist-400 mt-2">{result.error}</p>
                <button className="btn btn-ghost w-full py-3 mt-4" onClick={onClose}>
                  بستن
                </button>
              </div>
            )}

            {failedStep !== null && (
              <button className="btn btn-ghost w-full py-3 mt-3" onClick={onClose}>
                بستن
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function QtyControl({ qty, setQty }: { qty: number; setQty: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5" dir="ltr">
      <button type="button" className="btn btn-ghost w-9 h-9" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}>
        −
      </button>
      <span className="w-10 text-center font-display text-xl tabular">{fa(qty)}</span>
      <button type="button" className="btn btn-ghost w-9 h-9" onClick={() => setQty(Math.min(10, qty + 1))} disabled={qty >= 10}>
        +
      </button>
    </div>
  );
}

function AccountCreds({
  acc,
  host,
  serverName,
  showPass,
  setShowPass,
}: {
  acc: Account;
  host: string;
  serverName: string;
  showPass: Record<string, boolean>;
  setShowPass: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const visible = showPass[acc.id];
  return (
    <div className="card px-4 py-3.5">
      {acc.customerName && (
        <p className="text-[0.7rem] text-gold-300 font-bold mb-2">مشتری: {acc.customerName}</p>
      )}
      <div className="flex items-center justify-between gap-2 py-1.5">
        <span className="text-xs text-mist-500">نام کاربری</span>
        <span className="flex items-center gap-1.5" dir="ltr">
          <code className="text-sm font-bold text-mist-100">{acc.radiusUsername}</code>
          <CopyBtn text={acc.radiusUsername} />
        </span>
      </div>
      <div className="h-px bg-mint-400/8 my-1" />
      <div className="flex items-center justify-between gap-2 py-1.5">
        <span className="text-xs text-mist-500">رمز عبور</span>
        <span className="flex items-center gap-1.5" dir="ltr">
          <code className="text-sm font-bold text-mist-100">{visible ? acc.radiusPassword : "••••••••••"}</code>
          <button className="btn btn-ghost px-2 py-1.5" onClick={() => setShowPass((s) => ({ ...s, [acc.id]: !s[acc.id] }))} aria-label="نمایش رمز">
            {visible ? <IcEyeOff className="w-3.5 h-3.5" /> : <IcEye className="w-3.5 h-3.5" />}
          </button>
          <CopyBtn text={acc.radiusPassword} />
        </span>
      </div>
      <div className="h-px bg-mint-400/8 my-1" />
      <div className="flex items-center justify-between gap-2 py-1.5">
        <span className="text-xs text-mist-500">انقضا</span>
        <span className="text-xs font-bold text-mint-300">{remainFa(acc.expiresAt)}</span>
      </div>
      <button className="btn btn-ghost w-full py-2 mt-2 text-xs" onClick={() => downloadOvpn(acc, host, serverName)}>
        <IcDownload className="w-3.5 h-3.5" />
        دانلود OVPN این اکانت
      </button>
    </div>
  );
}

export { gbOf, faGb, maskCard };
