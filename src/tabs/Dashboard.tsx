import React, { useEffect, useMemo, useState } from "react";
import { useStore } from "../lib/store";
import { fa, fa1, faGb, gbOf, last7DayLabels, money, pct, remainFa, timeFa } from "../lib/format";
import { Chip, IcAlert, IcBolt, IcCheck, IcClock, IcDownload, IcHistory, IcPower, IcRefresh, IcServer, IcSignal, Reveal, Ring, SectionHead, CopyBtn, Empty } from "../components/ui";
import type { Account } from "../lib/types";

function ovpnContent(acc: Account, host: string, serverName: string): string {
  return [
    `# VAR VPN — ${serverName}`,
    `# تولیدشده برای کاربر ${acc.radiusUsername} — ${new Date().toLocaleString("fa-IR")}`,
    `client`,
    `dev tun`,
    `proto udp`,
    `remote ${host} 1194`,
    `nobind`,
    `persist-key`,
    `persist-tun`,
    `cipher AES-256-GCM`,
    `auth SHA256`,
    `verb 3`,
    `auth-user-pass`,
    `# username: ${acc.radiusUsername}`,
    ``,
  ].join("\n");
}

export default function Dashboard({ onGoShop }: { onGoShop: () => void }) {
  const { state, me, toast } = useStore();
  const account = state.accounts.find((a) => a.ownerId === me.id && !a.soldBy);
  const server = state.servers[0];

  const [ping, setPing] = useState(42);
  const [uptime, setUptime] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      setPing(36 + Math.round(Math.random() * 22));
      setNow(Date.now());
    }, 2400);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const myPending = state.payments.find((p) => p.userId === me.id && p.status === "pending");
  const lastFailed = state.orders.find((o) => o.userId === me.id && o.status === "failed");
  const [failedDismissed, setFailedDismissed] = useState(false);

  const used = account?.usedBytes ?? 0;
  const quota = account?.quotaBytes ?? 0;
  const ratio = quota ? used / quota : 0;
  const remaining = Math.max(0, quota - used);
  const tone = ratio > 0.9 ? "coral" : ratio > 0.7 ? "gold" : "mint";

  const labels = useMemo(last7DayLabels, []);
  const maxDay = Math.max(...(account?.historyGb ?? [1]), 0.1);

  const uptimeStr = `${fa(Math.floor(uptime / 3600))}:${fa(Math.floor((uptime % 3600) / 60)).padStart(2, "۰")}:${fa(uptime % 60).padStart(2, "۰")}`;

  return (
    <div>
      {/* بنرهای وضعیت سفارش */}
      {myPending && (
        <Reveal>
          <div className="card !border-gold-500/40 px-4 py-3 flex items-center gap-3 mb-4">
            <span className="w-9 h-9 rounded-lg bg-gold-500/15 text-gold-300 flex items-center justify-center shrink-0">
              <IcClock className="w-5 h-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-bold text-gold-300">فیش کارت‌به‌کارت در انتظار تأیید مدیر</p>
              <p className="text-[0.7rem] text-mist-500 mt-0.5">{money(myPending.amount)} — معمولاً کمتر از ۱ ساعت</p>
            </div>
            <Chip tone="gold">در صف بررسی</Chip>
          </div>
        </Reveal>
      )}
      {lastFailed && !failedDismissed && (
        <Reveal>
          <div className="card !border-coral-500/35 px-4 py-3 flex items-center gap-3 mb-4">
            <IcAlert className="w-5 h-5 text-coral-300 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-coral-300">آخرین سفارش ناموفق بود</p>
              <p className="text-[0.7rem] text-mist-500 mt-0.5">{lastFailed.failReason ?? "خطا در پردازش"} — مبلغ بازگردانده شد</p>
            </div>
            <button className="btn btn-ghost px-2.5 py-1 text-[0.68rem]" onClick={() => setFailedDismissed(true)}>
              بستن
            </button>
          </div>
        </Reveal>
      )}

      {!account ? (
        <Reveal>
          <Empty
            icon={<IcServer className="w-6 h-6" />}
            title="هنوز اکانت VPN نداری"
            sub="یکی از بسته‌ها را انتخاب کن — بعد از پرداخت، اکانت در کمتر از ۱۰ ثانیه روی سرور آلمان ۱ ساخته می‌شود."
          />
          <button className="btn btn-gold w-full py-3.5 mt-4" onClick={onGoShop}>
            <IcBolt className="w-5 h-5" />
            مشاهده بسته‌ها
          </button>
        </Reveal>
      ) : (
        <>
          {/* کارت اکانت + حلقه مصرف */}
          <Reveal>
            <div className="card relative overflow-hidden px-5 pt-5 pb-6">
              <div className="packet-line absolute top-0 inset-x-0 h-px" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.7rem] text-mist-500 font-medium">اکانت فعال شما</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code dir="ltr" className="font-display text-xl text-mist-100">{account.radiusUsername}</code>
                    <CopyBtn text={account.radiusUsername} />
                  </div>
                </div>
                <Chip tone="mint" className="pulse-dot">
                  <span className="w-1.5 h-1.5 rounded-full bg-mint-400" />
                  متصل
                </Chip>
              </div>

              <div className="flex items-center justify-center gap-6 mt-5 flex-wrap sm:flex-nowrap">
                <Ring value={ratio} tone={tone}>
                  <span className="font-display text-[1.9rem] leading-8 text-mist-100 tabular">{fa(pct(used, quota))}٪</span>
                  <span className="text-[0.65rem] text-mist-500 mt-1">از سهمیه مصرف شده</span>
                </Ring>
                <div className="space-y-3 min-w-[10.5rem] flex-1 max-w-[15rem]">
                  <InfoRow k="مصرف شده" v={faGb(used)} />
                  <InfoRow k="باقی‌مانده" v={faGb(remaining)} strong />
                  <InfoRow k="سهمیه کل" v={faGb(quota)} />
                  <div className="pt-1">
                    <button className="btn btn-gold w-full py-2.5 text-sm" onClick={onGoShop}>
                      <IcRefresh className="w-4 h-4" />
                      تمدید / افزایش حجم
                    </button>
                  </div>
                </div>
              </div>

              {/* انقضا */}
              <div className="mt-5 pt-4 border-t border-mint-400/8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-mist-400 flex items-center gap-1.5">
                    <IcClock className="w-3.5 h-3.5 text-gold-400" />
                    {remainFa(account.expiresAt)}
                  </span>
                  <span className="text-[0.68rem] text-mist-600 tabular">{timeFa(account.expiresAt)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-deep-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-gold-400 to-mint-400 transition-all duration-1000"
                    style={{ width: `${Math.max(4, Math.min(100, ((account.expiresAt - now) / (30 * 86400000)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </Reveal>

          {/* نمودار مصرف ۷ روزه — از radacct */}
          <Reveal delay={90}>
            <SectionHead title="مصرف ۷ روز گذشته" sub="منبع: radacct" icon={<IcHistory className="w-5 h-5" />} />
            <div className="card px-5 py-5">
              <div className="flex items-end justify-between gap-2 h-28" dir="ltr">
                {(account.historyGb ?? []).map((g, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group cursor-default" title={`${fa1(g)} گیگابایت`}>
                    <span className="text-[0.6rem] text-mist-500 opacity-0 group-hover:opacity-100 transition-opacity tabular">{fa1(g)}</span>
                    <div
                      className={`anim-bar w-full max-w-7 rounded-t-md transition-colors ${i === 6 ? "bg-gold-400" : "bg-mint-500/55 group-hover:bg-mint-400"}`}
                      style={{ height: `${Math.max(6, (g / maxDay) * 100)}%`, animationDelay: `${i * 70}ms` }}
                    />
                    <span className="text-[0.62rem] text-mist-600">{labels[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* کارت اتصال زنده */}
          <Reveal delay={140}>
            <SectionHead title="اتصال زنده" sub="سرور آلمان ۱" icon={<IcSignal className="w-5 h-5" />} />
            <div className="card px-5 py-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="font-display text-2xl text-mint-300 tabular" dir="ltr">{ping}ms</p>
                  <p className="text-[0.65rem] text-mist-500 mt-0.5">پینگ</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-mist-100 tabular" dir="ltr">{uptimeStr}</p>
                  <p className="text-[0.65rem] text-mist-500 mt-0.5">آپ‌تایم جلسه</p>
                </div>
                <div>
                  <p className="font-display text-2xl text-sky-350 tabular" dir="ltr">10.8.0.••</p>
                  <p className="text-[0.65rem] text-mist-500 mt-0.5">IP تونل</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="btn btn-mint flex-1 py-2.5 text-sm"
                  onClick={() => {
                    setPing(30 + Math.round(Math.random() * 18));
                    toast(`تست اتصال موفق — پینگ ${fa(30 + Math.round(Math.random() * 18))} میلی‌ثانیه`, "ok");
                  }}
                >
                  <IcPower className="w-4 h-4" />
                  تست اتصال
                </button>
                <button
                  className="btn btn-ghost flex-1 py-2.5 text-sm"
                  onClick={() => {
                    const blob = new Blob([ovpnContent(account, server.host, server.name)], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `var-vpn-${account.radiusUsername}.ovpn`;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 4000);
                    toast("فایل تنظیمات دانلود شد", "ok");
                  }}
                >
                  <IcDownload className="w-4 h-4" />
                  فایل OVPN
                </button>
              </div>
              <p className="text-[0.65rem] text-mist-600 text-center mt-3">
                اعمال محدودیت حجم و انقضا مستقیماً توسط FreeRADIUS انجام می‌شود — بدون دخالت دستی.
              </p>
            </div>
          </Reveal>
        </>
      )}
    </div>
  );
}

function InfoRow({ k, v, strong = false }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-mist-500">{k}</span>
      <span className={`text-sm tabular ${strong ? "font-display text-lg text-mint-300" : "font-bold text-mist-200"}`}>{v}</span>
    </div>
  );
}
