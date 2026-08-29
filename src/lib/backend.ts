/**
 * VAR VPN — شبیه‌ساز بک‌اند لوکال
 * -------------------------------------------------
 * این ماژول دقیقاً همان قرارداد API را دارد که بک‌اند FastAPI روی سرور
 * ارائه می‌دهد: پرداخت idempotent، پروویژن idempotent، ledger شفاف،
 * شکست امن وقتی گروه RADIUS وجود ندارد (قانون ۹)، و audit برای همه‌چیز.
 * داده‌ها در localStorage می‌مانند تا «اول لوکال، بعد سرور» ممکن شود.
 */

import type {
  AuditKind,
  DB,
  Order,
  PartnerStatus,
  RadiusAccount,
  Snap,
} from "./types";
import { GB, MB } from "./format";

const KEY = "varvpn.local.db.v1";
const VERSION = 1;

export class ApiError extends Error {}

/* ---------------------------------- helpers --------------------------------- */

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const delay = (ms = 420) => new Promise<void>((r) => setTimeout(r, ms));
const nowIso = () => new Date().toISOString();
const rid = (p: string) =>
  `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const REF_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const makeRef = () =>
  "VAR-" +
  Array.from({ length: 5 }, () =>
    REF_CHARS.charAt(Math.floor(Math.random() * REF_CHARS.length)),
  ).join("");

const USER_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
const makeUsername = () =>
  "var_" +
  Array.from({ length: 6 }, () =>
    USER_CHARS.charAt(Math.floor(Math.random() * USER_CHARS.length)),
  ).join("");

const PASS_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789#@";
const makePassword = () =>
  Array.from({ length: 10 }, () =>
    PASS_CHARS.charAt(Math.floor(Math.random() * PASS_CHARS.length)),
  ).join("");

const groupNameFor = (quotaGb: number) => `vpn-${quotaGb}g`;

let auditSeq = 0;

/* ----------------------------------- seed ----------------------------------- */

function seedDb(): DB {
  const now = Date.now();
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
  const day = 86_400_000;

  const db: DB = {
    v: VERSION,
    settings: {
      min_partner_balance: 1_000_000,
      card_number: "6104 3378 9012 4455",
      card_holder: "حساب واریز VAR VPN",
      gateway_enabled: true,
      radius_groups: ["vpn-10g", "vpn-20g", "vpn-50g", "vpn-100g"],
      concurrent_devices: 2,
    },
    products: [
      { id: "p10", quota_gb: 10, duration_days: 30, price_toman: 120_000, active: true },
      { id: "p20", quota_gb: 20, duration_days: 30, price_toman: 200_000, active: true },
      { id: "p50", quota_gb: 50, duration_days: 30, price_toman: 380_000, active: true, popular: true },
      { id: "p100", quota_gb: 100, duration_days: 30, price_toman: 620_000, active: true },
    ],
    accounts: [
      {
        id: "a_seed1",
        username: "var_k8m2qz",
        password: "Xk9mQ2vL7b",
        server_id: "de-1",
        group_name: "vpn-20g",
        quota_bytes: 20 * GB,
        used_bytes: 19 * GB,
        expiration: new Date(now + 6 * day).toISOString(),
        capped: false,
        created_at: iso(24 * day),
        owner: "customer",
        note: "خرید اولیه — ۲۰ گیگابایت",
      },
    ],
    orders: [
      {
        id: "o_seed0",
        ref: "VAR-K2M8Q",
        actor: "customer",
        actor_label: "امید رضایی",
        product_id: "p20",
        quantity: 1,
        target_username: null,
        result_usernames: ["var_k8m2qz"],
        total_toman: 200_000,
        method: "gateway",
        status: "done",
        provision_note: null,
        receipt_no: null,
        created_at: iso(24 * day),
        paid_at: iso(24 * day),
      },
      {
        id: "o_seed1",
        ref: "VAR-T7X4B",
        actor: "customer",
        actor_label: "امید رضایی",
        product_id: "p50",
        quantity: 1,
        target_username: null,
        result_usernames: [],
        total_toman: 380_000,
        method: "card",
        status: "awaiting_approval",
        provision_note: null,
        receipt_no: "۸۸۴۲۱۹۳۷",
        created_at: iso(2 * 3_600_000),
        paid_at: null,
      },
    ],
    payments: [
      {
        id: "pay_seed0",
        order_id: "o_seed0",
        amount_toman: 200_000,
        method: "gateway",
        status: "approved",
        callback_hits: 1,
        created_at: iso(24 * day),
        processed_at: iso(24 * day),
      },
      {
        id: "pay_seed1",
        order_id: "o_seed1",
        amount_toman: 380_000,
        method: "card",
        status: "pending",
        callback_hits: 0,
        created_at: iso(2 * 3_600_000),
        processed_at: null,
      },
    ],
    ledger: [
      {
        id: "l_seed2",
        partner_id: "p_alpha",
        delta_toman: 500_000,
        balance_after: 2_500_000,
        reason: "پاداش فروش مهرماه — به‌دست مدیر",
        actor_label: "مدیر VAR",
        at: iso(9 * day),
      },
      {
        id: "l_seed1",
        partner_id: "p_alpha",
        delta_toman: 2_000_000,
        balance_after: 2_000_000,
        reason: "شارژ اولیه کیف پول پس از تأیید همکاری",
        actor_label: "مدیر VAR",
        at: iso(31 * day),
      },
    ],
    partners: [
      {
        id: "p_alpha",
        name: "آلفانت",
        telegram: "@alpha_net",
        status: "active",
        wallet_toman: 2_500_000,
        created_at: iso(31 * day),
      },
      {
        id: "p_beta",
        name: "دیجیتال‌مارکت",
        telegram: "@digimarket",
        status: "pending",
        wallet_toman: 0,
        created_at: iso(1 * day),
      },
    ],
    audit: [
      {
        id: "au_s4",
        at: iso(2 * 3_600_000),
        actor: "مشتری",
        action: "payment:receipt",
        detail: "رسید کارت‌به‌کارت برای سفارش VAR-T7X4B ثبت شد — در انتظار تأیید مدیر",
        kind: "info",
      },
      {
        id: "au_s3",
        at: iso(9 * day),
        actor: "مدیر",
        action: "wallet:credit",
        detail: "شارژ کیف پول همکار آلفانت (+۵۰۰٬۰۰۰) — دلیل: پاداش فروش",
        kind: "success",
      },
      {
        id: "au_s2",
        at: iso(24 * day - 3_600_000),
        actor: "worker",
        action: "provision:create",
        detail: "اکانت var_k8m2qz در گروه vpn-20g ساخته شد (radcheck + radgroupcheck)",
        kind: "success",
      },
      {
        id: "au_s1",
        at: iso(24 * day),
        actor: "system",
        action: "backup:radius",
        detail: "بک‌آپ خودکار دیتابیس radius قبل از عملیات پروویژن ثبت شد",
        kind: "info",
      },
    ],
    profile: { name: "امید رضایی", telegram: "@omid_rza" },
  };
  return db;
}

/* --------------------------------- storage ---------------------------------- */

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed && parsed.v === VERSION) return parsed;
    }
  } catch {
    /* داده خراب — از نو seed می‌کنیم */
  }
  const fresh = seedDb();
  try {
    localStorage.setItem(KEY, JSON.stringify(fresh));
  } catch {
    /* private mode */
  }
  return fresh;
}

let db: DB = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* ignore */
  }
}

export const snap = (): Snap => clone(db);

function log(kind: AuditKind, actor: string, action: string, detail: string) {
  db.audit.unshift({
    id: rid("au") + (auditSeq++).toString(36),
    at: nowIso(),
    actor,
    action,
    detail,
    kind,
  });
  if (db.audit.length > 90) db.audit.length = 90;
}

/* -------------------------------- core logic -------------------------------- */

function findOrder(id: string): Order {
  const o = db.orders.find((x) => x.id === id);
  if (!o) throw new ApiError("سفارش پیدا نشد");
  return o;
}

/**
 * پروویژن idempotent:
 * - اگر سفارش قبلاً done شده باشد، هیچ کاری نمی‌کند.
 * - تمدید: quota جدید = quota فعلی + خرید جدید؛ مصرف قبلی هرگز ریست نمی‌شود.
 * - اگر گروه RADIUS وجود نداشته باشد: شکست امن، بدون ساخت خودکار گروه.
 */
function provisionOrder(order: Order) {
  if (order.status === "done") {
    log("info", "worker", "provision:skip", `سفارش ${order.ref} قبلاً پروویژن شده — idempotent، بدون اکانت تکراری`);
    return;
  }
  const product = db.products.find((p) => p.id === order.product_id);
  if (!product) {
    order.status = "failed";
    order.provision_note = "محصول حذف شده است";
    return;
  }
  order.status = "provisioning";
  const gname = groupNameFor(product.quota_gb);

  if (!db.settings.radius_groups.includes(gname)) {
    order.status = "failed";
    order.provision_note = `گروه «${gname}» در FreeRADIUS وجود ندارد. طبق قانون ۹ گروه به‌صورت خودکار ساخته نمی‌شود — پروویژن با شکستِ امن متوقف شد. پس از رفع مشکل، «تلاش دوباره» بزنید؛ مبلغی کسر نمی‌شود.`;
    log("error", "worker", "provision:failed", `سفارش ${order.ref}: گروه ${gname} در radgroupreply یافت نشد — ساخت خودکار ممنوع`);
    if (order.method === "wallet") refundPartner(order);
    return;
  }

  const exp = new Date(Date.now() + product.duration_days * 86_400_000).toISOString();

  for (let i = 0; i < order.quantity; i++) {
    if (order.target_username) {
      const acct = db.accounts.find((a) => a.username === order.target_username);
      if (acct) {
        const before = acct.quota_bytes;
        acct.quota_bytes = before + product.quota_gb * GB;
        acct.expiration = exp;
        acct.capped = false;
        order.result_usernames.push(acct.username);
        log(
          "success",
          "worker",
          "provision:renew",
          `تمدید ${acct.username}: حجم ${Math.round(before / GB)}+${product.quota_gb}=${Math.round(acct.quota_bytes / GB)} گیگ — مصرف قبلی حفظ شد (reset=never) — انقضا: ${product.duration_days} روز`,
        );
        continue;
      }
    }
    const acct: RadiusAccount = {
      id: rid("a"),
      username: makeUsername(),
      password: makePassword(),
      server_id: "de-1",
      group_name: gname,
      quota_bytes: product.quota_gb * GB,
      used_bytes: 0,
      expiration: exp,
      capped: false,
      created_at: nowIso(),
      owner: order.actor,
      note: order.quantity > 1 ? `خرید عمده همکار — سفارش ${order.ref}` : `سفارش ${order.ref}`,
    };
    db.accounts.push(acct);
    order.result_usernames.push(acct.username);
    log("success", "worker", "provision:create", `اکانت ${acct.username} در گروه ${gname} روی سرور آلمان-۱ ساخته شد (radcheck + radgroupcheck)`);
  }

  order.status = "done";
  log("success", "worker", "order:done", `سفارش ${order.ref} تکمیل شد — ${order.result_usernames.length} اکانت فعال`);
}

function refundPartner(order: Order) {
  const partner = db.partners.find((p) => p.id === order.actor);
  if (!partner) return;
  partner.wallet_toman += order.total_toman;
  db.ledger.unshift({
    id: rid("l"),
    partner_id: partner.id,
    delta_toman: order.total_toman,
    balance_after: partner.wallet_toman,
    reason: `بازگشت وجه سفارش ${order.ref} — خطای پروویژن (تراکنش‌پذیری: بدون ضرر همکار)`,
    actor_label: "system",
    at: nowIso(),
  });
  log("warn", "system", "wallet:refund", `مبلغ ${order.total_toman.toLocaleString("fa-IR")} تومان به کیف پول ${partner.name} بازگشت داده شد`);
}

/* ----------------------------------- API ------------------------------------ */

export async function apiList(): Promise<Snap> {
  await delay(250);
  return snap();
}

export async function apiReset(): Promise<Snap> {
  await delay(300);
  db = seedDb();
  log("warn", "system", "db:reset", "دیتابیس لوکال به حالت اولیه برگشت (فقط محیط توسعه)");
  save();
  return snap();
}

/** ثبت سفارش مشتری + پرداختِ در انتظار (درگاه یا کارت‌به‌کارت) */
export async function createCustomerOrder(
  productId: string,
  method: "gateway" | "card",
  targetUsername: string | null,
): Promise<{ s: Snap; orderId: string }> {
  await delay(350);
  const product = db.products.find((p) => p.id === productId);
  if (!product || !product.active) throw new ApiError("این بسته فعلاً فعال نیست");
  if (method === "gateway" && !db.settings.gateway_enabled)
    throw new ApiError("درگاه پرداخت موقتاً غیرفعال است — کارت‌به‌کارت را انتخاب کنید");

  const order: Order = {
    id: rid("o"),
    ref: makeRef(),
    actor: "customer",
    actor_label: db.profile.name,
    product_id: productId,
    quantity: 1,
    target_username: targetUsername,
    result_usernames: [],
    total_toman: product.price_toman,
    method,
    status: "pending_payment",
    provision_note: null,
    receipt_no: null,
    created_at: nowIso(),
    paid_at: null,
  };
  db.orders.unshift(order);
  db.payments.unshift({
    id: rid("pay"),
    order_id: order.id,
    amount_toman: order.total_toman,
    method,
    status: "pending",
    callback_hits: 0,
    created_at: nowIso(),
    processed_at: null,
  });
  log("info", "مشتری", "order:create", `سفارش ${order.ref} — بسته ${product.quota_gb} گیگابایت — روش: ${method === "gateway" ? "درگاه" : "کارت‌به‌کارت"}${targetUsername ? ` — تمدید ${targetUsername}` : " — اکانت جدید"}`);
  save();
  return { s: snap(), orderId: order.id };
}

/**
 * کال‌بک درگاه — کاملاً idempotent.
 * کال‌بک تکراری فقط شمارنده را بالا می‌برد و هیچ پروویژن دومی رخ نمی‌دهد.
 */
export async function gatewayCallback(orderId: string): Promise<Snap> {
  await delay(1400);
  const order = findOrder(orderId);
  const payment = db.payments.find((p) => p.order_id === order.id);
  if (!payment) throw new ApiError("رکورد پرداخت پیدا نشد");

  payment.callback_hits += 1;

  if (payment.status === "approved") {
    log("warn", "gateway", "payment:duplicate", `کال‌بک تکراری برای ${order.ref} (hit #${payment.callback_hits}) — به‌لطف idempotency نادیده گرفته شد؛ پرداختِ دوباره یا اکانت تکراری رخ نداد`);
    save();
    return snap();
  }

  payment.status = "approved";
  payment.processed_at = nowIso();
  order.status = "paid";
  order.paid_at = nowIso();
  log("success", "gateway", "payment:approved", `کال‌بک درگاه برای ${order.ref} تأیید شد (idempotency_key=${order.id.slice(-8)}…)`);

  await delay(700);
  provisionOrder(order);
  save();
  return snap();
}

/** ثبت رسید کارت‌به‌کارت — سفارش می‌رود در صف تأیید مدیر */
export async function submitReceipt(orderId: string, receiptNo: string): Promise<Snap> {
  await delay(500);
  const order = findOrder(orderId);
  if (order.status !== "pending_payment") throw new ApiError("این سفارش در وضعیت ثبت رسید نیست");
  order.status = "awaiting_approval";
  order.receipt_no = receiptNo;
  log("info", "مشتری", "payment:receipt", `رسید ${receiptNo} برای سفارش ${order.ref} ثبت شد — در انتظار تأیید مدیر`);
  save();
  return snap();
}

export async function adminApprovePayment(orderId: string): Promise<Snap> {
  await delay(600);
  const order = findOrder(orderId);
  const payment = db.payments.find((p) => p.order_id === order.id);
  if (!payment) throw new ApiError("رکورد پرداخت پیدا نشد");
  if (payment.status === "approved") {
    log("warn", "مدیر", "payment:duplicate", `تأیید تکراری برای ${order.ref} — عملیات نادیده گرفته شد`);
    save();
    return snap();
  }
  payment.status = "approved";
  payment.processed_at = nowIso();
  order.status = "paid";
  order.paid_at = nowIso();
  log("success", "مدیر", "payment:approved", `رسید کارت‌به‌کارت سفارش ${order.ref} تأیید شد — ارسال به worker برای پروویژن`);
  await delay(650);
  provisionOrder(order);
  save();
  return snap();
}

export async function adminRejectPayment(orderId: string): Promise<Snap> {
  await delay(450);
  const order = findOrder(orderId);
  const payment = db.payments.find((p) => p.order_id === order.id);
  if (payment) payment.status = "rejected";
  order.status = "rejected";
  log("warn", "مدیر", "payment:rejected", `رسید سفارش ${order.ref} رد شد — هیچ پروویژنی انجام نمی‌شود`);
  save();
  return snap();
}

/** تلاش دوباره پروویژن برای سفارشِ پرداخت‌شده‌ای که شکست امن خورده بود */
export async function retryProvision(orderId: string): Promise<Snap> {
  await delay(500);
  const order = findOrder(orderId);
  const payment = db.payments.find((p) => p.order_id === order.id);
  if (!payment || payment.status !== "approved")
    throw new ApiError("فقط سفارش‌های پرداخت‌شده قابل تلاش دوباره‌اند");
  order.provision_note = null;
  log("info", "مدیر", "provision:retry", `تلاش دوباره پروویژن برای ${order.ref} — بدون پرداختِ مجدد`);
  await delay(700);
  provisionOrder(order);
  save();
  return snap();
}

/**
 * خرید همکار برای مشتری — از کیف پول کسر می‌شود و اکانت‌ها بلافاصله
 * (حتی در حالت عمده) پروویژن می‌شوند. همکار انبار اکانت ندارد.
 */
export async function partnerPurchase(
  partnerId: string,
  productId: string,
  quantity: number,
  customerLabel: string,
): Promise<{ s: Snap; orderId: string }> {
  await delay(550);
  const partner = db.partners.find((p) => p.id === partnerId);
  if (!partner) throw new ApiError("همکار پیدا نشد");
  if (partner.status !== "active")
    throw new ApiError(partner.status === "pending" ? "حساب همکار هنوز به تأیید مدیر نرسیده است" : "حساب همکار تعلیق شده است");
  const product = db.products.find((p) => p.id === productId);
  if (!product || !product.active) throw new ApiError("این بسته فعلاً فعال نیست");
  const total = product.price_toman * quantity;

  if (partner.wallet_toman < db.settings.min_partner_balance)
    throw new ApiError(`حداقل موجودی کیف پول همکار ${db.settings.min_partner_balance.toLocaleString("fa-IR")} تومان است — با مدیر تماس بگیرید`);
  if (partner.wallet_toman < total) throw new ApiError("موجودی کیف پول کافی نیست");

  partner.wallet_toman -= total;
  db.ledger.unshift({
    id: rid("l"),
    partner_id: partner.id,
    delta_toman: -total,
    balance_after: partner.wallet_toman,
    reason: `خرید ${quantity}× بسته ${product.quota_gb} گیگابایت برای مشتری «${customerLabel || "بدون برچسب"}»`,
    actor_label: partner.name,
    at: nowIso(),
  });

  const order: Order = {
    id: rid("o"),
    ref: makeRef(),
    actor: partner.id,
    actor_label: partner.name,
    product_id: productId,
    quantity,
    target_username: null,
    result_usernames: [],
    total_toman: total,
    method: "wallet",
    status: "paid",
    provision_note: null,
    receipt_no: null,
    created_at: nowIso(),
    paid_at: nowIso(),
  };
  db.orders.unshift(order);
  db.payments.unshift({
    id: rid("pay"),
    order_id: order.id,
    amount_toman: total,
    method: "wallet",
    status: "approved",
    callback_hits: 1,
    created_at: nowIso(),
    processed_at: nowIso(),
  });
  log("info", "همکار", "order:create", `سفارش ${order.ref} — ${quantity}× ${product.quota_gb} گیگ برای مشتری «${customerLabel || "بدون برچسب"}» — کسر از کیف پول`);

  await delay(600);
  provisionOrder(order);
  save();
  return { s: snap(), orderId: order.id };
}

export async function adminSetPartnerStatus(partnerId: string, status: PartnerStatus): Promise<Snap> {
  await delay(350);
  const p = db.partners.find((x) => x.id === partnerId);
  if (!p) throw new ApiError("همکار پیدا نشد");
  p.status = status;
  const verb = status === "active" ? "فعال شد" : status === "suspended" ? "تعلیق شد" : "به حالت انتظار برگشت";
  log(status === "active" ? "success" : "warn", "مدیر", "partner:status", `همکار ${p.name} ${verb}`);
  save();
  return snap();
}

/** شارژ/کسر کیف پول همکار — فقط توسط مدیر، با دلیل اجباری و ثبت در ledger */
export async function adminAdjustWallet(partnerId: string, deltaToman: number, reason: string): Promise<Snap> {
  await delay(450);
  const p = db.partners.find((x) => x.id === partnerId);
  if (!p) throw new ApiError("همکار پیدا نشد");
  if (!reason || reason.trim().length < 3) throw new ApiError("دلیل عملیات مالی اجباری است (حداقل ۳ حرف)");
  if (deltaToman === 0) throw new ApiError("مبلغ نمی‌تواند صفر باشد");
  if (deltaToman < 0 && p.wallet_toman + deltaToman < 0) throw new ApiError("کسر بیش از موجودی ممکن نیست");

  p.wallet_toman += deltaToman;
  db.ledger.unshift({
    id: rid("l"),
    partner_id: p.id,
    delta_toman: deltaToman,
    balance_after: p.wallet_toman,
    reason: reason.trim(),
    actor_label: "مدیر VAR",
    at: nowIso(),
  });
  log(
    deltaToman > 0 ? "success" : "warn",
    "مدیر",
    deltaToman > 0 ? "wallet:credit" : "wallet:debit",
    `کیف پول ${p.name}: ${deltaToman > 0 ? "+" : ""}${deltaToman.toLocaleString("fa-IR")} تومان — دلیل: ${reason.trim()}`,
  );
  save();
  return snap();
}

export async function updateProduct(id: string, price: number, active: boolean): Promise<Snap> {
  await delay(300);
  const p = db.products.find((x) => x.id === id);
  if (!p) throw new ApiError("بسته پیدا نشد");
  if (price < 1000) throw new ApiError("قیمت معتبر نیست");
  const oldPrice = p.price_toman;
  p.price_toman = price;
  p.active = active;
  log("info", "مدیر", "product:update", `بسته ${p.quota_gb} گیگابایت: قیمت ${oldPrice.toLocaleString("fa-IR")} ← ${price.toLocaleString("fa-IR")} تومان — فعال: ${active ? "بله" : "خیر"}`);
  save();
  return snap();
}

export async function updateSettings(patch: Partial<DB["settings"]>): Promise<Snap> {
  await delay(300);
  db.settings = { ...db.settings, ...patch };
  log("info", "مدیر", "settings:update", `تنظیمات سامانه به‌روزرسانی شد (min_partner_balance=${db.settings.min_partner_balance.toLocaleString("fa-IR")})`);
  save();
  return snap();
}

/** فعال/غیرفعال‌سازی گروه RADIUS — برای دموِ «شکست امن» قانون ۹ */
export async function setRadiusGroup(gname: string, enabled: boolean): Promise<Snap> {
  await delay(300);
  const has = db.settings.radius_groups.includes(gname);
  if (enabled && !has) db.settings.radius_groups.push(gname);
  if (!enabled && has) db.settings.radius_groups = db.settings.radius_groups.filter((g) => g !== gname);
  log(
    enabled ? "success" : "warn",
    "مدیر",
    "radius:group",
    enabled
      ? `گروه ${gname} دوباره در دسترس پروویژن قرار گرفت`
      : `گروه ${gname} از لیست گروه‌های موجود حذف شد — خریدهای این بسته با شکست امن مواجه می‌شوند (بدون ساخت خودکار)`,
  );
  save();
  return snap();
}

/** برای دمو: ارسال دوباره کال‌بکِ آخرین پرداخت درگاهی */
export async function duplicateLastGatewayCallback(): Promise<{ s: Snap; found: boolean }> {
  const pay = db.payments.find((p) => p.method === "gateway");
  if (!pay) return { s: snap(), found: false };
  const s = await gatewayCallback(pay.order_id);
  return { s, found: true };
}

/**
 * شبیه‌سازی radacct — مصرف واقعی بالا می‌رود و هرگز ریست نمی‌شود.
 * فقط وقتی تغییری رخ دهد snapshot برمی‌گرداند.
 */
export function tickUsage(): Snap | null {
  let changed = false;
  for (const a of db.accounts) {
    if (a.capped) continue;
    if (Math.random() < 0.45) {
      a.used_bytes = Math.min(a.quota_bytes, a.used_bytes + Math.round((2 + Math.random() * 7) * MB));
      changed = true;
      if (a.used_bytes >= a.quota_bytes && !a.capped) {
        a.capped = true;
        log("warn", "freeradius", "radius:capped", `حجم ${a.username} تمام شد — Max-Data فعال شد و اتصال قطع می‌شود (بدون ریست مصرف)`);
      }
    }
  }
  if (!changed) return null;
  save();
  return snap();
}

/** ساخت کانفیگ OVPN مخصوص کاربر — بدون هیچ متریال خصوصی واقعی */
export function buildOvpn(acct: RadiusAccount): string {
  return [
    "# ==================================================",
    "#  VAR VPN — OpenVPN client config",
    `#  generated for : ${acct.username}`,
    `#  generated at  : ${new Date().toISOString()}`,
    "#  server        : Germany-1 (de-1)",
    "# ==================================================",
    "client",
    "dev tun",
    "proto udp",
    "remote de-1.var-vpn.example 1194",
    "resolv-retry infinite",
    "nobind",
    "persist-key",
    "persist-tun",
    "auth-user-pass",
    `# credentials فقط داخل اپ نمایش داده می‌شود: ${acct.username}`,
    "# هرگز در git، لاگ یا فرانت‌اند ذخیره نمی‌شود",
    "auth SHA256",
    "cipher AES-256-GCM",
    "verb 3",
    "<ca>",
    "# PLACEHOLDER — CA واقعی هنگام تولید توسط بک‌اند تزریق می‌شود",
    "</ca>",
    "",
  ].join("\n");
}
