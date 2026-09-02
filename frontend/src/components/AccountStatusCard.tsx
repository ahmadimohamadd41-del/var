import React from 'react';
import { AccountStatus } from '../types/api';

interface AccountStatusCardProps {
  status: AccountStatus;
}

export function AccountStatusCard({ status }: AccountStatusCardProps) {
  const { customer, entitlement, purchases_count, message } = status;
  
  // Format numbers in Persian
  const formatNumber = (num: number) => new Intl.NumberFormat('fa-IR').format(num);
  
  return (
    <div className="card mb-4">
      {/* User Info */}
      {customer && (
        <div className="mb-4 pb-4 border-b border-dark-border">
          <h3 className="text-lg font-semibold text-white mb-2">
            سلام، {customer.first_name || customer.username || 'کاربر'} 👋
          </h3>
          <p className="text-sm text-gray-400">
            شناسه کاربری: {formatNumber(customer.telegram_id)}
          </p>
        </div>
      )}
      
      {/* Subscription Status */}
      <div>
        <h4 className="text-md font-medium text-white mb-3">وضعیت اشتراک</h4>
        
        {entitlement ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-dark-bg p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">حجم کل</p>
                <p className="text-lg font-bold text-primary-400">
                  {formatNumber(entitlement.total_quota_gb)} گیگابایت
                </p>
              </div>
              <div className="bg-dark-bg p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">حجم مصرف شده</p>
                <p className="text-lg font-bold text-orange-400">
                  {formatNumber(Math.round(entitlement.used_quota_gb || 0))} گیگابایت
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-dark-bg p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">حجم باقی‌مانده</p>
                <p className="text-lg font-bold text-green-400">
                  {formatNumber(Math.round(entitlement.remaining_quota_gb))} گیگابایت
                </p>
              </div>
              <div className="bg-dark-bg p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">روزهای باقی‌مانده</p>
                <p className="text-lg font-bold text-blue-400">
                  {entitlement.days_remaining !== null ? formatNumber(entitlement.days_remaining) : '∞'} روز
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>مصرف حجم</span>
                <span>{Math.round((entitlement.used_quota_gb / entitlement.total_quota_gb) * 100)}%</span>
              </div>
              <div className="w-full bg-dark-bg rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (entitlement.used_quota_gb / entitlement.total_quota_gb) > 0.8 
                      ? 'bg-red-500' 
                      : 'bg-primary-600'
                  }`}
                  style={{ 
                    width: `${Math.min(100, (entitlement.used_quota_gb / entitlement.total_quota_gb) * 100)}%` 
                  }}
                />
              </div>
            </div>
            
            {entitlement.expiration_date && (
              <p className="text-xs text-gray-500 mt-3">
                تاریخ انقضا: {new Date(entitlement.expiration_date).toLocaleDateString('fa-IR')}
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-400 mb-2">{message || 'اشتراک فعال ندارید'}</p>
            <p className="text-sm text-primary-400">برای خرید اشتراک، یکی از پلن‌های زیر را انتخاب کنید</p>
          </div>
        )}
      </div>
      
      {/* Purchase History */}
      {purchases_count > 0 && (
        <div className="mt-4 pt-4 border-t border-dark-border">
          <p className="text-sm text-gray-500">
            تعداد خریدها: <span className="text-white">{formatNumber(purchases_count)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
