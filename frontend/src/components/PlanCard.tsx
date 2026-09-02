import React from 'react';

interface PlanCardProps {
  id: number;
  name: string;
  quotaGb: number;
  durationDays: number;
  price: number;
  onSelect?: (planId: number) => void;
}

export function PlanCard({ id, name, quotaGb, durationDays, price, onSelect }: PlanCardProps) {
  // Format price in IRR (Iranian Rial)
  const formattedPrice = new Intl.NumberFormat('fa-IR').format(price);
  
  return (
    <div 
      className="card mb-3 cursor-pointer hover:border-primary-600 transition-colors"
      onClick={() => onSelect?.(id)}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-white">{name}</h3>
        <span className="text-primary-400 font-bold">{formattedPrice} ﷼</span>
      </div>
      
      <div className="flex justify-between text-sm text-gray-400 mb-3">
        <span>{quotaGb} گیگابایت</span>
        <span>{durationDays} روزه</span>
      </div>
      
      <button 
        className="btn-primary w-full"
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(id);
        }}
      >
        خرید اشتراک
      </button>
    </div>
  );
}
