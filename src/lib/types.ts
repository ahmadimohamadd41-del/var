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

export interface VpnServer {
  id: string;
  name: string;
  region: string;
  host: string;
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
  note: string;
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

export interface Settings {
  minPartnerBalance: number;
  cardNumber: string;
  cardHolder: string;
  gatewayEnabled: boolean;
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
  availableGroups: string[]; // groups that exist in FreeRADIUS radgroupcheck
}

export interface PurchaseInput {
  productId: string;
  method: PayMethod;
  qty?: number;
  forCustomer?: string;
  receiptName?: string;
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
