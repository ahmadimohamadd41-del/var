/**
 * API types and response schemas
 */

export interface Plan {
  id: number;
  name: string;
  quota_gb: number;
  duration_days: number;
  price: number;
  is_active: boolean;
}

export interface Customer {
  id: number;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
  created_at: string;
}

export interface EntitlementStatus {
  has_active_subscription: boolean;
  total_quota_gb: number;
  used_quota_gb: number;
  remaining_quota_gb: number;
  expiration_date?: string;
  days_remaining?: number;
  is_expired: boolean;
  radius_used_gb?: number;
}

export interface AccountStatus {
  customer?: Customer;
  entitlement?: EntitlementStatus;
  purchases_count: number;
  message: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PurchaseRequest {
  plan_id: number;
  telegram_init_data: string;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  new_quota_gb?: number;
  new_expiration?: string;
  transaction_id?: number;
}
