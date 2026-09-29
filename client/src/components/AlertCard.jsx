import React from 'react';
import RiskBadge from './RiskBadge';
import { AlertTriangle, MapPin, Layers, FileText, CheckCircle } from 'lucide-react';

const AlertCard = ({ alert, onAcknowledge, onAskAI, onViewSource, onCompare }) => {
  const isOpen = alert.status === 'OPEN';
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 ${isOpen ? 'border-orange-200' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4 h-4 ${isOpen ? 'text-orange-500' : 'text-slate-400'}`} />
          <span className="font-semibold text-sm text-slate-800">
            {alert.eventType?.replace(/_/g, ' ')} Risk
          </span>
        </div>
        <RiskBadge level={alert.riskLevel} size="xs" />
      </div>

      <p className="text-xs text-slate-600 mb-3 leading-relaxed">{alert.reason}</p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-slate-50 rounded-lg p-2">
          <p className="text-xs text-slate-400 mb-0.5">Active Well</p>
          <p className="text-xs font-semibold text-slate-700">{alert.activeWellName || alert.activeWellId?.wellName}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <p className="text-xs text-slate-400 mb-0.5">Offset Well</p>
          <p className="text-xs font-semibold text-slate-700">{alert.offsetWellName || alert.offsetWellId?.wellName}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <p className="text-xs text-slate-400 mb-0.5">Depth Difference</p>
          <p className="text-xs font-semibold text-slate-700">{alert.depthDifference}m</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2">
          <p className="text-xs text-slate-400 mb-0.5">Distance</p>
          <p className="text-xs font-semibold text-slate-700">{alert.distance} km</p>
        </div>
      </div>

      {alert.evidence?.length > 0 && (
        <div className="text-xs text-slate-500 flex items-center gap-1 mb-3">
          <FileText className="w-3.5 h-3.5" />
          Evidence: {alert.evidence[0].documentTitle} · Page {alert.evidence[0].page}
        </div>
      )}

      {isOpen ? (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-50">
          {onAcknowledge && (
            <button
              onClick={() => onAcknowledge(alert)}
              className="text-xs px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 flex items-center gap-1"
            >
              <CheckCircle className="w-3 h-3" /> Acknowledge
            </button>
          )}
          {onAskAI && (
            <button
              onClick={() => onAskAI(alert)}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Ask AI
            </button>
          )}
          {onViewSource && (
            <button
              onClick={() => onViewSource(alert)}
              className="text-xs px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
            >
              View Source
            </button>
          )}
          {onCompare && (
            <button
              onClick={() => onCompare(alert)}
              className="text-xs px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
            >
              Compare Well
            </button>
          )}
        </div>
      ) : (
        <div className="text-xs text-emerald-600 flex items-center gap-1 pt-3 border-t border-slate-50">
          <CheckCircle className="w-3.5 h-3.5" />
          Acknowledged{alert.acknowledgedAt ? ` · ${new Date(alert.acknowledgedAt).toLocaleString()}` : ''}
        </div>
      )}
    </div>
  );
};

export default AlertCard;
