/**
 * VAR VPN — domain types
 * این تایپ‌ها بین «شبیه‌ساز بک‌اند لوکال» و UI مشترک‌اند.
 * وقتی بک‌اند FastAPI روی سرور بالا بیاید، همین قراردادها حفظ می‌شود.
 */

export type Role = "customer" | "partner" | "admin";

export type OrderStatus =
  | "pending_payment"
  | "awaiting_approval"
  | "paid"
  | "provisioning"
  | "done"
  | "failed"
  | "rejected";

export type PayMethod = "gateway" | "card" | "wallet";
export type PaymentStatus = "pending" | "approved" | "rejected";
export type PartnerStatus = "pending" | "active" | "suspended";
export type AuditKind = "info" | "success" | "warn" | "error";

export interface Product {
  id: string;
  quota_gb: number;
  duration_days: number;
  price_toman: number;
  active: boolean;
  popular?: boolean;
}

/** اکانت RADIUS — وضعیت واقعی از radacct/FreeRADIUS می‌آید؛ اینجا snapshot لوکال است */
export interface RadiusAccount {
  id: string;
  username: string;
  password: string;
  server_id: "de-1";
  group_name: string;
  quota_bytes: number;
  used_bytes: number;
  expiration: string; // ISO
  capped: boolean; // حجم تمام شده
  created_at: string;
  owner: string; // 'customer' | partner id
  note?: string;
}

export interface Order {
  id: string;
  ref: string;
  actor: string; // 'customer' | partner id
  actor_label: string;
  product_id: string;
  quantity: number;
  /** برای تمدید: نام کاربری هدف. برای اکانت جدید: null */
  target_username: string | null;
  result_usernames: string[];
  total_toman: number;
  method: PayMethod;
  status: OrderStatus;
  provision_note: string | null;
  receipt_no: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface Payment {
  id: string;
  order_id: string;
  amount_toman: number;
  method: PayMethod;
  status: PaymentStatus;
  /** تعداد دفعات دریافت کال‌بک — برای نمایش idempotency */
  callback_hits: number;
  created_at: string;
  processed_at: string | null;
}

export interface LedgerEntry {
  id: string;
  partner_id: string;
  delta_toman: number;
  balance_after: number;
  reason: string;
  actor_label: string;
  at: string;
}

export interface Partner {
  id: string;
  name: string;
  telegram: string;
  status: PartnerStatus;
  wallet_toman: number;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
  kind: AuditKind;
}

export interface Settings {
  min_partner_balance: number;
  card_number: string;
  card_holder: string;
  gateway_enabled: boolean;
  /** گروه‌های موجود در FreeRADIUS — فقط traffic quota */
  radius_groups: string[];
  concurrent_devices: number;
}

export interface Profile {
  name: string;
  telegram: string;
}

export interface DB {
  v: number;
  settings: Settings;
  products: Product[];
  accounts: RadiusAccount[];
  orders: Order[];
  payments: Payment[];
  ledger: LedgerEntry[];
  partners: Partner[];
  audit: AuditEntry[];
  profile: Profile;
}

export type Snap = DB;
