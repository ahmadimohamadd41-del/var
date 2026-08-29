import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import type {
  Account,
  AppState,
  AuditKind,
  Order,
  Payment,
  Product,
  PurchaseInput,
  PurchaseResult,
  Settings,
  User,
} from "./types";
import { seed, SEED_VERSION } from "./seed";
import { GB, genPassword, money, uid } from "./format";

const KEY = "varvpn:state";
const DAY = 86_400_000;

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as AppState;
      if (s && s.v === SEED_VERSION && Array.isArray(s.users)) return s;
    }
  } catch {
    /* state خراب → seed دوباره */
  }
  return seed();
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function audit(s: AppState, actor: string, action: string, detail: string, kind: AuditKind) {
  s.audit.unshift({ id: uid("aud"), at: Date.now(), actor, action, detail, kind });
  if (s.audit.length > 250) s.audit.length = 250;
}

export interface Toast {
  id: number;
  msg: string;
  kind: "ok" | "err" | "info";
}

export function haptic(type: "tap" | "ok" | "err" = "tap") {
  try {
    const tg = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { impactOccurred: (s: string) => void; notificationOccurred: (s: string) => void } } } }).Telegram?.WebApp?.HapticFeedback;
    if (!tg) return;
    if (type === "tap") tg.impactOccurred("light");
    else tg.notificationOccurred(type === "ok" ? "success" : "error");
  } catch {
    /* بدون تلگرام — بی‌صدا */
  }
}

export function initTelegram() {
  try {
    const w = (window as unknown as { Telegram?: { WebApp?: { ready: () => void; expand: () => void; setHeaderColor?: (c: string) => void; setBackgroundColor?: (c: string) => void } } }).Telegram?.WebApp;
    if (!w) return;
    w.ready();
    w.expand();
    w.setHeaderColor?.("#081b22");
    w.setBackgroundColor?.("#06141a");
  } catch {
    /* ignore */
  }
}

interface Api {
  purchase: (input: PurchaseInput) => Promise<PurchaseResult>;
  confirmPayment: (paymentId: string, approve: boolean) => Promise<{ ok: boolean; already?: boolean; error?: string }>;
  decidePartner: (requestId: string, approve: boolean) => Promise<{ ok: boolean }>;
  walletAdjust: (userId: string, delta: number, reason: string) => Promise<{ ok: boolean; error?: string }>;
  updateProduct: (id: string, patch: Partial<Pick<Product, "price" | "active">>) => Promise<{ ok: boolean }>;
  updateSettings: (patch: Partial<Settings>) => Promise<{ ok: boolean }>;
  requestPartner: (note: string) => Promise<{ ok: boolean; error?: string }>;
  healthCheck: () => Promise<{ radiusMs: number; dbMs: number; workerMs: number; serverMs: number; at: number }>;
}

interface StoreCtx {
  state: AppState;
  me: User;
  toasts: Toast[];
  toast: (msg: string, kind?: Toast["kind"]) => void;
  dismissToast: (id: number) => void;
  switchUser: (id: string) => void;
  resetDemo: () => void;
  api: Api;
}

const Ctx = createContext<StoreCtx | null>(null);

export function useStore(): StoreCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside provider");
  return v;
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota — ignore */
    }
  }, [state]);

  const clone = () => structuredClone(stateRef.current);
  const commit = (next: AppState) => setState(next);

  const toast = (msg: string, kind: Toast["kind"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, msg, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  };
  const dismissToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  /** ساخت اکانت RADIUS — فقط اگر گروه از قبل موجود باشد */
  function newAccount(s: AppState, ownerId: string, product: Product, opts: { soldBy?: string; customerName?: string } = {}): Account {
    const owner = s.users.find((u) => u.id === ownerId)!;
    const num = Math.floor(1000 + Math.random() * 9000);
    return {
      id: uid("acc"),
      ownerId,
      soldBy: opts.soldBy,
      customerName: opts.customerName,
      radiusUsername: `var_${owner.tgId.slice(-4)}${num}`,
      radiusPassword: genPassword(10),
      serverId: "germany-1",
      groupId: product.groupId,
      quotaBytes: product.quotaGb * GB,
      usedBytes: 0,
      expiresAt: Date.now() + product.durationDays * DAY,
      createdAt: Date.now(),
      historyGb: [0, 0, 0, 0, 0, 0, 0],
    };
  }

  /** provisioning آیدمپوتنت — خروجی تکراری هرگز ساخته نمی‌شود */
  async function provision(orderId: string): Promise<PurchaseResult> {
    await delay(650);
    const s = clone();
    const order = s.orders.find((o) => o.id === orderId);
    if (!order) return { ok: false, orderId, status: "failed", error: "سفارش پیدا نشد" };
    if (order.status === "active") {
      return { ok: true, orderId, status: "active", accounts: s.accounts.filter((a) => order.accountIds.includes(a.id)) };
    }
    const product = s.products.find((p) => p.id === order.productId);
    if (!product) return { ok: false, orderId, status: "failed", error: "محصول حذف شده است" };

    order.status = "provisioning";
    commit(s);
    await delay(750);

    const s2 = clone();
    const order2 = s2.orders.find((o) => o.id === orderId)!;
    const prod2 = s2.products.find((p) => p.id === order2.productId)!;

    // قانون ۹: گروه RADIUS ناموجود → شکست امن، بدون ساخت خودکار گروه
    const missing =
      !s2.availableGroups.includes(prod2.groupId) ||
      (s2.settings.simulateMissingGroup && prod2.groupId === "G50");

    if (missing) {
      order2.status = "failed";
      order2.failReason = `گروه ${prod2.groupId} در FreeRADIUS وجود ندارد`;
      const pay = s2.payments.find((p) => p.orderId === orderId);
      if (pay?.method === "wallet") {
        const w = s2.wallets.find((x) => x.userId === order2.userId);
        if (w) {
          w.balance += order2.total;
          w.ledger.unshift({
            id: uid("led"),
            userId: order2.userId,
            delta: order2.total,
            balanceAfter: w.balance,
            reason: `بازپرداخت خودکار سفارش ناموفق #${orderId.slice(-6)}`,
            actor: "سیستم",
            at: Date.now(),
          });
        }
        audit(s2, "سیستم", "بازپرداخت کیف پول", `${money(order2.total)} — سفارش #${orderId.slice(-6)}`, "money");
      } else if (pay?.method === "gateway") {
        audit(s2, "سیستم", "درخواست بازپرداخت", `ارسال درخواست reversal به درگاه برای سفارش #${orderId.slice(-6)}`, "money");
      }
      audit(s2, "سیستم", "شکست provisioning", `${order2.failReason} — گروه خودکار ساخته نشد (قانون ۹)`, "danger");
      commit(s2);
      return { ok: false, orderId, status: "failed", failReason: order2.failReason };
    }

    const created: Account[] = [];
    for (let i = 0; i < order2.qty; i++) {
      if (!order2.forCustomer) {
        // خرید شخصی: کاربر موجود复用 (قانون ۸) — تمدید = افزودن سهمیه (قانون ۵)
        const existing = s2.accounts.find((a) => a.ownerId === order2.userId && !a.soldBy && a.serverId === order2.serverId);
        if (existing) {
          existing.quotaBytes += prod2.quotaGb * GB; // مصرف هرگز ریست نمی‌شود (قانون ۴)
          existing.groupId = prod2.groupId;
          existing.expiresAt = Date.now() + prod2.durationDays * DAY; // قانون ۷
          created.push(existing);
          audit(
            s2,
            "سیستم",
            "تمدید اکانت",
            `${existing.radiusUsername} → سهمیه جدید ${Math.round(existing.quotaBytes / GB)}GB (مصرف حفظ شد)`,
            "info"
          );
        } else {
          const acc = newAccount(s2, order2.userId, prod2);
          s2.accounts.unshift(acc);
          created.push(acc);
          audit(s2, "سیستم", "ساخت اکانت RADIUS", `${acc.radiusUsername} در گروه ${prod2.groupId} روی آلمان ۱`, "security");
        }
      } else {
        // فروش همکار: اکانت به‌محض وجود مشتری ساخته می‌شود (قانون ۱۳)
        const acc = newAccount(s2, order2.userId, prod2, { soldBy: order2.userId, customerName: order2.forCustomer });
        s2.accounts.unshift(acc);
        created.push(acc);
        audit(s2, "سیستم", "ساخت اکانت (فروش همکار)", `مشتری: ${order2.forCustomer} — ${prod2.name} → ${acc.radiusUsername}`, "info");
      }
    }

    order2.status = "active";
    order2.accountIds = created.map((a) => a.id);
    audit(s2, "سیستم", "provisioning کامل شد", `سفارش #${orderId.slice(-6)} — ${created.length} اکانت روی آلمان ۱ فعال شد`, "info");
    commit(s2);
    return { ok: true, orderId, status: "active", accounts: created };
  }

  const api: Api = {
    async purchase(input) {
      await delay(550);
      const s = clone();
      const me = s.users.find((u) => u.id === s.currentUserId)!;
      const product = s.products.find((p) => p.id === input.productId);
      if (!product || !product.active) return { ok: false, orderId: "", status: "failed", error: "این محصول در دسترس نیست" };

      const qty = Math.max(1, Math.min(10, input.qty ?? 1));
      const total = product.price * qty;
      const method = input.method;

      if (method === "gateway" && !s.settings.gatewayEnabled)
        return { ok: false, orderId: "", status: "failed", error: "درگاه پرداخت موقتاً غیرفعال است" };

      if (method === "wallet") {
        const w = s.wallets.find((x) => x.userId === me.id);
        if (!w || w.balance < total)
          return { ok: false, orderId: "", status: "failed", error: "موجودی کیف پول کافی نیست — از مدیر شارژ بخواهید" };
      }

      const idemKey = uid("idem");
      const orderId = uid("ord");
      const paymentId = uid("pay");

      const order: Order = {
        id: orderId,
        userId: me.id,
        productId: product.id,
        serverId: "germany-1",
        qty,
        total,
        payMethod: method,
        status: method === "card" ? "awaiting_payment" : "provisioning",
        createdAt: Date.now(),
        forCustomer: input.forCustomer,
        accountIds: [],
        idemKey,
      };
      const payment: Payment = {
        id: paymentId,
        orderId,
        userId: me.id,
        amount: total,
        method,
        status: method === "card" ? "pending" : "confirmed",
        receiptName: input.receiptName,
        createdAt: Date.now(),
        decidedAt: method !== "card" ? Date.now() : undefined,
        decidedBy: method === "wallet" ? "کیف پول همکار" : method === "gateway" ? "درگاه پرداخت" : undefined,
        idemKey,
      };
      s.orders.unshift(order);
      s.payments.unshift(payment);

      if (method === "wallet") {
        const w = s.wallets.find((x) => x.userId === me.id)!;
        w.balance -= total;
        w.ledger.unshift({
          id: uid("led"),
          userId: me.id,
          delta: -total,
          balanceAfter: w.balance,
          reason: `خرید ${product.name} ×${qty}${input.forCustomer ? ` برای مشتری «${input.forCustomer}»` : ""}`,
          actor: me.name,
          at: Date.now(),
        });
        audit(s, me.name, "کسر از کیف پول", `${money(total)} — ${product.name} ×${qty}`, "money");
      }
      audit(
        s,
        me.name,
        "ثبت سفارش",
        `${product.name} ×${qty} — ${money(total)} — ${method === "gateway" ? "درگاه" : method === "card" ? "کارت‌به‌کارت" : "کیف پول"}${input.forCustomer ? ` برای ${input.forCustomer}` : ""}`,
        "info"
      );
      commit(s);

      if (method === "card") return { ok: true, orderId, paymentId, status: "awaiting_payment" };
      return provision(orderId);
    },

    async confirmPayment(paymentId, approve) {
      await delay(450);
      const s = clone();
      const pay = s.payments.find((p) => p.id === paymentId);
      if (!pay) return { ok: false, error: "پرداخت پیدا نشد" };
      // آیدمپوتنسی: callback تکراری اثری ندارد (قانون ۱۴)
      if (pay.status !== "pending") return { ok: false, already: true, error: "این پرداخت قبلاً تعیین تکلیف شده — callback تکراری نادیده گرفته شد" };

      const me = s.users.find((u) => u.id === s.currentUserId)!;
      pay.decidedAt = Date.now();
      pay.decidedBy = me.name;

      if (!approve) {
        pay.status = "rejected";
        const order = s.orders.find((o) => o.id === pay.orderId);
        if (order) {
          order.status = "failed";
          order.failReason = "فیش پرداخت توسط مدیر تأیید نشد";
        }
        audit(s, me.name, "رد فیش پرداخت", `${money(pay.amount)} — سفارش #${pay.orderId.slice(-6)}`, "danger");
        commit(s);
        return { ok: true };
      }

      pay.status = "confirmed";
      audit(s, me.name, "تأیید فیش پرداخت", `${money(pay.amount)} — سفارش #${pay.orderId.slice(-6)}`, "money");
      commit(s);
      await provision(pay.orderId);
      return { ok: true };
    },

    async decidePartner(requestId, approve) {
      await delay(400);
      const s = clone();
      const req = s.partnerRequests.find((r) => r.id === requestId);
      if (!req || req.status !== "pending") return { ok: false };
      const me = s.users.find((u) => u.id === s.currentUserId)!;
      const user = s.users.find((u) => u.id === req.userId)!;
      req.status = approve ? "approved" : "rejected";
      req.decidedAt = Date.now();
      if (approve) {
        user.role = "partner";
        if (!s.wallets.some((w) => w.userId === user.id)) {
          s.wallets.push({ userId: user.id, balance: 0, ledger: [] });
        }
        audit(s, me.name, "تأیید همکار", `${user.name} به‌عنوان همکار فعال شد — حداقل موجودی ${money(s.settings.minPartnerBalance)}`, "info");
      } else {
        audit(s, me.name, "رد درخواست همکاری", user.name, "info");
      }
      commit(s);
      return { ok: true };
    },

    async walletAdjust(userId, delta, reason) {
      await delay(400);
      const s = clone();
      const me = s.users.find((u) => u.id === s.currentUserId)!;
      const user = s.users.find((u) => u.id === userId);
      if (!user) return { ok: false, error: "کاربر پیدا نشد" };
      if (!reason || reason.trim().length < 4) return { ok: false, error: "دلیل عملیات الزامی است (حداقل ۴ حرف)" };
      let w = s.wallets.find((x) => x.userId === userId);
      if (!w) {
        w = { userId, balance: 0, ledger: [] };
        s.wallets.push(w);
      }
      w.balance += delta;
      w.ledger.unshift({
        id: uid("led"),
        userId,
        delta,
        balanceAfter: w.balance,
        reason: reason.trim(),
        actor: me.name,
        at: Date.now(),
      });
      audit(s, me.name, delta >= 0 ? "شارژ کیف پول" : "کسر از کیف پول", `${money(Math.abs(delta))} برای ${user.name} — ${reason.trim()}`, "money");
      commit(s);
      return { ok: true };
    },

    async updateProduct(id, patch) {
      await delay(300);
      const s = clone();
      const me = s.users.find((u) => u.id === s.currentUserId)!;
      const p = s.products.find((x) => x.id === id);
      if (!p) return { ok: false };
      if (patch.price !== undefined) p.price = Math.max(0, Math.round(patch.price));
      if (patch.active !== undefined) p.active = patch.active;
      audit(s, me.name, "ویرایش محصول", `${p.name} — قیمت ${money(p.price)} — ${p.active ? "فعال" : "غیرفعال"}`, "info");
      commit(s);
      return { ok: true };
    },

    async updateSettings(patch) {
      await delay(300);
      const s = clone();
      const me = s.users.find((u) => u.id === s.currentUserId)!;
      s.settings = { ...s.settings, ...patch };
      audit(s, me.name, "تغییر تنظیمات", Object.keys(patch).join("، "), "security");
      commit(s);
      return { ok: true };
    },

    async requestPartner(note) {
      await delay(400);
      const s = clone();
      const me = s.users.find((u) => u.id === s.currentUserId)!;
      if (me.role !== "customer") return { ok: false, error: "فقط کاربران عادی می‌توانند درخواست همکاری بدهند" };
      if (s.partnerRequests.some((r) => r.userId === me.id && r.status === "pending"))
        return { ok: false, error: "درخواست قبلی شما هنوز در حال بررسی است" };
      s.partnerRequests.unshift({ id: uid("pr"), userId: me.id, note: note.trim() || "—", status: "pending", at: Date.now() });
      audit(s, me.name, "درخواست همکاری", "درخواست فروشندگی ثبت شد — در انتظار تأیید مدیر", "info");
      commit(s);
      return { ok: true };
    },

    async healthCheck() {
      await delay(900);
      const jitter = (base: number) => Math.round(base + Math.random() * base * 0.6);
      return { radiusMs: jitter(18), dbMs: jitter(6), workerMs: jitter(12), serverMs: jitter(42), at: Date.now() };
    },
  };

  const me = state.users.find((u) => u.id === state.currentUserId) ?? state.users[0];

  const switchUser = (id: string) => {
    const s = clone();
    s.currentUserId = id;
    commit(s);
    const u = s.users.find((x) => x.id === id);
    if (u) toast(`ورود به‌عنوان ${u.name}`, "info");
  };

  const resetDemo = () => {
    const fresh = seed();
    commit(fresh);
    toast("داده‌های نمایشی به حالت اولیه برگشت", "info");
  };

  return (
    <Ctx.Provider value={{ state, me, toasts, toast, dismissToast, switchUser, resetDemo, api }}>{children}</Ctx.Provider>
  );
}
