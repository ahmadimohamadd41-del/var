import React from 'react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-dark-bg/95 backdrop-blur border-b border-dark-border px-4 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-white">VAR VPN</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">نسخه ۱.۰</span>
        </div>
      </div>
    </header>
  );
}
