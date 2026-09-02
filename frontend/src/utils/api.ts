/**
 * API client for communicating with VAR VPN backend
 */
import { Plan, AccountStatus, PurchaseRequest, PurchaseResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api-var.popserver.shop';

class ApiClient {
  private baseUrl: string;
  private initData: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set Telegram initData for authentication
   */
  setInitData(initData: string) {
    this.initData = initData;
  }

  /**
   * Get headers with Telegram auth
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (this.initData) {
      headers['X-Telegram-Init-Data'] = this.initData;
    }
    
    return headers;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    return this.request('/v1/health');
  }

  /**
   * Get all active plans
   */
  async getPlans(): Promise<Plan[]> {
    return this.request<Plan[]>('/v1/plans');
  }

  /**
   * Get account status (requires auth)
   */
  async getAccountStatus(): Promise<AccountStatus> {
    return this.request<AccountStatus>('/v1/account/status');
  }

  /**
   * Register user (requires auth)
   */
  async registerUser(): Promise<Customer> {
    return this.request<Customer>('/v1/account/register', {
      method: 'POST',
    });
  }

  /**
   * Purchase a plan (requires auth)
   */
  async purchasePlan(planId: number): Promise<PurchaseResponse> {
    const body: PurchaseRequest = {
      plan_id: planId,
      telegram_init_data: this.initData || '',
    };

    return this.request<PurchaseResponse>('/v1/purchase', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL);
