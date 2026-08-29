import React, { useState } from "react";
import { useStore } from "../lib/store";
import { dateFullFa, fa, money } from "../lib/format";
import { Chip, ConfirmBtn, IcAlert, IcRefresh, IcServer, IcShield, IcTg, IcUser, IcUsers, Reveal, SectionHead } from "../components/ui";

export default function Profile() {
  const { state, me, switchUser, resetDemo } = useStore();
  const [confirming, setConfirming] = useState(false);

  const myOrders = state.orders.filter((o) => o.userId === me.id);
  const roleLabel = me.role === "admin" ? "مدیر" : me.role === "partner" ? "همکار" : "مشتری";

  return (
    <div>
      <Reveal>
        <div className="card relative overflow-hidden px-5 py-6 text-center">
          <div className="packet-line absolute top-0 inset-x-0 h-px" />
          <span className="mx-auto w-16 h-16 rounded-2xl bg-deep-700 border border-gold-400/25 text-gold-300 font-display text-3xl flex items-center justify-center">
            {me.name.trim()[0]}
          </span>
          <h3 className="font-display text-2xl text-mist-100 mt-3">{me.name}</h3>
          <p className="text-[0.7rem] text-mist-500 mt-1" dir="ltr">Telegram ID: {me.tgId}</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Chip tone={me.role === "admin" ? "coral" : me.role === "partner" ? "gold" : "mint"}>
              {me.role === "admin" ? <IcShield className="w-3.5 h-3.5" /> : me.role === "partner" ? <IcUsers className="w-3.5 h-3.5" /> : <IcUser className="w-3.5 h-3.5" />}
              {roleLabel}
            </Chip>
            <Chip tone="mist">عضویت از {dateFullFa(me.joinedAt)}</Chip>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div className="rounded-lg bg-deep-900/70 border border-mint-400/8 px-3 py-2.5">
              <p className="font-display text-xl text-mist-100 tabular">{fa(myOrders.length)}</p>
              <p className="text-[0.65rem] text-mist-500 mt-0.5">سفارش ثبت‌شده</p>
            </div>
            <div className="rounded-lg bg-deep-900/70 border border-mint-400/8 px-3 py-2.5">
              <p className="font-display text-xl text-mist-100 tabular">{fa(state.accounts.filter((a) => a.ownerId === me.id && !a.soldBy).length)}</p>
              <p className="text-[0.65rem] text-mist-500 mt-0.5">اکانت فعال</p>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <SectionHead title="حالت نمایش لوکال" sub="تا قبل از اتصال به سرور" icon={<IcUser className="w-5 h-5" />} />
        <div className="card px-4 py-4">
          <p className="text-[0.7rem] text-mist-500 leading-6 mb-3">
            در نسخه سرور، هویت و نقش مستقیم از <b className="text-mist-300">تلگرام</b> می‌آید. برای تست لوکال می‌توانید بین کاربرهای دمو جابه‌جا شوید:
          </p>
          <div className="space-y-2">
            {state.users.filter((u) => u.id !== "u_new").map((u) => {
              const active = u.id === me.id;
              return (
                <button
                  key={u.id}
                  onClick={() => switchUser(u.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all cursor-pointer ${
                    active ? "border-gold-400/60 bg-gold-500/8" : "border-mint-400/10 bg-deep-900/50 hover:border-mint-400/30"
                  }`}
                >
                  <span className={`w-9 h-9 rounded-lg font-display text-base flex items-center justify-center ${active ? "bg-gold-500/20 text-gold-300" : "bg-deep-700 text-mist-400"}`}>
                    {u.name.trim()[0]}
                  </span>
                  <span className="flex-1 text-right">
                    <span className="block text-sm font-bold text-mist-100">{u.name}</span>
                    <span className="block text-[0.65rem] text-mist-500 mt-0.5">
                      {u.role === "admin" ? "پنل مدیریت و تأییدها" : u.role === "partner" ? `کیف پول: ${money(state.wallets.find((w) => w.userId === u.id)?.balance ?? 0)}` : "خرید و تمدید اکانت"}
                    </span>
                  </span>
                  {active && <Chip tone="gold">فعال</Chip>}
                </button>
              );
            })}
          </div>
        </div>
      </Reveal>

      <Reveal delay={140}>
        <SectionHead title="آمادهٔ اتصال به سرور" icon={<IcServer className="w-5 h-5" />} />
        <div className="card px-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-mist-400">بک‌اند (FastAPI)</span>
            <code className="text-xs text-mint-300" dir="ltr">{state.settings.apiBase}</code>
          </div>
          <ul className="mt-3 space-y-2">
            {[
              "Modular Monolith — بدون میکروسرویس اضافه",
              "دیتابیس VAR جدا از دیتابیس radius (بدون تغییر اسکیما)",
              "آداپتور RADIUS فقط خواندن radacct و نوشتن امن",
              "پرداخت‌ها و provisioning کاملاً آیدمپوتنت",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-[0.72rem] text-mist-400 leading-5">
                <span className="w-1.5 h-1.5 rounded-full bg-mint-400 mt-1.5 shrink-0" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal delay={180}>
        <div className="card px-4 py-4 mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-mist-100">بازنشانی داده دمو</p>
            <p className="text-[0.68rem] text-mist-500 mt-0.5">همه تغییرات لوکال پاک و حالت اولیه برگردانده می‌شود</p>
          </div>
          <ConfirmBtn onConfirm={resetDemo} className="btn btn-coral px-3.5 py-2.5 text-xs" confirmLabel="مطمئنید؟">
            <IcRefresh className="w-4 h-4" />
            بازنشانی
          </ConfirmBtn>
        </div>
      </Reveal>

      <Reveal delay={220}>
        <a
          className="card card-hover px-4 py-4 mt-4 flex items-center gap-3 mb-2"
          href={`https://t.me/${state.settings.supportHandle.replace("@", "")}`}
          target="_blank"
          rel="noreferrer"
        >
          <span className="w-10 h-10 rounded-lg bg-sky-350/12 text-sky-350 flex items-center justify-center">
            <IcTg className="w-5 h-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-mist-100">پشتیبانی تلگرام</span>
            <span className="block text-[0.68rem] text-mist-500 mt-0.5" dir="ltr">{state.settings.supportHandle}</span>
          </span>
        </a>
      </Reveal>

      <p className="text-center text-[0.62rem] text-mist-600 mt-6 leading-5">
        VAR VPN — نسخه نمایشی لوکال ۰٫۱
        <br />
        داده‌ها فقط در مرورگر شما ذخیره می‌شوند
      </p>
    </div>
  );
}
