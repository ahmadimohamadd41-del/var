import type { AppState } from "./types";
import { GB } from "./format";

export const SEED_VERSION = 6;

const D = 86_400_000;
const H = 3_600_000;

/** داده‌های نمایشی اولیه — شبیه‌ساز VAR DB برای اجرای لوکال */
export function seed(): AppState {
  const now = Date.now();

  return {
    v: SEED_VERSION,
    currentUserId: "u_customer",
    users: [
      { id: "u_customer", tgId: "56230011", name: "امیر رضایی", role: "customer", joinedAt: now - 40 * D },
      { id: "u_partner", tgId: "77451290", name: "سارا محمدی", role: "partner", joinedAt: now - 25 * D },
      { id: "u_admin", tgId: "90000001", name: "مدیریت VAR", role: "admin", joinedAt: now - 90 * D },
      { id: "u_new", tgId: "61204478", name: "پارسا کیان", role: "customer", joinedAt: now - 3 * D },
    ],
    products: [
      { id: "p10", name: "۱۰ گیگابایت", quotaGb: 10, durationDays: 30, price: 98_000, groupId: "G10", active: true },
      { id: "p20", name: "۲۰ گیگابایت", quotaGb: 20, durationDays: 30, price: 168_000, groupId: "G20", active: true },
      { id: "p50", name: "۵۰ گیگابایت", quotaGb: 50, durationDays: 30, price: 328_000, groupId: "G50", active: true, popular: true },
      { id: "p100", name: "۱۰۰ گیگابایت", quotaGb: 100, durationDays: 30, price: 548_000, groupId: "G100", active: true },
    ],
    servers: [
      // region/host داخلی است — مشتری فقط «سرور ۱» می‌بیند
      { id: "germany-1", code: 1, region: "Frankfurt, Germany", host: "de1.var-vpn.example", status: "online", latencyMs: 42 },
    ],
    accounts: [
      {
        id: "acc_main",
        ownerId: "u_customer",
        radiusUsername: "var_a5623",
        radiusPassword: "Kd82mvXq4Z",
        serverId: "germany-1",
        groupId: "G20",
        quotaBytes: 20 * GB,
        usedBytes: Math.round(19.38 * GB),
        expiresAt: now + 6 * D + 4 * H,
        createdAt: now - 24 * D,
        historyGb: [2.1, 1.8, 2.6, 3.2, 2.9, 3.4, 3.38],
      },
      {
        id: "acc_p1",
        ownerId: "u_partner",
        soldBy: "u_partner",
        customerName: "رضا کریمی",
        radiusUsername: "var_r8812",
        radiusPassword: "Tr51nbWq2A",
        serverId: "germany-1",
        groupId: "G10",
        quotaBytes: 10 * GB,
        usedBytes: Math.round(3.2 * GB),
        expiresAt: now + 21 * D,
        createdAt: now - 9 * D,
        historyGb: [0.4, 0.5, 0.3, 0.6, 0.5, 0.4, 0.5],
      },
      {
        id: "acc_p2",
        ownerId: "u_partner",
        soldBy: "u_partner",
        customerName: "نرگس احمدی",
        radiusUsername: "var_n2201",
        radiusPassword: "Lp74xzEr9C",
        serverId: "germany-1",
        groupId: "G20",
        quotaBytes: 20 * GB,
        usedBytes: Math.round(8.1 * GB),
        expiresAt: now + 14 * D,
        createdAt: now - 16 * D,
        historyGb: [1.1, 1.4, 1.2, 1.5, 1.0, 1.0, 0.9],
      },
    ],
    orders: [
      {
        id: "ord_seed2",
        userId: "u_new",
        productId: "p20",
        serverId: "germany-1",
        qty: 1,
        total: 168_000,
        payMethod: "card",
        status: "awaiting_payment",
        createdAt: now - 2 * H,
        accountIds: [],
        idemKey: "idem_seed2",
      },
      {
        id: "ord_seed1",
        userId: "u_customer",
        productId: "p20",
        serverId: "germany-1",
        qty: 1,
        total: 168_000,
        payMethod: "gateway",
        status: "active",
        createdAt: now - 24 * D,
        accountIds: ["acc_main"],
        idemKey: "idem_seed1",
      },
    ],
    payments: [
      {
        id: "pay_seed2",
        orderId: "ord_seed2",
        userId: "u_new",
        amount: 168_000,
        method: "card",
        status: "pending",
        receiptName: "fish-168000.jpg",
        createdAt: now - 2 * H,
        idemKey: "idem_seed2",
      },
      {
        id: "pay_seed1",
        orderId: "ord_seed1",
        userId: "u_customer",
        amount: 168_000,
        method: "gateway",
        status: "confirmed",
        createdAt: now - 24 * D,
        decidedAt: now - 24 * D,
        decidedBy: "درگاه پرداخت",
        idemKey: "idem_seed1",
      },
    ],
    wallets: [
      {
        userId: "u_partner",
        balance: 2_450_000,
        ledger: [
          {
            id: "led_2",
            userId: "u_partner",
            delta: 1_450_000,
            balanceAfter: 2_450_000,
            reason: "شارژ کیف پول — تأیید فیش واریزی",
            actor: "مدیریت VAR",
            at: now - 5 * D,
          },
          {
            id: "led_1",
            userId: "u_partner",
            delta: 1_000_000,
            balanceAfter: 1_000_000,
            reason: "شارژ اولیه کیف پول همکار",
            actor: "مدیریت VAR",
            at: now - 25 * D,
          },
        ],
      },
    ],
    partnerRequests: [
      {
        id: "pr_seed",
        userId: "u_new",
        phone: "09141234567",
        note: "مدیر کانال فروش اکانت در تبریز هستم، ماهانه حدود ۳۰ مشتری دارم.",
        termsAccepted: true,
        status: "pending",
        at: now - 3 * H,
      },
      {
        id: "pr_old",
        userId: "u_partner",
        phone: "09152203344",
        note: "نماینده فروش در مشهد",
        termsAccepted: true,
        status: "approved",
        at: now - 26 * D,
        decidedAt: now - 25 * D,
      },
    ],
    audit: [
      { id: "aud_5", at: now - 2 * H, actor: "پارسا کیان", action: "ثبت فیش کارت‌به‌کارت", detail: "۱۶۸٬۰۰۰ تومان برای سفارش ۲۰ گیگابایت — در انتظار بررسی", kind: "money" },
      { id: "aud_4", at: now - 3 * H, actor: "پارسا کیان", action: "درخواست همکاری", detail: "درخواست فروشندگی ثبت شد — در انتظار تأیید مدیر", kind: "info" },
      { id: "aud_3", at: now - 5 * D, actor: "مدیریت VAR", action: "شارژ کیف پول", detail: "۱٬۴۵۰٬۰۰۰ تومان برای سارا محمدی — تأیید فیش واریزی", kind: "money" },
      { id: "aud_2", at: now - 20 * D, actor: "مدیریت VAR", action: "افزودن سرور", detail: "سرور آلمان ۱ (Frankfurt) به ناوگان اضافه شد", kind: "security" },
      { id: "aud_1", at: now - 25 * D, actor: "مدیریت VAR", action: "تأیید همکار", detail: "سارا محمدی به‌عنوان همکار تأیید شد — حداقل موجودی ۱٬۰۰۰٬۰۰۰ تومان", kind: "info" },
    ],
    settings: {
      minPartnerBalance: 1_000_000,
      supportHandle: "@VARVPN_Support",
      apiBase: "http://127.0.0.1:8000",
      simulateMissingGroup: false,
    },
    gateways: [
      { id: "gw_zarin", name: "زرین‌پال", provider: "zarinpal", merchantId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", enabled: true },
      { id: "gw_idpay", name: "آیدی‌پی", provider: "idpay", merchantId: "", enabled: false },
    ],
    cards: [
      { id: "card_1", number: "6274 1290 3355 8412", holder: "محمد رضوانی", enabled: true },
      { id: "card_2", number: "6037 9975 1120 4458", holder: "محمد رضوانی", enabled: false },
    ],
    availableGroups: ["G10", "G20", "G50", "G100"],
  };
}
