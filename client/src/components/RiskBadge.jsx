import React from 'react';

const riskConfig = {
  LOW: { label: 'Low Risk', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500' },
  MEDIUM: { label: 'Medium Risk', className: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
  HIGH: { label: 'High Risk', className: 'bg-orange-50 text-orange-700 border border-orange-200', dot: 'bg-orange-500' },
  CRITICAL: { label: 'Critical Risk', className: 'bg-red-50 text-red-700 border border-red-200', dot: 'bg-red-500' },
};

const RiskBadge = ({ level, showLabel = true, size = 'sm' }) => {
  const config = riskConfig[level] || riskConfig.LOW;
  const padding = size === 'xs' ? 'px-1.5 py-0.5 text-xs' : size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full ${padding} ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {showLabel ? config.label : level}
    </span>
  );
};

export default RiskBadge;
