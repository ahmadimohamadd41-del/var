import { useState } from "react";
import { useApp } from "../lib/store";
import * as api from "../lib/backend";
import type { Order, PayMethod } from "../lib/types";
import { faNum, faTime, faDate, toman } from "../lib/format";
import { Btn, Chip, EmptyState, ORDER_STATUS, PAY_STATUS } from "../components/ui";
import { IcAlert, IcChevron, IcReceipt, IcRefresh } from "../components/icons";

const METHOD_LABEL: Record<PayMethod, string> = {
  gateway: "درگاه بانکی",
  card: "کارت‌به‌کارت",
  wallet: "کیف پول همکار",
};

/** برای مشتری و همکار — ادمین لیست خودش را در AdminView دارد */
export default function OrdersView() {
  const { snap, role, runSnap, toast } = useApp();
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  if (!snap) return null;

  const actor = role === "partner" ? "p_alpha" : "customer";
  const orders = snap.orders.filter((o) => o.actor === actor);

  const retry = async (o: Order) => {
    setBusyId(o.id);
    const s = await runSnap(() => api.retryProvision(o.id));
    setBusyId(null);
    if (!s) return;
    const fresh = s.orders.find((x) => x.id === o.id);
    if (fresh?.status === "done") toast("ok", "پروویژن این‌بار موفق بود — اکانت فعال شد");
  };

  return (
    <div className="px-4 pb-6 pt-4">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="font-display text-[26px] leading-8">سفارش‌ها</h2>
          <p className="mt-1 text-[11.5px] text-mist-500">هر پرداخت یک idempotency_key دارد — کال‌بک تکراری، اکانت تکراری نمی‌سازد</p>
        </div>
      </div>

      {orders.length === 0 && (
        <EmptyState
          icon={<IcReceipt className="h-6 w-6" />}
          title="سفارشی ثبت نشده"
          sub="اولین بسته را از فروشگاه بخرید تا اینجا فهرست سفارش‌هایتان ساخته شود."
        />
      )}

      <div className="stagger space-y-2.5">
        {orders.map((o) => {
          const product = snap.products.find((p) => p.id === o.product_id);
          const payment = snap.payments.find((p) => p.order_id === o.id);
          const st = ORDER_STATUS[o.status];
          const open = openId === o.id;
          return (
            <div key={o.id} className="card anim-rise overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : o.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-right transition hover:bg-white/[0.025]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span dir="ltr" className="font-mono text-[12px] font-bold text-mist-100">{o.ref}</span>
                    <Chip tone={st.tone}>{st.label}</Chip>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-mist-500">
                    {product ? `${gb(o.product_id, snap)} ×${faNum(o.quantity)}` : "—"} • {METHOD_LABEL[o.method]} •{" "}
                    {faDate(o.created_at)} {faTime(o.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  <span className="text-[12.5px] font-extrabold text-gold-300">{toman(o.total_toman)}</span>
                  <IcChevron className={`h-4 w-4 text-mist-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                </div>
              </button>

              {open && (
                <div className="anim-fade space-y-3 border-t border-white/[0.06] bg-deep-900/50 px-4 py-3.5">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                    <Info k="روش پرداخت" v={METHOD_LABEL[o.method]} />
                    <Info
                      k="وضعیت پرداخت"
                      v={payment ? PAY_STATUS[payment.status].label : "—"}
                      tone={payment ? PAY_STATUS[payment.status].tone : "mist"}
                    />
                    <Info k="نوع" v={o.target_username ? `تمدید ${o.target_username}` : "اکانت جدید"} ltr={!!o.target_username} />
                    {payment && payment.method === "gateway" && (
                      <Info k="کال‌بک‌های دریافتی" v={`${faNum(payment.callback_hits)} بار`} />
                    )}
                    {o.receipt_no && <Info k="شماره تراکنش" v={o.receipt_no} ltr />}
                    {o.result_usernames.length > 0 && (
                      <Info k="اکانت‌های ساخته‌شده" v={o.result_usernames.join("، ")} ltr />
                    )}
                  </div>

                  {o.provision_note && (
                    <div className="flex items-start gap-2 rounded-lg border border-coral-500/25 bg-coral-500/[0.08] px-3 py-2.5 text-[10.5px] leading-5 text-mist-300">
                      <IcAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral-400" />
                      {o.provision_note}
                    </div>
                  )}

                  {o.status === "failed" && payment?.status === "approved" && (
                    <Btn
                      variant="gold"
                      className="!py-2.5 text-[12px]"
                      busy={busyId === o.id}
                      onClick={() => void retry(o)}
                    >
                      <IcRefresh className="h-4 w-4" />
                      تلاش دوباره پروویژن — بدون پرداخت مجدد
                    </Btn>
                  )}
                  {o.status === "awaiting_approval" && (
                    <p className="text-center text-[10.5px] text-mist-500">
                      منتظر تأیید مدیر هستید — بعد از تأیید، پروویژن خودکار انجام می‌شود
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function gb(productId: string, snap: { products: { id: string; quota_gb: number }[] }) {
  const p = snap.products.find((x) => x.id === productId);
  return p ? `${faNum(p.quota_gb)} گیگابایت / ۳۰ روز` : "—";
}

function Info({ k, v, ltr, tone }: { k: string; v: string; ltr?: boolean; tone?: "mint" | "gold" | "coral" | "mist" | "sky" }) {
  const toneCls =
    tone === "mint" ? "text-mint-300" : tone === "gold" ? "text-gold-300" : tone === "coral" ? "text-coral-300" : tone === "sky" ? "text-sky-350" : "text-mist-100";
  return (
    <div>
      <p className="text-[9.5px] text-mist-500">{k}</p>
      <p className={`mt-0.5 font-bold ${toneCls} ${ltr ? "font-mono text-[10.5px]" : ""}`} dir={ltr ? "ltr" : undefined} style={ltr ? { textAlign: "right" } : undefined}>
        {v}
      </p>
    </div>
  );
}
