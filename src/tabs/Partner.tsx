import React, { useState } from "react";
import { useStore } from "../lib/store";
import { agoFa, fa, faGb, money, pct, remainFa, timeFa } from "../lib/format";
import type { Product } from "../lib/types";
import { Chip, IcAlert, IcCheck, IcClock, IcPlus, IcSend, IcUsers, IcWallet, Reveal, SectionHead, Stepper, Empty } from "../components/ui";
import PurchaseFlow from "../components/PurchaseFlow";

export default function Partner() {
  const { state, me, api, toast } = useStore();

  if (me.role === "admin") {
    const partners = state.users.filter((u) => u.role === "partner");
    return (
      <div>
        <SectionHead title="همکاران فعال" icon={<IcUsers className="w-5 h-5" />} />
        <div className="space-y-2.5">
          {partners.map((p) => {
            const w = state.wallets.find((x) => x.userId === p.id);
            const sold = state.accounts.filter((a) => a.soldBy === p.id).length;
            return (
              <div key={p.id} className="card px-4 py-3.5 flex items-center gap-3">
                <Avatar name={p.name} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-mist-100">{p.name}</p>
                  <p className="text-[0.68rem] text-mist-500 mt-0.5">{fa(sold)} اکانت فروخته‌شده</p>
                </div>
                <span className="text-sm font-bold text-mint-300 tabular">{money(w?.balance ?? 0)}</span>
              </div>
            );
          })}
        </div>
        <p className="text-[0.7rem] text-mist-500 mt-4 leading-6">
          مدیریت تأیید همکاران و شارژ کیف پول در بخش «مدیریت» انجام می‌شود.
        </p>
      </div>
    );
  }

  if (me.role === "customer") return <BecomePartner />;
  return <PartnerDash />;
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="w-10 h-10 rounded-xl bg-deep-700 border border-mint-400/15 text-gold-300 font-display text-lg flex items-center justify-center shrink-0">
      {name.trim()[0]}
    </span>
  );
}

/* ---------- فرم درخواست همکاری ---------- */
function BecomePartner() {
  const { state, me, api, toast } = useStore();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const req = state.partnerRequests.find((r) => r.userId === me.id);

  return (
    <div>
      <Reveal>
        <div className="card relative overflow-hidden px-5 py-6">
          <div className="packet-line absolute top-0 inset-x-0 h-px" />
          <span className="w-12 h-12 rounded-xl bg-gold-500/15 text-gold-300 flex items-center justify-center mb-3">
            <IcUsers className="w-6 h-6" />
          </span>
          <h3 className="font-display text-2xl text-mist-100">همکار فروش VAR شوید</h3>
          <p className="text-xs text-mist-400 leading-6 mt-2">
            بدون نگهداری موجودی اکانت — هر اکانت به‌محض داشتن مشتری ساخته می‌شود. کیف پول ledger-based با حداقل موجودی{" "}
            <b className="text-gold-300 tabular">{money(state.settings.minPartnerBalance)}</b>.
          </p>
          <ul className="mt-4 space-y-2">
            {["خرید عمومی با کسر آنی از کیف پول", "ساخت اکانت فوری برای مشتری (تکی یا عمده)", "ریز گردش کیف پول با دلیل و ممیزی کامل"].map((t) => (
              <li key={t} className="flex items-center gap-2 text-[0.75rem] text-mist-300">
                <IcCheck className="w-4 h-4 text-mint-400 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      {req ? (
        <Reveal delay={100}>
          <div
            className={`card mt-4 px-4 py-4 flex items-center gap-3 ${
              req.status === "pending" ? "!border-gold-500/40" : req.status === "approved" ? "!border-mint-500/40" : "!border-coral-500/40"
            }`}
          >
            {req.status === "pending" ? <IcClock className="w-6 h-6 text-gold-300" /> : req.status === "approved" ? <IcCheck className="w-6 h-6 text-mint-300" /> : <IcAlert className="w-6 h-6 text-coral-300" />}
            <div>
              <p className="text-sm font-bold text-mist-100">
                {req.status === "pending" ? "درخواست شما در حال بررسی است" : req.status === "approved" ? "درخواست شما تأیید شد" : "درخواست شما رد شد"}
              </p>
              <p className="text-[0.7rem] text-mist-500 mt-0.5">{agoFa(req.at)} — نتیجه توسط مدیر اعلام می‌شود</p>
            </div>
          </div>
        </Reveal>
      ) : (
        <Reveal delay={100}>
          <div className="card mt-4 px-4 py-4">
            <label className="text-xs font-bold text-mist-400 block mb-2">توضیح درخواست (اختیاری)</label>
            <textarea
              className="input min-h-24 resize-none"
              placeholder="مثلاً: مدیر کانال فروش هستم و ماهانه حدود ۲۰ مشتری دارم…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
            />
            <button
              className="btn btn-gold w-full py-3 mt-3"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const r = await api.requestPartner(note);
                setBusy(false);
                if (r.ok) toast("درخواست همکاری ثبت شد", "ok");
                else toast(r.error ?? "خطا", "err");
              }}
            >
              <IcSend className="w-4 h-4" />
              {busy ? "در حال ثبت…" : "ثبت درخواست همکاری"}
            </button>
          </div>
        </Reveal>
      )}
    </div>
  );
}

/* ---------- داشبورد همکار ---------- */
function PartnerDash() {
  const { state, me } = useStore();
  const wallet = state.wallets.find((w) => w.userId === me.id);
  const sold = state.accounts.filter((a) => a.soldBy === me.id);
  const spent = (wallet?.ledger ?? []).filter((l) => l.delta < 0).reduce((s, l) => s + Math.abs(l.delta), 0);

  const [customer, setCustomer] = useState("");
  const [productId, setProductId] = useState(state.products[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState("");
  const [flowProduct, setFlowProduct] = useState<Product | null>(null);
  const [flowCustomer, setFlowCustomer] = useState("");
  const [flowQty, setFlowQty] = useState(1);

  const product = state.products.find((p) => p.id === productId);
  const total = (product?.price ?? 0) * qty;
  const balance = wallet?.balance ?? 0;

  const submit = () => {
    if (customer.trim().length < 3) {
      setErr("نام مشتری را کامل وارد کنید (حداقل ۳ حرف)");
      return;
    }
    if (total > balance) {
      setErr("موجودی کیف پول برای این سفارش کافی نیست");
      return;
    }
    setErr("");
    setFlowCustomer(customer.trim());
    setFlowQty(qty);
    setFlowProduct(product ?? null);
  };

  return (
    <div>
      {/* کیف پول */}
      <Reveal>
        <div className="card relative overflow-hidden px-5 py-5">
          <div className="packet-line absolute top-0 inset-x-0 h-px" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[0.7rem] text-mist-500 font-medium flex items-center gap-1.5">
                <IcWallet className="w-3.5 h-3.5 text-gold-400" />
                موجودی کیف پول همکار
              </p>
              <p className="font-display text-[2.1rem] leading-10 text-gold-300 tabular mt-1">{money(balance)}</p>
            </div>
            <Chip tone={balance >= state.settings.minPartnerBalance ? "mint" : "coral"}>
              حداقل مجاز: {money(state.settings.minPartnerBalance)}
            </Chip>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-lg bg-deep-900/70 border border-mint-400/8 px-3.5 py-2.5">
              <p className="text-[0.65rem] text-mist-500">اکانت‌های فروخته‌شده</p>
              <p className="font-display text-xl text-mist-100 tabular mt-0.5">{fa(sold.length)}</p>
            </div>
            <div className="rounded-lg bg-deep-900/70 border border-mint-400/8 px-3.5 py-2.5">
              <p className="text-[0.65rem] text-mist-500">مجموع خرید شما</p>
              <p className="font-display text-xl text-mist-100 tabular mt-0.5">{money(spent)}</p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ثبت سفارش برای مشتری */}
      <Reveal delay={90}>
        <SectionHead title="ثبت اکانت برای مشتری" sub="ساخت فوری — بدون انبار کردن" icon={<IcPlus className="w-5 h-5" />} />
        <div className="card px-4 py-4 space-y-3.5">
          <div>
            <label className="text-xs font-bold text-mist-400 block mb-1.5">نام مشتری</label>
            <input className="input" placeholder="مثلاً: رضا کریمی" value={customer} onChange={(e) => setCustomer(e.target.value)} maxLength={40} />
          </div>
          <div>
            <label className="text-xs font-bold text-mist-400 block mb-1.5">بسته</label>
            <div className="grid grid-cols-4 gap-2">
              {state.products.filter((p) => p.active).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProductId(p.id)}
                  className={`rounded-lg border py-2.5 text-center transition-all cursor-pointer ${
                    productId === p.id ? "border-gold-400/70 bg-gold-500/10 text-gold-300" : "border-mint-400/12 bg-deep-900/60 text-mist-400 hover:border-mint-400/30"
                  }`}
                >
                  <span className="block font-display text-lg leading-6 tabular">{fa(p.quotaGb)}</span>
                  <span className="block text-[0.6rem]">گیگابایت</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-mist-400">تعداد (عمده)</span>
            <Stepper value={qty} onChange={setQty} />
          </div>
          <div className="flex items-center justify-between border-t border-mint-400/8 pt-3">
            <span className="text-xs text-mist-400">کسر از کیف پول</span>
            <span className={`font-display text-lg tabular ${total > balance ? "text-coral-300" : "text-gold-300"}`}>{money(total)}</span>
          </div>
          {err && (
            <p className="text-[0.7rem] text-coral-300 flex items-center gap-1.5">
              <IcAlert className="w-3.5 h-3.5" />
              {err}
            </p>
          )}
          <button className="btn btn-gold w-full py-3" onClick={submit}>
            <IcSend className="w-4 h-4" />
            ادامه و پرداخت از کیف پول
          </button>
          <p className="text-[0.65rem] text-mist-600 text-center leading-5">
            اکانت‌ها بلافاصله پس از کسر از کیف پول روی آلمان ۱ ساخته می‌شوند — هیچ اکانتی از قبل انبار نمی‌شود.
          </p>
        </div>
      </Reveal>

      {/* مشتریان من */}
      <Reveal delay={140}>
        <SectionHead title="مشتریان من" icon={<IcUsers className="w-5 h-5" />} />
        {sold.length === 0 ? (
          <Empty title="هنوز فروشی نداشته‌اید" sub="اولین اکانت را با فرم بالا برای مشتری‌تان بسازید." />
        ) : (
          <div className="space-y-2.5">
            {sold.map((a) => (
              <div key={a.id} className="card px-4 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={a.customerName ?? "؟"} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-mist-100 truncate">{a.customerName}</p>
                      <code className="text-[0.65rem] text-mist-500" dir="ltr">{a.radiusUsername}</code>
                    </div>
                  </div>
                  <Chip tone={a.expiresAt > Date.now() ? "mint" : "coral"}>{remainFa(a.expiresAt)}</Chip>
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[0.68rem] text-mist-500 mb-1.5">
                    <span>{faGb(a.usedBytes)} از {faGb(a.quotaBytes)}</span>
                    <span className="tabular">{fa(pct(a.usedBytes, a.quotaBytes))}٪</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-deep-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${pct(a.usedBytes, a.quotaBytes) > 85 ? "bg-coral-400" : "bg-mint-400"}`}
                      style={{ width: `${Math.max(3, pct(a.usedBytes, a.quotaBytes))}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Reveal>

      {/* گردش کیف پول */}
      <Reveal delay={180}>
        <SectionHead title="گردش کیف پول" sub="ledger-based • با دلیل و ممیزی" icon={<IcWallet className="w-5 h-5" />} />
        <div className="card divide-y divide-mint-400/6">
          {(wallet?.ledger ?? []).length === 0 && <p className="text-xs text-mist-500 text-center py-6">تراکنشی ثبت نشده است</p>}
          {(wallet?.ledger ?? []).map((l) => (
            <div key={l.id} className="px-4 py-3 flex items-center gap-3">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${l.delta >= 0 ? "bg-mint-500/12 text-mint-300" : "bg-coral-500/12 text-coral-300"}`}>
                {l.delta >= 0 ? <IcPlus className="w-4 h-4" /> : <IcWallet className="w-4 h-4" />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-mist-200 truncate">{l.reason}</p>
                <p className="text-[0.65rem] text-mist-600 mt-0.5">{agoFa(l.at)} • توسط {l.actor}</p>
              </div>
              <div className="text-left shrink-0">
                <p className={`text-sm font-bold tabular ${l.delta >= 0 ? "text-mint-300" : "text-coral-300"}`}>
                  {l.delta >= 0 ? "+" : "−"}{money(Math.abs(l.delta))}
                </p>
                <p className="text-[0.62rem] text-mist-600 tabular">موجودی: {money(l.balanceAfter)}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {flowProduct && (
        <PurchaseFlow
          product={flowProduct}
          initialQty={flowQty}
          forCustomer={flowCustomer}
          onClose={() => {
            setFlowProduct(null);
            setCustomer("");
            setQty(1);
          }}
        />
      )}
    </div>
  );
}
