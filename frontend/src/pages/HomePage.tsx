import React from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { useAccountStatus, usePlans } from '../hooks/useApi';
import { apiClient } from '../utils/api';
import { Header } from '../components/Header';
import { AccountStatusCard } from '../components/AccountStatusCard';
import { PlanCard } from '../components/PlanCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';

export function HomePage() {
  const { isReady, initData, user } = useTelegram();
  const { accountStatus, loading: statusLoading, error: statusError, refresh } = useAccountStatus();
  const { plans, loading: plansLoading, error: plansError } = usePlans();

  // Set initData for API client when available
  React.useEffect(() => {
    if (initData) {
      apiClient.setInitData(initData);
    }
  }, [initData]);

  if (!isReady) {
    return <LoadingSpinner text="در حال بارگذاری..." />;
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-8">
      <Header />
      
      <main className="max-w-lg mx-auto px-4 py-4">
        {/* Status Section */}
        <section>
          {statusLoading ? (
            <LoadingSpinner text="در حال دریافت اطلاعات حساب..." />
          ) : statusError ? (
            <ErrorMessage message={statusError} onRetry={refresh} />
          ) : accountStatus ? (
            <AccountStatusCard status={accountStatus} />
          ) : null}
        </section>

        {/* Plans Section */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">پلن‌های اشتراک</h2>
          
          {plansLoading ? (
            <LoadingSpinner size="sm" />
          ) : plansError ? (
            <ErrorMessage message={plansError} />
          ) : plans.length > 0 ? (
            <div className="space-y-3">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  id={plan.id}
                  name={plan.name}
                  quotaGb={plan.quota_gb}
                  durationDays={plan.duration_days}
                  price={plan.price}
                  onSelect={(planId) => {
                    // TODO: Implement purchase flow
                    console.log('Selected plan:', planId);
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">پلنی یافت نشد</p>
          )}
        </section>

        {/* Info Footer */}
        <footer className="mt-8 text-center text-xs text-gray-600">
          <p>پشتیبانی: @varvpn_support</p>
        </footer>
      </main>
    </div>
  );
}
