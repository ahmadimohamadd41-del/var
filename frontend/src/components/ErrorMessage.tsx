import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="card mb-4 border-red-900 bg-red-900/10">
      <div className="flex items-center gap-3 mb-3">
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-red-400">خطا</h3>
      </div>
      <p className="text-gray-300 mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary w-full">
          تلاش مجدد
        </button>
      )}
    </div>
  );
}
