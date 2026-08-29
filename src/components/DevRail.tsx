import { useApp } from "../lib/store";
import * as api from "../lib/backend";
import { faNum, faTime } from "../lib/format";
import type { AuditKind, Role } from "../lib/types";
import { Btn, Chip, ConfirmBtn, Seg } from "./ui";
import { IcDb, IcPulse, IcRefresh, IcWrench } from "./icons";

const ROLE_OPTS: { id: Role; label: string }[] = [
  { id: "customer", label: "مشتری" },
  { id: "partner", label: "همکار" },
  { id: "admin", label: "مدیر" },
];

const DOT: Record<AuditKind, string> = {
  info: "bg-sky-350",
  success: "bg-mint-400",
  warn: "bg-gold-400",
  error: "bg-coral-400",
};

/** کنترل‌های مشترک لوکال — هم در ریل دسکتاپ، هم در شیت موبایل */
export function DevPanel() {
  const { snap, role, setRole, run, runSnap, refresh, toast } = useApp();

  const dupCallback = async () => {
    const res = await run(() => api.duplicateLastGatewayCallback());
    if (!res) return;
    toast(
      res.found ? "info" : "err",
      res.found
        ? "کال‌بک تکراری ارسال شد — در گزارش رویدادها ببینید که نادیده گرفته می‌شود"
        : "هنوز هیچ پرداخت درگاهی ثبت نشده است",
    );
  };

  const tick = () => {
    const s = api.tickUsage();
    if (s) {
      refresh(s);
      toast("info", "یک تیک radacct شبیه‌سازی شد — مصرف اکانت‌ها بالا رفت");
    } else {
      toast("info", "در این تیک مصرف جدیدی ثبت نشد");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <span className="lbl">نقش فعلی (سوئیچ دمو)</span>
        <Seg options={ROLE_OPTS} value={role} onChange={setRole} />
      </div>

      <div className="space-y-2">
        <Btn variant="ghost" onClick={() => void dupCallback()}>
          <IcRefresh className="h-4 w-4" />
          ارسال کال‌بک تکراری درگاه
        </Btn>
        <Btn variant="ghost" onClick={tick}>
          <IcPulse className="h-4 w-4" />
          تیک radacct (افزودن مصرف)
        </Btn>
        <ConfirmBtn
          label={
            <>
              <IcDb className="h-4 w-4" />
              ریست دیتابیس لوکال
            </>
          }
          confirmLabel="مطمئنی؟ همه داده‌ها از نو seed می‌شوند"
          variant="dark"
          className="w-full"
          onConfirm={() => void runSnap(() => api.apiReset(), "دیتابیس لوکال ریست شد")}
        />
      </div>

      <p className="rounded-lg border border-white/[0.06] bg-deep-900/70 px-3 py-2.5 text-[10px] leading-5 text-mist-500">
        این لایه، شبیه‌ساز همان API است که بک‌اند FastAPI روی سرور ارائه می‌دهد — پرداخت idempotent، پروویژن idempotent، ledger و audit. برای رفتن به سرور فقط آدرس API عوض می‌شود.
      </p>

      {snap && (
        <div className="grid grid-cols-3 gap-2">
          <MiniStat label="سفارش" val={faNum(snap.orders.length)} />
          <MiniStat label="اکانت" val={faNum(snap.accounts.length)} />
          <MiniStat label="رویداد" val={faNum(snap.audit.length)} />
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-mist-300">گزارش رویدادها (زنده)</span>
          <Chip tone="mint">audit</Chip>
        </div>
        <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-xl border border-white/[0.06] bg-deep-900/70 p-1.5">
          {snap?.audit.slice(0, 14).map((a, i) => (
            <div key={a.id} className={`flex items-start gap-2 rounded-lg px-2 py-1.5 ${i === 0 ? "anim-fade bg-white/[0.03]" : ""}`}>
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${DOT[a.kind]}`} />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[9.5px]">
                  <span dir="ltr" className="font-mono font-bold text-mist-300">{a.action}</span>
                  <span className="text-mist-500">{faTime(a.at)}</span>
                </p>
                <p className="mt-0.5 line-clamp-2 text-[9.5px] leading-4 text-mist-500">{a.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, val }: { label: string; val: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-deep-900/70 px-2 py-2 text-center">
      <p className="text-[15px] font-extrabold text-mint-300">{val}</p>
      <p className="mt-0.5 text-[9px] text-mist-500">{label}</p>
    </div>
  );
}

/** ریل مهندسی — فقط دسکتاپ */
export function DevRail() {
  return (
    <aside className="anim-rise hidden h-[min(880px,94vh)] w-[330px] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-deep-900/70 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-sm lg:flex">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-mint-500/25 bg-mint-500/10 text-mint-400">
            <IcWrench className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[13px] font-extrabold">پیشخوان مهندسی</p>
            <p className="text-[10px] text-mist-500">فقط محیط لوکال</p>
          </div>
        </div>
        <Chip tone="gold">localhost</Chip>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <DevPanel />
      </div>
    </aside>
  );
}
