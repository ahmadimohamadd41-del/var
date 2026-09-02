import { useState, useEffect } from 'react';
import { apiClient } from '../utils/api';
import { AccountStatus } from '../types/api';

/**
 * Hook to fetch and manage user account status
 */
export function useAccountStatus() {
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccountStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await apiClient.getAccountStatus();
      setAccountStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch account status');
      setAccountStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountStatus();
  }, []);

  return { accountStatus, loading, error, refresh: fetchAccountStatus };
}

/**
 * Hook to fetch available plans
 */
export function usePlans() {
  const [plans, setPlans] = useState<Array<{ id: number; name: string; quota_gb: number; duration_days: number; price: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedPlans = await apiClient.getPlans();
      setPlans(fetchedPlans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plans');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return { plans, loading, error, refresh: fetchPlans };
}
