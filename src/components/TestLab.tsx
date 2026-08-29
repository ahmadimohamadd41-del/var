import React, { useEffect, useState } from "react";
import { useStore, haptic } from "../lib/store";
import { fa } from "../lib/format";
import {
  Chip, CopyBtn, IcActivity, IcAlert, IcBolt, IcCheck, IcEye, IcEyeOff, IcLock, IcRefresh, IcSend, IcServer, IcTg, IcX, Reveal, SectionHead,
} from "./ui";

/* ---------------- helpers: real network calls ---------------- */

type Line = { t: string; k: "ok" | "err" | "info" | "cmd" };

async function tgCall(token: string, method: string, params?: Record<string, string>) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    const res = await fetch(`https://api.telegram.org/bot${token.trim()}/${method}${qs}`, { signal: ctrl.signal });
    return (await res.json()) as { ok: boolean; result?: unknown; description?: string };
  } catch (e) {
    return { ok: false, description: (e as Error).name === "AbortError" ? "timeout after 9s" : "network error — اینترنت را چک کنید" };
  } finally {
    clearTimeout(timer);
  }
}

async function pingApi(base: string, path: string) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  const t0 = performance.now();
  try {
    const res = await fetch(base.replace(/\/+$/, "") + path, { signal: ctrl.signal });
    return { ok: res.ok, status: res.status, ms: Math.round(performance.now() - t0), err: "" };
  } catch (e) {
    return { ok: false, status: 0, ms: Math.round(performance.now() - t0), err: (e as Error).name === "AbortError" ? "timeout" : "unreachable/CORS" };
  } finally {
    clearTimeout(timer);
  }
}

const LS_TOKEN = "var_bot_token";
const LS_CHECKS = "var_radius_checklist";
const TOKEN_RE = /^\d{6,}:[\w-]{30,}$/;

/* ---------------- terminal output ---------------- */

function Term({ lines }: { lines: Line[] }) {
  if (lines.length === 0) return null;
  const color = (k: Line["k"]) => (k === "ok" ? "text-mint-400" : k === "err" ? "text-coral-400" : k === "cmd" ? "text-sky-350" : "text-mist-500");
  return (
    <div dir="ltr" className="mt-3 rounded-lg bg-deep-950 border border-mint-400/10 p-3 font-mono text-[0.66rem] leading-5 max-h-52 overflow-y-auto text-left">
      {lines.map((l, i) => (
        <p key={i} className={`${color(l.k)} break-all`}>
          {l.k === "cmd" ? "$ " : l.k === "ok" ? "✓ " : l.k === "err" ? "✗ " : "· "}
          {l.t}
        </p>
      ))}
      <span className="anim-blink text-mint-400">▊</span>
    </div>
  );
}

/* ---------------- copyable shell command ---------------- */

function Cmd({ label, code }: { label: string; code: string }) {
  return (
    <div className="rounded-lg bg-deep-900/80 border border-mint-400/10 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-mint-400/8">
        <span className="text-[0.68rem] text-mist-400 font-medium">{label}</span>
        <CopyBtn text={code} />
      </div>
      <pre dir="ltr" className="px-3 py-2.5 font-mono text-[0.66rem] text-mint-300/95 overflow-x-auto whitespace-pre leading-5 text-left">
        {code}
      </pre>
    </div>
  );
}

/* ---------------- pre-provision checklist (from architecture doc) ---------------- */

const CHECK_ITEMS = [
  "بکاپ کامل از دیتابیس radius",
  "ساخت کاربر آزمایشی (test_var) — نه کاربر واقعی",
  "تأیید ساخت اکانت (radcheck / radusergroup)",
  "تأیید تغییر گروه (radgroupcheck موجود باشد)",
  "تأیید انقضا (Expiration در radreply)",
  "تأیید خواندن مصرف از radacct",
  "تأیید تمدید: سهمیه جمع شود، مصرف ریست نشود",
  "تأیید رفتار rollback در خطای provisioning",
];

/* ============================= MAIN COMPONENT ============================= */

export default function TestLab() {
  const { state } = useStore();

  /* --- telegram bot --- */
  const [token, setToken] = useState(() => localStorage.getItem(LS_TOKEN) ?? "");
  const [showToken, setShowToken] = useState(false);
  const [busy, setBusy] = useState("");
  const [log, setLog] = useState<Line[]>([]);
  const [chatId, setChatId] = useState("");
  const [msg, setMsg] = useState("تست از VAR VPN ✦");

  /* --- backend ping --- */
  const [apiBase, setApiBase] = useState(state.settings.apiBase);
  const [pingLog, setPingLog] = useState<Line[]>([]);

  /* --- checklist --- */
  const [checks, setChecks] = useState<boolean[]>(() => {
    try {
      const s = JSON.parse(localStorage.getItem(LS_CHECKS) ?? "null");
      if (Array.isArray(s) && s.length === CHECK_ITEMS.length) return s;
    } catch {
      /* ignore */
    }
    return CHECK_ITEMS.map(() => false);
  });
  useEffect(() => {
    localStorage.setItem(LS_CHECKS, JSON.stringify(checks));
  }, [checks]);

  const push = (l: Line) => setLog((p) => [...p.slice(-40), l]);

  const validToken = TOKEN_RE.test(token.trim());

  const runTg = async (method: string, params?: Record<string, string>, echo?: string) => {
    if (!validToken) {
      setLog([{ t: "invalid bot token format — توکن BotFather مثل 123456:ABC-... است", k: "err" }]);
      return;
    }
    setBusy(method);
    push({ t: echo ?? method, k: "cmd" });
    const r = await tgCall(token, method, params);
    if (!r.ok) {
      push({ t: r.description ?? "request failed", k: "err" });
      setBusy("");
      return;
    }
    const res = r.result as Record<string, unknown> | unknown[];
    if (method === "getMe") {
      const u = res as { username?: string; first_name?: string; id?: number };
      push({ t: `connected → @${u.username} (${u.first_name}) id=${u.id}`, k: "ok" });
    } else if (method === "getWebhookInfo") {
      const w = res as { url?: string; pending_update_count?: number; last_error_message?: string };
      push({ t: w.url ? `webhook: ${w.url} — pending=${w.pending_update_count}` : "no webhook set (polling mode)", k: "ok" });
      if (w.last_error_message) push({ t: `last_error: ${w.last_error_message}`, k: "err" });
    } else if (method === "getUpdates") {
      const arr = (res as unknown[]).slice(-3);
      push({ t: `${(res as unknown[]).length} update(s) in queue`, k: "ok" });
      arr.forEach((u) => {
        const m = (u as { message?: { text?: string; from?: { username?: string } } }).message;
        if (m) push({ t: `msg from @${m.from?.username ?? "?"}: "${(m.text ?? "").slice(0, 60)}"`, k: "info" });
      });
    } else if (method === "sendMessage") {
      const m = res as { message_id?: number };
      push({ t: `sent — message_id=${m.message_id}`, k: "ok" });
    }
    setBusy("");
  };

  const doPing = async (path: string) => {
    setBusy(`ping${path}`);
    setPingLog((p) => [...p, { t: `GET ${apiBase}${path}`, k: "cmd" }]);
    const r = await pingApi(apiBase, path);
    setPingLog((p) =>
      [...p, r.ok ? { t: `HTTP ${r.status} — ${r.ms}ms`, k: "ok" as const } : { t: `failed (${r.err}) — بک‌اند لوکال روشن است؟`, k: "err" as const }].slice(-30)
    );
    setBusy("");
  };

  const doneCount = checks.filter(Boolean).length;

  return (
    <div>
      {/* ---------- 1) local run + tunnel ---------- */}
      <Reveal>
        <SectionHead title="اجرای لوکال و بازکردن داخل تلگرام" icon={<IcBolt className="w-5 h-5" />} />
        <div className="card px-4 py-4 space-y-3">
          {[
            { n: "۱", t: "اپ همین حالا در مرورگر اجراست (Mock API). برای حالت توسعه:", c: "npm install && npm run dev" },
            { n: "۲", t: "تلگرام فقط URL با HTTPS قبول می‌کند — با تونل، لوکال را عمومی کنید:", c: "ngrok http 5173\n# یا\ncloudflared tunnel --url http://localhost:5173" },
            { n: "۳", t: "در BotFather مسیر زیر را بروید و URL تونل را بدهید:", c: "/mybots → Bot Settings → Menu Button\n→ Configure menu button → paste https://…" },
            { n: "۴", t: "هویت واقعی کاربر (initData) سمت بک‌اند FastAPI اعتبارسنجی می‌شود؛ تا آن موقع با سوییچ کاربر دمو تست کنید.", c: "" },
          ].map((s) => (
            <div key={s.n} className="flex gap-3">
              <span className="w-7 h-7 rounded-lg bg-gold-500/15 text-gold-300 font-display text-base flex items-center justify-center shrink-0">{s.n}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[0.72rem] text-mist-300 leading-6">{s.t}</p>
                {s.c && (
                  <div className="mt-1.5">
                    <Cmd label="" code={s.c} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ---------- 2) real Telegram bot test ---------- */}
      <Reveal delay={70}>
        <SectionHead title="تست واقعی بات (توکن BotFather)" sub="مستقیم از مرورگر" icon={<IcTg className="w-5 h-5" />} />
        <div className="card px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <IcLock className="w-4 h-4 text-gold-400 shrink-0" />
            <p className="text-[0.68rem] text-mist-500 leading-5">
              توکن فقط در <b className="text-mist-300">localStorage مرورگر خودتان</b> ذخیره و فقط به <code dir="ltr">api.telegram.org</code> فرستاده می‌شود —
              جای دیگری نمی‌رود.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                dir="ltr"
                type={showToken ? "text" : "password"}
                className="input !pr-9 font-mono !text-[0.72rem]"
                placeholder="123456789:AA…"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  localStorage.setItem(LS_TOKEN, e.target.value);
                }}
              />
              <button className="absolute left-2.5 top-1/2 -translate-y-1/2 text-mist-500 hover:text-mist-200 transition-colors cursor-pointer" onClick={() => setShowToken(!showToken)} aria-label="نمایش توکن">
                {showToken ? <IcEyeOff className="w-4 h-4" /> : <IcEye className="w-4 h-4" />}
              </button>
            </div>
            {token && (
              <button
                className="btn btn-ghost px-3"
                onClick={() => {
                  setToken("");
                  localStorage.removeItem(LS_TOKEN);
                  setLog([]);
                  haptic("tap");
                }}
              >
                <IcX className="w-4 h-4" />
              </button>
            )}
          </div>
          {token && !validToken && (
            <p className="text-[0.66rem] text-coral-300 mt-1.5 flex items-center gap-1">
              <IcAlert className="w-3.5 h-3.5" />
              فرمت توکن درست نیست — از BotFather → /mybots → API Token کپی کنید.
            </p>
          )}

          <div className="grid grid-cols-3 gap-2 mt-3">
            <button className="btn btn-mint py-2.5 text-xs" disabled={!validToken || busy !== ""} onClick={() => runTg("getMe", undefined, "getMe")}>
              {busy === "getMe" ? <IcRefresh className="w-4 h-4 anim-spin-slow" /> : <IcCheck className="w-4 h-4" />}
              اتصال (getMe)
            </button>
            <button className="btn btn-ghost py-2.5 text-xs" disabled={!validToken || busy !== ""} onClick={() => runTg("getWebhookInfo", undefined, "getWebhookInfo")}>
              {busy === "getWebhookInfo" ? <IcRefresh className="w-4 h-4 anim-spin-slow" /> : <IcActivity className="w-4 h-4" />}
              وب‌هوک
            </button>
            <button className="btn btn-ghost py-2.5 text-xs" disabled={!validToken || busy !== ""} onClick={() => runTg("getUpdates", undefined, "getUpdates")}>
              {busy === "getUpdates" ? <IcRefresh className="w-4 h-4 anim-spin-slow" /> : <IcActivity className="w-4 h-4" />}
              پیام‌ها
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-mint-400/8">
            <p className="text-[0.68rem] text-mist-500 mb-2">ارسال پیام آزمایشی (chat_id را از @userinfobot یا getUpdates بگیرید):</p>
            <div className="flex gap-2">
              <input dir="ltr" className="input num-input !text-[0.72rem] font-mono" placeholder="chat_id" value={chatId} onChange={(e) => setChatId(e.target.value)} />
              <input className="input flex-1 !text-[0.72rem]" placeholder="متن پیام" value={msg} onChange={(e) => setMsg(e.target.value)} />
              <button
                className="btn btn-gold px-3.5"
                disabled={!validToken || !chatId.trim() || !msg.trim() || busy !== ""}
                onClick={() => runTg("sendMessage", { chat_id: chatId.trim(), text: msg.trim() }, `sendMessage → ${chatId.trim()}`)}
              >
                {busy === "sendMessage" ? <IcRefresh className="w-4 h-4 anim-spin-slow" /> : <IcSend className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Term lines={log} />
        </div>
      </Reveal>

      {/* ---------- 3) backend ping ---------- */}
      <Reveal delay={110}>
        <SectionHead title="بک‌اند FastAPI (وقتی بالا آمد)" icon={<IcServer className="w-5 h-5" />} />
        <div className="card px-4 py-4">
          <input dir="ltr" className="input font-mono !text-[0.72rem]" value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button className="btn btn-mint py-2.5 text-xs" disabled={busy !== ""} onClick={() => doPing("/healthz")}>
              {busy === "ping/healthz" ? <IcRefresh className="w-4 h-4 anim-spin-slow" /> : <IcActivity className="w-4 h-4" />}
              ping /healthz
            </button>
            <button className="btn btn-ghost py-2.5 text-xs" disabled={busy !== ""} onClick={() => doPing("/api/v1/products")}>
              {busy === "ping/api/v1/products" ? <IcRefresh className="w-4 h-4 anim-spin-slow" /> : <IcActivity className="w-4 h-4" />}
              محصولات
            </button>
          </div>
          <Term lines={pingLog} />
          <p className="text-[0.66rem] text-mist-600 mt-2 leading-5">
            تا وقتی بک‌اند بالا نیامده، اپ با Mock API کار می‌کند — این ping فقط برای روزی است که FastAPI را لوکال اجرا کنید.
          </p>
        </div>
      </Reveal>

      {/* ---------- 4) RADIUS real tests ---------- */}
      <Reveal delay={150}>
        <SectionHead title="تست واقعی FreeRADIUS روی VPS" icon={<IcServer className="w-5 h-5" />} />
        <div className="card !border-gold-500/25 px-4 py-4 mb-3">
          <div className="flex gap-2.5">
            <IcAlert className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
            <p className="text-[0.7rem] text-mist-300 leading-6">
              <b className="text-gold-300">daloRADIUS API رسمی REST ندارد</b> — یک رابط PHP روی همان دیتابیس است. نقطه اتصال درست (طبق سند معماری) خود
              دیتابیس <code dir="ltr" className="text-mint-300">radius</code> در MariaDB با یک یوزر محدود (<code dir="ltr" className="text-mint-300">var_app</code>) است +
              ابزار <code dir="ltr" className="text-mint-300">radtest</code> برای بررسی enforce. این دستورات را روی کنترل‌VPS بزنید:
            </p>
          </div>
        </div>
        <div className="space-y-2.5">
          <Cmd label="۰) بکاپ قبل از هر نوشتن (اجباری)" code={"mariadb-dump radius > ~/backups/radius_$(date +%F_%H%M).sql"} />
          <Cmd label="۱) تست Access-Accept کاربر آزمایشی" code={"radtest test_var <PASS> 127.0.0.1 1812 <CLIENT_SECRET>\n# secret از /etc/freeradius/3.0/clients.conf"} />
          <Cmd label="۲) بررسی گروه‌ها (radgroupcheck — فقط سهمیه)" code={"mysql radius -e \"SELECT groupname, attribute, value\nFROM radgroupcheck WHERE groupname LIKE 'G%';\""} />
          <Cmd label="۳) مصرف واقعی از radacct (منبع حقیقت)" code={"mysql radius -e \"SELECT username,\nROUND(SUM(acctinputoctets+acctoutputoctets)/1073741824,2) AS gb\nFROM radacct WHERE username='test_var'\nGROUP BY username;\""} />
          <Cmd label="۴) بررسی گروه کاربر" code={"mysql radius -e \"SELECT * FROM radusergroup WHERE username='test_var';\""} />
        </div>

        {/* checklist */}
        <div className="card px-4 py-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-mist-100">چک‌لیست قبل از نوشتن روی RADIUS تولیدی</p>
            <Chip tone={doneCount === CHECK_ITEMS.length ? "mint" : "gold"}>
              {fa(doneCount)} از {fa(CHECK_ITEMS.length)}
            </Chip>
          </div>
          <div className="h-1.5 rounded-full bg-deep-700 overflow-hidden mb-3">
            <div className="h-full rounded-full bg-gradient-to-l from-gold-400 to-mint-400 transition-all duration-500" style={{ width: `${(doneCount / CHECK_ITEMS.length) * 100}%` }} />
          </div>
          <div className="space-y-1.5">
            {CHECK_ITEMS.map((item, i) => (
              <button
                key={item}
                onClick={() => {
                  haptic("tap");
                  setChecks((p) => p.map((c, j) => (j === i ? !c : c)));
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all cursor-pointer ${
                  checks[i] ? "border-mint-500/40 bg-mint-500/8" : "border-mint-400/8 bg-deep-900/50 hover:border-mint-400/25"
                }`}
              >
                <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${checks[i] ? "bg-mint-500 border-mint-500 text-deep-950" : "border-deep-500"}`}>
                  {checks[i] && <IcCheck className="w-3 h-3" />}
                </span>
                <span className={`text-[0.72rem] text-right flex-1 ${checks[i] ? "text-mist-500 line-through" : "text-mist-200"}`}>{item}</span>
              </button>
            ))}
          </div>
          {doneCount === CHECK_ITEMS.length && (
            <p className="anim-pop text-[0.7rem] text-mint-300 mt-3 flex items-center gap-1.5">
              <IcCheck className="w-4 h-4" />
              همه مراحل تأیید شد — نوشتن روی RADIUS تولیدی مجاز است.
            </p>
          )}
        </div>
      </Reveal>

      {/* ---------------- 5) deploy roadmap ---------------- */}
      <Reveal delay={120}>
        <SectionHead title="مسیر استقرار روی سرور" sub="Docker + Git" icon={<IcServer className="w-5 h-5" />} />
        <div className="space-y-2.5">
          <Cmd label="۱) لوکال: گیت و پوش کردن (فایل .env هرگز گیت نمی‌شود)" code={"git init && git add -A && git commit -m \"var-vpn web\"\ngit remote add origin git@github.com:YOU/var-vpn.git\ngit push -u origin main"} />
          <Cmd label="۲) سرور: نصب Docker (یک‌بار)" code={"curl -fsSL https://get.docker.com | sh\nsudo usermod -aG docker $USER"} />
          <Cmd label="۳) سرور: کلون و اجرا (کانتینر varvpn-web روی پورت ۸۰۹۰)" code={"cd /opt && git clone git@github.com:YOU/var-vpn.git\ncd var-vpn && cp .env.example .env   # و مقادیر واقعی\ndocker compose up -d --build web\ncurl http://127.0.0.1:8090/healthz"} />
          <Cmd label="۴) سرور: دامنه + HTTPS با vhost جدید (دست به vhost دالاردیوس نزنید)" code={"# /etc/nginx/sites-available/varvpn → proxy_pass http://127.0.0.1:8090\nsudo ln -s /etc/nginx/sites-available/varvpn /etc/nginx/sites-enabled/\nsudo nginx -t && sudo systemctl reload nginx\nsudo certbot --nginx -d app.yourdomain.com"} />
          <Cmd label="۵) تلگرام: BotFather → /mybots → Bot Settings → Menu Button" code={"Configure Menu Button → https://app.yourdomain.com\nعنوان: VAR VPN — سپس t.me/YOUR_BOT را باز کنید"} />
          <Cmd label="۶) آپدیت‌های بعدی: فقط این (یا scripts/deploy.sh)" code={"cd /opt/var-vpn && ./scripts/deploy.sh"} />
        </div>

        {/* بدون دامنه و SSL — راه‌حل رایگان */}
        <div className="card !border-sky-350/30 px-4 py-3.5 mt-3">
          <p className="text-sm font-bold text-sky-350 flex items-center gap-2 mb-2">
            <IcLock className="w-4 h-4" />
            دامنه و SSL نداری؟ راه‌حل کاملاً رایگان
          </p>
          <p className="text-[0.68rem] leading-6 text-mist-400 mb-2.5">
            تلگرام برای بازکردن مینی‌اپ حتماً <b className="text-mist-200">HTTPS</b> می‌خواهد. با <b className="text-sky-350">DuckDNS</b> یک زیردامنه رایگان و با{" "}
            <b className="text-sky-350">Let's Encrypt</b> گواهی SSL رایگان می‌گیری — بدون خرید دامنه:
          </p>
          <div className="space-y-2">
            <Cmd label="الف) ساخت زیردامنه رایگان در duckdns.org (با اکانت گوگل/گیت‌هاب)" code={"# بعد از ساخت myvpn.duckdns.org، روی سرور:\necho 'YOUR_DUCKDNS_TOKEN' > ~/duck.token"} />
            <Cmd label="ب) آپدیت خودکار IP (هر ۵ دقیقه — cron)" code={"crontab -e\n# این خط را اضافه کن:\n*/5 * * * * curl \"https://www.duckdns.org/update?domains=myvpn&token=$(cat ~/duck.token)&ip=\" >/dev/null 2>&1"} />
            <Cmd label="ج) دریافت SSL رایگان برای همان زیردامنه" code={"sudo certbot certonly --standalone -d myvpn.duckdns.org\n# یا با nginx:  sudo certbot --nginx -d myvpn.duckdns.org"} />
            <Cmd label="د) در BotFather → Menu Button آدرس https را بگذار" code={"https://myvpn.duckdns.org"} />
          </div>
        </div>

        <div className="card !border-coral-500/30 px-4 py-3 mt-3 flex gap-2.5">
          <IcAlert className="w-4 h-4 text-coral-300 shrink-0 mt-0.5" />
          <p className="text-[0.68rem] leading-5 text-mist-400">
            <b className="text-coral-300">خط قرمزها:</b> هرگز <code dir="ltr" className="text-mist-300">docker compose down</code> روی سرویس‌های موجود نزنید، به
            کانتینر دالاردیوس و FreeRADIUS هاست دست نزنید، و <code dir="ltr" className="text-mist-300">.env</code> را گیت نکنید. راهنمای کامل:{" "}
            <code dir="ltr" className="text-mint-300">docs/DEPLOY.md</code> در مخزن.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
