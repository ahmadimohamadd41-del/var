/** مدل‌های دامنه VAR VPN —镜像 of the VAR business DB schema (FastAPI/MariaDB on server). */

export type Role = "customer" | "partner" | "admin";

export interface User {
  id: string;
  tgId: string;
  name: string;
  role: Role;
  joinedAt: number;
}

export interface Product {
  id: string;
  name: string;
  quotaGb: number;
  durationDays: number;
  price: number; // toman
  groupId: string; // FreeRADIUS group — traffic quota only
  active: boolean;
  popular?: boolean;
}

/**
 * سرور VPN — مشتری فقط «سرور N» می‌بیند؛ region/host داخلی است و هرگز
 * در فرانت مشتری نمایش داده نمی‌شود (فقط پنل ادمین).
 */
export interface VpnServer {
  id: string;
  code: number; // شماره عمومی: سرور ۱، سرور ۲ …
  region: string; // INTERNAL ONLY — کشور/شهر واقعی، فقط برای ادمین
  host: string; // INTERNAL ONLY — آدرس OpenVPN
  status: "online" | "maintenance";
  latencyMs: number;
}

export interface Account {
  id: string;
  ownerId: string; // VAR user id
  soldBy?: string; // partner id if created via partner sale
  customerName?: string;
  radiusUsername: string;
  radiusPassword: string;
  serverId: string;
  groupId: string;
  quotaBytes: number;
  usedBytes: number; // source of truth: radacct (simulated locally)
  expiresAt: number;
  createdAt: number;
  historyGb: number[]; // last 7 days from radacct daily sessions
}

export type PayMethod = "gateway" | "card" | "wallet";
export type OrderStatus = "awaiting_payment" | "provisioning" | "active" | "failed";

export interface Order {
  id: string;
  userId: string;
  productId: string;
  serverId: string;
  qty: number;
  total: number;
  payMethod: PayMethod;
  status: OrderStatus;
  createdAt: number;
  forCustomer?: string; // partner sales: customer label
  failReason?: string;
  accountIds: string[];
  idemKey: string;
}

export type PaymentStatus = "pending" | "confirmed" | "rejected";

export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  method: PayMethod;
  status: PaymentStatus;
  receiptName?: string;
  createdAt: number;
  decidedAt?: number;
  decidedBy?: string;
  idemKey: string;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  delta: number; // signed, toman
  balanceAfter: number;
  reason: string; // required — audited
  actor: string;
  at: number;
}

export interface Wallet {
  userId: string;
  balance: number;
  ledger: LedgerEntry[];
}

export interface PartnerRequest {
  id: string;
  userId: string;
  phone: string; // شماره موبایل — اجباری در ثبت درخواست
  note: string;
  termsAccepted: boolean; // شرایط و مزایا را خوانده و پذیرفته
  status: "pending" | "approved" | "rejected";
  at: number;
  decidedAt?: number;
}

export type AuditKind = "info" | "money" | "security" | "danger";

export interface AuditEntry {
  id: string;
  at: number;
  actor: string;
  action: string;
  detail: string;
  kind: AuditKind;
}

/** درگاه پرداخت آنلاین — ادمین می‌تواند چند درگاه تعریف و فعال/غیرفعال کند */
export interface PaymentGateway {
  id: string;
  name: string; // نام نمایشی برای مشتری، مثلاً «زرین‌پال»
  provider: string; // zarinpal | idpay | nextpay | sepehr | custom
  merchantId: string; // کد مرچنت — فقط سمت بک‌اند/سرور استفاده می‌شود
  enabled: boolean;
}

/** کارت بانکی برای کارت‌به‌کارت — ادمین freely اضافه/ویرایش/حذف می‌کند */
export interface CardConfig {
  id: string;
  number: string;
  holder: string;
  enabled: boolean;
}

export interface Settings {
  minPartnerBalance: number;
  supportHandle: string;
  apiBase: string;
  /** demo switch: simulates missing RADIUS group G50 → safe provisioning failure */
  simulateMissingGroup: boolean;
}

export interface AppState {
  v: number;
  currentUserId: string;
  users: User[];
  products: Product[];
  servers: VpnServer[];
  accounts: Account[];
  orders: Order[];
  payments: Payment[];
  wallets: Wallet[];
  partnerRequests: PartnerRequest[];
  audit: AuditEntry[];
  settings: Settings;
  gateways: PaymentGateway[]; // درگاه‌های پرداخت آنلاین (مدیریت ادمین)
  cards: CardConfig[]; // کارت‌های کارت‌به‌کارت (مدیریت ادمین)
  availableGroups: string[]; // groups that exist in FreeRADIUS radgroupcheck
}

export interface PurchaseInput {
  productId: string;
  method: PayMethod;
  qty?: number;
  forCustomer?: string;
  receiptName?: string;
  serverId?: string; // اگر چند سرور فعال باشد، انتخاب مشتری
}

export interface PurchaseResult {
  ok: boolean;
  orderId: string;
  paymentId?: string;
  status: OrderStatus | "awaiting_payment";
  accounts?: Account[];
  error?: string;
  failReason?: string;
}
