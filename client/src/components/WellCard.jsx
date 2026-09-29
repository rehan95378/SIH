import React from 'react';
import RiskBadge from './RiskBadge';
import { MapPin, Layers, Activity } from 'lucide-react';

const WellCard = ({ well, onClick, distance, compact = false }) => {
  const statusColors = {
    DRILLING: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    SUSPENDED: 'bg-amber-100 text-amber-700',
    ABANDONED: 'bg-slate-100 text-slate-600',
    PRODUCING: 'bg-teal-100 text-teal-700',
    TESTING: 'bg-purple-100 text-purple-700',
  };

  return (
    <div
      className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all duration-200"
      onClick={() => onClick?.(well)}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">{well.wellName}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{well.field}</p>
        </div>
        <RiskBadge level={well.riskLevel || 'LOW'} size="xs" />
      </div>

      {!compact && (
        <div className="space-y-1.5 mt-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Activity className="w-3.5 h-3.5" />
            <span>Depth: <span className="font-medium text-slate-700">{well.currentDepth?.toLocaleString()}m</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Layers className="w-3.5 h-3.5" />
            <span>{well.currentFormation || 'Formation unknown'}</span>
          </div>
          {distance !== undefined && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>Distance: <span className="font-medium text-blue-600">{distance.toFixed(2)} km</span></span>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[well.status] || 'bg-slate-100 text-slate-600'}`}>
          {well.status}
        </span>
        {well.eventCount !== undefined && (
          <span className="text-xs text-slate-400">{well.eventCount} verified events</span>
        )}
      </div>
    </div>
  );
};

export default WellCard;
