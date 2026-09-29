import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import DigitalWellTwin from '../../components/DigitalWellTwin';
import { LoadingState } from '../../components/States';

const DigitalTwin = () => {
  const [wells, setWells] = useState([]);
  const [selectedWell, setSelectedWell] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/wells').then(res => {
      setWells(res.data.data);
      if (res.data.data.length > 0) loadWell(res.data.data[0]);
    }).finally(() => setLoading(false));
  }, []);

  const loadWell = async (well) => {
    setSelectedWell(well);
    try {
      const [wellRes, eventsRes] = await Promise.all([
        api.get(`/wells/${well._id}`),
        api.get(`/events?wellId=${well._id}&verificationStatus=APPROVED`),
      ]);
      setSelectedWell(wellRes.data.data);
      setEvents(eventsRes.data.data);
    } catch {}
  };

  if (loading) return <LoadingState message="Loading digital twin..." />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Digital Well Twin</h1>
        <p className="text-sm text-slate-500 mt-0.5">Interactive stratigraphic visualization using verified well data</p>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-600">Select Well:</label>
        <select
          onChange={e => loadWell(wells.find(w => w._id === e.target.value))}
          className="text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {wells.map(w => <option key={w._id} value={w._id}>{w.wellName} — {w.field}</option>)}
        </select>
      </div>

      <DigitalWellTwin well={selectedWell} events={events} currentDepth={selectedWell?.currentDepth} />

      {events.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Verified Historical Events</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-left px-3 py-2 font-medium rounded-l-lg">Event Type</th>
                  <th className="text-left px-3 py-2 font-medium">Depth</th>
                  <th className="text-left px-3 py-2 font-medium">Formation</th>
                  <th className="text-left px-3 py-2 font-medium">Severity</th>
                  <th className="text-left px-3 py-2 font-medium">Description</th>
                  <th className="text-left px-3 py-2 font-medium rounded-r-lg">Mitigation</th>
                </tr>
              </thead>
              <tbody>
                {events.map(ev => (
                  <tr key={ev._id} className="border-t border-slate-50 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-700">{ev.eventType?.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2 text-slate-600">{ev.depth}m</td>
                    <td className="px-3 py-2 text-slate-600">{ev.formation || '—'}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        ev.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        ev.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        ev.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>{ev.severity}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-500 max-w-xs truncate">{ev.description?.substring(0, 80)}...</td>
                    <td className="px-3 py-2 text-slate-500 max-w-xs truncate">{ev.mitigation?.substring(0, 60)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalTwin;
