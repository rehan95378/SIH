import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingState, EmptyState } from '../../components/States';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const Incidents = () => {
  const [events, setEvents] = useState([]);
  const [wells, setWells] = useState([]);
  const [selectedWell, setSelectedWell] = useState('');
  const [eventType, setEventType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/events?verificationStatus=APPROVED'),
      api.get('/wells'),
    ]).then(([eventsRes, wellsRes]) => {
      setEvents(eventsRes.data.data);
      setWells(wellsRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = events.filter(e => {
    if (selectedWell && e.wellId?._id !== selectedWell) return false;
    if (eventType && e.eventType !== eventType) return false;
    return true;
  });

  const eventTypes = [...new Set(events.map(e => e.eventType))];

  if (loading) return <LoadingState message="Loading incidents..." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Incident History & Replay</h1>
        <p className="text-sm text-slate-500 mt-0.5">Verified historical drilling incidents from the knowledge base</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Well</label>
          <select value={selectedWell} onChange={e => setSelectedWell(e.target.value)} className="text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none">
            <option value="">All Wells</option>
            {wells.map(w => <option key={w._id} value={w._id}>{w.wellName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Event Type</label>
          <select value={eventType} onChange={e => setEventType(e.target.value)} className="text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none">
            <option value="">All Types</option>
            {eventTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <span className="text-sm text-slate-500">{filtered.length} events</span>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {filtered.length === 0 && <EmptyState title="No events found" message="Adjust filters or add verified events." />}
        {filtered.map((event, idx) => {
          const severityColor = {
            CRITICAL: 'border-red-500 bg-red-50',
            HIGH: 'border-orange-500 bg-orange-50',
            MEDIUM: 'border-amber-500 bg-amber-50',
            LOW: 'border-emerald-500 bg-emerald-50',
          }[event.severity] || 'border-slate-300 bg-slate-50';

          return (
            <div key={event._id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  event.severity === 'CRITICAL' || event.severity === 'HIGH' ? 'border-orange-400 bg-orange-50' : 'border-slate-300 bg-slate-50'
                }`}>
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                </div>
                {idx < filtered.length - 1 && <div className="w-0.5 h-full bg-slate-100 mt-1" />}
              </div>
              <div className={`flex-1 rounded-xl border-l-4 p-4 mb-2 ${severityColor}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm">{event.eventType?.replace(/_/g, ' ')}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        event.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        event.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        event.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>{event.severity}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {event.wellId?.wellName} · {event.depth}m · {event.formation || 'Unknown formation'}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <div>{event.nptHours > 0 ? `NPT: ${event.nptHours}hrs` : ''}</div>
                    <div className="flex items-center gap-1 text-emerald-600 mt-1">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mb-2">{event.description}</p>
                {event.mitigation && (
                  <div className="bg-white/70 rounded-lg p-2 text-xs text-slate-600 border border-white/50">
                    <strong>Mitigation:</strong> {event.mitigation}
                  </div>
                )}
                {event.outcome && (
                  <div className="mt-1 text-xs text-slate-500">
                    <strong>Outcome:</strong> {event.outcome}
                  </div>
                )}
                {event.sourceDocumentId && (
                  <div className="mt-2 text-xs text-blue-600">
                    Source: {event.sourceDocumentId.title || 'Document'} · Page {event.sourcePage}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Incidents;
