import { useState } from "react";
import { useApp } from "../lib/store";
import * as api from "../lib/backend";
import type { Product, RadiusAccount } from "../lib/types";
import { faNum, faTime, faDate, toman } from "../lib/format";
import { Btn, Chip, EmptyState, Field, PARTNER_STATUS, Sheet, Stepper } from "../components/ui";
import { IcAlert, IcCheck, IcCopy, IcLock, IcUsers, IcWallet, IcZap } from "../components/icons";

const ME = "p_alpha";

/* ------------------------------ خرید همکار ------------------------------ */

export function PartnerShopView() {
  const { snap } = useApp();
  const [picked, setPicked] = useState<Product | null>(null);
  if (!snap) return null;
  const me = snap.partners.find((p) => p.id === ME);
  if (!me) return null;
  const st = PARTNER_STATUS[me.status];

  return (
    <div className="px-4 pb-6 pt-4">
      <div className="anim-rise card mb-4 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-gold-400/25 bg-gold-400/10 text-gold-300">
            <IcWallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[13px] font-extrabold">
              {me.name} <span dir="ltr" className="font-mono text-[10.5px] font-medium text-mist-500">{me.telegram}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-mist-500">
              موجودی: <b className="text-gold-300">{toman(me.wallet_toman)}</b>
            </p>
          </div>
        </div>
        <Chip tone={st.tone}>{st.label}</Chip>
      </div>

      {me.status !== "active" && (
        <div className="anim-rise mb-4 flex items-start gap-3 rounded-xl border border-coral-500/25 bg-coral-500/[0.07] px-4 py-4">
          <IcLock className="mt-0.5 h-5 w-5 shrink-0 text-coral-400" />
          <div>
            <p className="text-[12.5px] font-extrabold text-coral-300">
              {me.status === "pending" ? "حساب شما هنوز تأیید نشده" : "حساب شما تعلیق شده است"}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-mist-500">
              {me.status === "pending"
                ? "مدیر باید درخواست همکاری شما را تأیید کند. پس از تأیید، خرید از کیف پول فعال می‌شود."
                : "برای فعال‌سازی مجدد با مدیر تماس بگیرید."}
            </p>
          </div>
        </div>
      )}

      <div className="mb-3 flex items-end justify-between">
        <div>
          <h2 className="font-display text-[26px] leading-8">خرید برای مشتری</h2>
          <p className="mt-1 text-[11.5px] text-mist-500">اکانت انبار نمی‌شود — هم‌اکنون برای مشتری شما پروویژن می‌شود</p>
        </div>
        <IcUsers className="h-6 w-6 text-mint-400" />
      </div>

      <div className="stagger space-y-2.5">
        {snap.products.filter((p) => p.active).map((p) => (
          <div key={p.id} className="card flex items-center justify-between gap-3 px-4 py-3.5 transition hover:border-mint-500/30">
            <div className="flex items-center gap-3">
              <p className="font-display text-[30px] leading-8 text-mint-300">
                {faNum(p.quota_gb)}
                <span className="mr-1 text-[12px] text-mist-500">گیگ</span>
              </p>
              <div>
                <p className="text-[11.5px] font-bold text-mist-300">{faNum(p.duration_days)} روز اعتبار</p>
                <p className="mt-0.5 text-[12px] font-extrabold text-gold-300">{toman(p.price_toman)}</p>
              </div>
            </div>
            <Btn variant="ghost" full={false} disabled={me.status !== "active"} className="!px-4 !py-2 text-[12px]" onClick={() => setPicked(p)}>
              خرید
            </Btn>
          </div>
        ))}
      </div>

      <p className="mt-5 flex items-start gap-2 rounded-xl border border-white/[0.06] bg-deep-900/60 px-4 py-3 text-[10.5px] leading-5 text-mist-500">
        <IcAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
        حداقل موجودی کیف پول همکار {toman(snap.settings.min_partner_balance)} است (قابل تنظیم توسط مدیر). خرید عمده مجاز است؛ همه اکانت‌ها بلافاصله ساخته می‌شوند.
      </p>

      {picked && <PartnerBuySheet product={picked} onClose={() => setPicked(null)} />}
    </div>
  );
}

function PartnerBuySheet({ product, onClose }: { product: Product; onClose: () => void }) {
  const { snap, run, toast } = useApp();
  const [qty, setQty] = useState(1);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ accounts: RadiusAccount[]; ref: string } | null>(null);
  if (!snap) return null;
  const me = snap.partners.find((p) => p.id === ME);
  const total = product.price_toman * qty;
  const enough = !!me && me.wallet_toman >= total;

  const buy = async () => {
    setBusy(true);
    const res = await run(() => api.partnerPurchase(ME, product.id, qty, label));
    setBusy(false);
    if (!res) return;
    const order = res.s.orders.find((o) => o.id === res.orderId);
    if (!order) return;
    if (order.status === "done") {
      setResult({
        accounts: res.s.accounts.filter((a) => order.result_usernames.includes(a.username)),
        ref: order.ref,
      });
    } else {
      toast("err", order.provision_note ?? "خطا در پروویژن");
      onClose();
    }
  };

  return (
    <Sheet open onClose={onClose} title={result ? "اکانت‌ها آماده‌اند" : `خرید ${faNum(product.quota_gb)} گیگابایت`}>
      {!result && (
        <div className="anim-fade space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-deep-900/60 px-4 py-3">
            <div>
              <p className="text-[12px] font-extrabold">تعداد اکانت</p>
              <p className="mt-0.5 text-[10.5px] text-mist-500">خرید عمده — پروویژن فوری</p>
            </div>
            <Stepper value={qty} min={1} max={10} onChange={setQty} />
          </div>

          <Field label="برچسب مشتری (اختیاری)" hint="مثلاً نام مشتری نهایی — در ledger و پنل ادمین ثبت می‌شود">
            <input className="inp" placeholder="مثلاً: مشتری از اینستاگرام" value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>

          <div className="space-y-1.5 rounded-xl border border-gold-400/25 bg-gold-400/[0.06] px-4 py-3 text-[11.5px]">
            <div className="flex justify-between text-mist-300">
              <span>قیمت واحد</span>
              <span>{toman(product.price_toman)}</span>
            </div>
            <div className="flex justify-between text-mist-300">
              <span>تعداد</span>
              <span>×{faNum(qty)}</span>
            </div>
            <div className="flex justify-between border-t border-gold-400/20 pt-1.5 text-[13px] font-extrabold text-gold-300">
              <span>کسر از کیف پول</span>
              <span>{toman(total)}</span>
            </div>
            <div className="flex justify-between text-[10.5px] text-mist-500">
              <span>موجودی بعد از خرید</span>
              <span>{toman((me?.wallet_toman ?? 0) - total)}</span>
            </div>
          </div>

          <Btn variant="gold" busy={busy} disabled={!enough} onClick={() => void buy()}>
            <IcZap className="h-4 w-4" />
            {enough ? "خرید و پروویژن فوری" : "موجودی کافی نیست"}
          </Btn>
        </div>
      )}

      {result && (
        <div className="anim-fade space-y-4">
          <div className="anim-pop mx-auto grid h-14 w-14 place-items-center rounded-full border-2 border-mint-400 bg-mint-500/15 text-mint-400">
            <IcCheck className="h-7 w-7" />
          </div>
          <p className="text-center text-[11.5px] text-mist-500">
            سفارش <span dir="ltr" className="font-mono font-bold text-mist-300">{result.ref}</span> — {faNum(result.accounts.length)} اکانت ساخته شد و از کیف پول کسر شد
          </p>
          <div className="stagger max-h-56 space-y-2 overflow-y-auto pl-1">
            {result.accounts.map((a) => (
              <div key={a.id} className="card flex items-center justify-between gap-2 px-3.5 py-2.5">
                <div dir="ltr" className="font-mono text-[11.5px] font-bold">
                  <span className="text-mist-100">{a.username}</span>
                  <span className="text-mist-500"> : </span>
                  <span className="text-mint-300">{a.password}</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(`${a.username}:${a.password}`);
                      toast("ok", "کپی شد");
                    } catch {
                      toast("err", "کپی ممکن نشد");
                    }
                  }}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 text-mist-500 transition hover:border-mint-500/40 hover:text-mint-300 active:scale-90"
                  aria-label="کپی"
                >
                  <IcCopy className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Btn
            variant="ghost"
            onClick={async () => {
              const txt = result.accounts.map((a) => `${a.username}:${a.password}`).join("\n");
              try {
                await navigator.clipboard.writeText(txt);
                toast("ok", "همه اکانت‌ها کپی شدند");
              } catch {
                toast("err", "کپی ممکن نشد");
              }
            }}
          >
            <IcCopy className="h-4 w-4" />
            کپی همه برای ارسال به مشتری
          </Btn>
        </div>
      )}
    </Sheet>
  );
}

/* ------------------------------ کیف پول همکار ------------------------------ */

export function PartnerWalletView() {
  const { snap } = useApp();
  if (!snap) return null;
  const me = snap.partners.find((p) => p.id === ME);
  if (!me) return null;
  const st = PARTNER_STATUS[me.status];
  const entries = snap.ledger.filter((l) => l.partner_id === ME);
  const belowMin = me.wallet_toman < snap.settings.min_partner_balance;

  return (
    <div className="px-4 pb-6 pt-4">
      <div className="anim-rise relative overflow-hidden rounded-2xl border border-gold-400/25 bg-gradient-to-b from-gold-400/[0.14] via-deep-850 to-deep-850 px-5 py-5">
        <div className="pointer-events-none absolute -left-10 -top-14 h-36 w-36 rounded-full bg-gold-400/10 blur-2xl" />
        <div className="flex items-center justify-between">
          <p className="text-[11.5px] font-bold text-mist-500">موجودی کیف پول</p>
          <Chip tone={st.tone}>{st.label}</Chip>
        </div>
        <p className="mt-2 font-display text-[38px] leading-10 text-gold-300">{toman(me.wallet_toman)}</p>
        <p className="mt-1.5 text-[10.5px] text-mist-500">
          حداقل موجودی لازم: {toman(snap.settings.min_partner_balance)}
          {belowMin && <span className="mr-1.5 font-bold text-coral-300">— کمتر از حد مجاز! شارژ لازم است</span>}
        </p>
        <p className="mt-3 border-t border-white/[0.06] pt-2.5 text-[10.5px] leading-5 text-mist-500">
          شارژ و کسر فقط توسط مدیر و با دلیل ثبت می‌شود — همه عملیات‌ها در ledger قابل حسابرسی‌اند.
        </p>
      </div>

      <div className="mb-2.5 mt-5 flex items-center justify-between">
        <h3 className="text-[13px] font-extrabold">گردش حساب</h3>
        <Chip tone="mist">{faNum(entries.length)} تراکنش</Chip>
      </div>

      {entries.length === 0 && (
        <EmptyState icon={<IcWallet className="h-6 w-6" />} title="تراکنشی ثبت نشده" sub="بعد از اولین خرید یا شارژ مدیر، گردش حساب اینجا می‌آید." />
      )}

      <div className="stagger space-y-2">
        {entries.map((l) => (
          <div key={l.id} className="card flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[11.5px] font-bold text-mist-100">{l.reason}</p>
              <p className="mt-0.5 text-[10px] text-mist-500">
                {l.actor_label} • {faDate(l.at)} {faTime(l.at)} • مانده بعد: {toman(l.balance_after)}
              </p>
            </div>
            <span className={`shrink-0 text-[12.5px] font-extrabold ${l.delta_toman > 0 ? "text-mint-300" : "text-coral-300"}`}>
              {l.delta_toman > 0 ? "+" : "−"}
              {toman(Math.abs(l.delta_toman))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
