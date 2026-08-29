import React, { useState } from "react";
import { useStore } from "../lib/store";
import { fa, fa1, money, agoFa } from "../lib/format";
import type { Product } from "../lib/types";
import { Chip, IcBolt, IcCheck, IcSpark, IcStore, Reveal, SectionHead, orderTone } from "../components/ui";
import PurchaseFlow from "../components/PurchaseFlow";

export default function Shop() {
  const { state, me } = useStore();
  const [selected, setSelected] = useState<Product | null>(null);
  const products = state.products.filter((p) => p.active);
  const myOrders = state.orders.filter((o) => o.userId === me.id).slice(0, 6);

  return (
    <div>
      {/* نوار توضیح قانون تمدید — با مثال واقعی سند معماری */}
      <Reveal>
        <div className="rounded-xl border border-mint-400/20 bg-mint-900/25 px-4 py-3.5 flex gap-3">
          <IcSpark className="w-5 h-5 text-mint-300 shrink-0 mt-0.5" />
          <p className="text-[0.72rem] leading-6 text-mist-300">
            <b className="text-mint-300">تمدید یعنی افزودن حجم، نه ریست شدن:</b> اگر ۲۰ گیگ سهمیه داشته باشی و ۱۹ گیگ مصرف کرده باشی، با خرید بسته ۱۰ گیگ
            سهمیه‌ات می‌شود <b className="text-gold-300">۳۰ گیگ</b> و حدود <b className="text-gold-300">۱۱ گیگ</b> باقی‌مانده خواهی داشت. مصرف قبلی هرگز
            صفر نمی‌شود.
          </p>
        </div>
      </Reveal>

      <SectionHead title="بسته‌های اینترنت" sub="همه ۳۰ روزه" icon={<IcStore className="w-5 h-5" />} />

      <div className="space-y-3">
        {products.map((p, i) => {
          const active = selected?.id === p.id;
          const perGb = Math.round(p.price / p.quotaGb);
          return (
            <Reveal key={p.id} delay={i * 70}>
              <button
                type="button"
                onClick={() => setSelected(p)}
                className={`card card-hover w-full text-right px-4 py-4 flex items-center gap-4 transition-all duration-200 cursor-pointer ${
                  active ? "!border-gold-400/70 shadow-[0_0_0_3px_rgba(246,189,90,0.12)]" : ""
                }`}
              >
                <div className={`relative w-16 h-16 rounded-xl flex flex-col items-center justify-center shrink-0 ${active ? "bg-gold-500/15 text-gold-300" : "bg-deep-700 text-mint-300"}`}>
                  <span className="font-display text-[1.7rem] leading-7 tabular">{fa(p.quotaGb)}</span>
                  <span className="text-[0.58rem] font-bold tracking-wide opacity-80">GB</span>
                  {p.popular && (
                    <span className="absolute -top-2 right-1/2 translate-x-1/2 chip border bg-gold-400 text-deep-900 border-gold-300 !text-[0.58rem] !px-2 whitespace-nowrap">
                      پرفروش
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg text-mist-100">اشتراک {p.name}</p>
                  <p className="text-[0.7rem] text-mist-500 mt-0.5">
                    {fa(p.durationDays)} روز اعتبار • گروه RADIUS: <code dir="ltr">{p.groupId}</code>
                  </p>
                  <p className="text-[0.68rem] text-mint-400 mt-1">هر گیگ {fa(perGb)} تومان</p>
                </div>
                <div className="text-left shrink-0">
                  <p className="font-display text-lg text-gold-300 tabular">{money(p.price)}</p>
                  <span className={`inline-flex w-5 h-5 rounded-full border-2 mt-2 items-center justify-center ${active ? "border-gold-400 bg-gold-400" : "border-deep-500"}`}>
                    {active && <IcCheck className="w-3 h-3 text-deep-900" />}
                  </span>
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>

      <div className="sticky bottom-20 z-20 mt-5">
        <button
          className={`btn w-full py-4 text-base shadow-xl transition-all ${selected ? "btn-gold" : "btn-ghost"}`}
          disabled={!selected}
          onClick={() => selected && setSelected({ ...selected })}
          style={selected ? undefined : { pointerEvents: "none" }}
        >
          {selected ? (
            <>
              <IcBolt className="w-5 h-5" />
              خرید {selected.name} — {money(selected.price)}
            </>
          ) : (
            "یک بسته را انتخاب کنید"
          )}
        </button>
      </div>

      {/* تاریخچه سفارش‌ها */}
      {myOrders.length > 0 && (
        <>
          <SectionHead title="سفارش‌های اخیر شما" icon={<IcCheck className="w-5 h-5" />} />
          <div className="space-y-2.5">
            {myOrders.map((o, i) => {
              const p = state.products.find((x) => x.id === o.productId);
              const t = orderTone[o.status];
              return (
                <Reveal key={o.id} delay={i * 50}>
                  <div className="card px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-mist-100">
                        {p?.name ?? "—"} {o.qty > 1 && <span className="text-mist-500">×{fa(o.qty)}</span>}
                      </p>
                      <p className="text-[0.68rem] text-mist-500 mt-0.5">
                        {agoFa(o.createdAt)} • {o.payMethod === "gateway" ? "درگاه" : o.payMethod === "card" ? "کارت‌به‌کارت" : "کیف پول"}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-mist-200 tabular shrink-0">{money(o.total)}</span>
                    <Chip tone={t.tone}>{t.label}</Chip>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </>
      )}

      {selected && <PurchaseFlow product={state.products.find((p) => p.id === selected.id) ?? selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
