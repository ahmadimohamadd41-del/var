import { useState } from "react";
import { useApp } from "../lib/store";
import * as api from "../lib/backend";
import { daysLeftLabel, faDate, gbOf, pct } from "../lib/format";
import { Btn, Chip, EmptyState, LiveDot, UsageBar } from "../components/ui";
import { IcAlert, IcCopy, IcDownload, IcEye, IcEyeOff, IcKey, IcRefresh, IcServer } from "../components/icons";

export default function AccountsView() {
  const { snap, setRenewFor, setTab, toast } = useApp();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  if (!snap) return null;

  const accounts = snap.accounts.filter((a) => a.owner === "customer");

  const downloadOvpn = (id: string) => {
    const acct = snap.accounts.find((a) => a.id === id);
    if (!acct) return;
    const blob = new Blob([api.buildOvpn(acct)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${acct.username}.ovpn`;
    a.click();
    URL.revokeObjectURL(url);
    toast("ok", `کانفیگ ${acct.username}.ovpn دانلود شد`);
  };

  return (
    <div className="px-4 pb-6 pt-4">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="font-display text-[26px] leading-8">اکانت‌های من</h2>
          <p className="mt-1 text-[11.5px] text-mist-500">مصرف زنده از radacct — بدون ریست، بدون عددسازی</p>
        </div>
        <Chip tone="mist">{accounts.length > 0 ? `${accounts.length.toLocaleString("fa-IR")} اکانت` : "—"}</Chip>
      </div>

      {accounts.length === 0 && (
        <EmptyState
          icon={<IcKey className="h-6 w-6" />}
          title="هنوز اکانتی نداری"
          sub="از فروشگاه یک بسته بخر؛ اکانت در چند ثانیه روی FreeRADIUS ساخته می‌شود."
        />
      )}

      <div className="stagger space-y-4">
        {accounts.map((a) => {
          const p = pct(a.used_bytes, a.quota_bytes);
          const remain = Math.max(0, a.quota_bytes - a.used_bytes);
          const isRevealed = !!revealed[a.id];
          return (
            <div key={a.id} className="card anim-rise overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.06] bg-deep-900/60 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-lg border border-mint-500/25 bg-mint-500/10 text-mint-400">
                    <IcServer className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p dir="ltr" className="text-right font-mono text-[13.5px] font-bold">{a.username}</p>
                    <p className="mt-0.5 text-[10px] text-mist-500">
                      آلمان-۱ • گروه <span dir="ltr" className="font-mono">{a.group_name}</span>
                    </p>
                  </div>
                </div>
                {a.capped ? (
                  <Chip tone="coral">
                    <IcAlert className="h-3 w-3" />
                    پایان حجم
                  </Chip>
                ) : (
                  <Chip tone="mint">
                    <LiveDot className="h-1.5 w-1.5" />
                    متصل‌پذیر
                  </Chip>
                )}
              </div>

              <div className="space-y-4 px-4 py-4">
                {a.capped && (
                  <div className="flex items-center gap-2 rounded-lg border border-coral-500/30 bg-coral-500/10 px-3 py-2 text-[11px] font-bold text-coral-300">
                    <IcAlert className="h-4 w-4 shrink-0" />
                    حجم تمام شد — با تمدید، همین اکانت با حجم بیشتر ادامه می‌یابد
                  </div>
                )}

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-mist-500">
                      <LiveDot className="h-1.5 w-1.5" />
                      مصرف زنده
                    </span>
                    <span className="font-bold text-mist-300">
                      {gbOf(a.used_bytes)} از {gbOf(a.quota_bytes)} گیگ{" "}
                      <span className={a.capped ? "text-coral-300" : p > 85 ? "text-gold-300" : "text-mint-300"}>
                        ({p.toLocaleString("fa-IR")}٪)
                      </span>
                    </span>
                  </div>
                  <UsageBar used={a.used_bytes} quota={a.quota_bytes} capped={a.capped} />
                  <p className="mt-1.5 text-[10.5px] text-mist-500">
                    مانده: <b className="text-mint-300">{gbOf(remain)} گیگابایت</b> • انقضا:{" "}
                    <b className="text-mist-300">{faDate(a.expiration)}</b> ({daysLeftLabel(a.expiration)})
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-deep-950/60 px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] text-mist-500">رمز:</span>
                    <span dir="ltr" className="font-mono text-[13px] font-bold tracking-wide text-mist-100">
                      {isRevealed ? a.password : "••••••••••"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRevealed((r) => ({ ...r, [a.id]: !r[a.id] }))}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-mist-500 transition hover:border-mint-500/40 hover:text-mint-300 active:scale-90"
                      aria-label="نمایش رمز"
                    >
                      {isRevealed ? <IcEyeOff className="h-3.5 w-3.5" /> : <IcEye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(`${a.username}:${a.password}`);
                          toast("ok", "نام کاربری و رمز کپی شد");
                        } catch {
                          toast("err", "کپی در مرورگر شما ممکن نشد");
                        }
                      }}
                      className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-mist-500 transition hover:border-mint-500/40 hover:text-mint-300 active:scale-90"
                      aria-label="کپی رمز"
                    >
                      <IcCopy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Btn variant="ghost" full={false} className="flex-1 !py-2.5 text-[12px]" onClick={() => downloadOvpn(a.id)}>
                    <IcDownload className="h-4 w-4" />
                    کانفیگ OVPN
                  </Btn>
                  <Btn
                    variant="gold"
                    full={false}
                    className="flex-1 !py-2.5 text-[12px]"
                    onClick={() => {
                      setRenewFor(a.username);
                      setTab("shop");
                    }}
                  >
                    <IcRefresh className="h-4 w-4" />
                    تمدید
                  </Btn>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
