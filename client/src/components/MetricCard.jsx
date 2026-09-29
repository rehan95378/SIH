import React from 'react';

const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend, badge }) => {
  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', value: 'text-blue-700' },
    green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', value: 'text-emerald-700' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', value: 'text-amber-700' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', value: 'text-orange-700' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', value: 'text-red-700' },
    slate: { bg: 'bg-slate-50', icon: 'text-slate-600', value: 'text-slate-700' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', value: 'text-purple-700' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
          {Icon && <Icon className={`w-5 h-5 ${c.icon}`} />}
        </div>
        {badge && <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">{badge}</span>}
      </div>
      <div className={`text-2xl font-bold ${c.value} mb-1`}>{value}</div>
      <div className="text-sm font-medium text-slate-600">{title}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
      {trend && (
        <div className={`text-xs mt-2 ${trend > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
        </div>
      )}
    </div>
  );
};

export default MetricCard;
