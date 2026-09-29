import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingState, EmptyState } from '../../components/States';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#2563EB', '#0d9488', '#f97316', '#7c3aed', '#ef4444', '#eab308', '#64748b', '#14b8a6'];

const Analytics = () => {
  const [eventData, setEventData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [formationData, setFormationData] = useState([]);
  const [nptData, setNptData] = useState(null);
  const [readings, setReadings] = useState([]);
  const [wells, setWells] = useState([]);
  const [selectedWell, setSelectedWell] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (selectedWell) loadReadings();
  }, [selectedWell]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [eventRes, riskRes, formRes, nptRes, wellsRes] = await Promise.all([
        api.get('/analytics/events'),
        api.get('/analytics/risks'),
        api.get('/analytics/formations'),
        api.get('/analytics/npt'),
        api.get('/wells'),
      ]);
      setEventData(eventRes.data.data);
      setRiskData(riskRes.data.data);
      setFormationData(formRes.data.data);
      setNptData(nptRes.data.data);
      setWells(wellsRes.data.data);
      if (wellsRes.data.data.length > 0) setSelectedWell(wellsRes.data.data[0]._id);
    } finally {
      setLoading(false);
    }
  };

  const loadReadings = async () => {
    try {
      const res = await api.get(`/readings/${selectedWell}?limit=200`);
      setReadings(res.data.data.reverse());
    } catch {}
  };

  if (loading) return <LoadingState message="Loading analytics..." />;

  const eventTypeData = eventData?.byType?.map(e => ({
    name: e._id?.replace(/_/g, ' ') || 'Unknown',
    count: e.count,
    npt: e.totalNPT?.toFixed(1) || 0,
  })) || [];

  const formationChartData = formationData.slice(0, 8).map(f => ({
    name: f._id,
    events: f.totalEvents,
    npt: f.totalNPT?.toFixed(1) || 0,
  }));

  const riskByLevel = riskData?.byLevel?.map(r => ({ name: r._id, value: r.count })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Drilling Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Events, formations, risks, and telemetry analysis</p>
      </div>

      {/* Event Type Distribution */}
      {eventTypeData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Event Type Distribution (Verified Events)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={eventTypeData} margin={{ left: 0, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Bar dataKey="count" fill="#2563EB" name="Event Count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Formation Risk Chart */}
        {formationChartData.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Formation Event Frequency</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={formationChartData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="events" fill="#0d9488" name="Events" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Risk Level Pie */}
        {riskByLevel.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Risk Alert Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={riskByLevel} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {riskByLevel.map((entry, idx) => {
                    const c = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' };
                    return <Cell key={idx} fill={c[entry.name] || COLORS[idx]} />;
                  })}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Telemetry charts */}
      {readings.length > 5 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Well Telemetry</h3>
            <select
              value={selectedWell}
              onChange={e => setSelectedWell(e.target.value)}
              className="text-xs px-2 py-1 border border-slate-200 rounded-lg"
            >
              {wells.map(w => <option key={w._id} value={w._id}>{w.wellName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { key: 'torque', name: 'Torque (kNm)', color: '#2563EB' },
              { key: 'pressure', name: 'Pressure (bar)', color: '#f97316' },
              { key: 'mudWeight', name: 'Mud Weight (SG)', color: '#0d9488' },
              { key: 'rop', name: 'ROP (m/hr)', color: '#7c3aed' },
            ].map(param => (
              <div key={param.key}>
                <p className="text-xs font-medium text-slate-500 mb-2">{param.name} vs Depth</p>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={readings.slice(0, 100)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="depth" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                    <Line type="monotone" dataKey={param.key} stroke={param.color} dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* NPT Analytics */}
      {nptData && (nptData.nptByType?.length > 0 || nptData.nptByWell?.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">NPT (Non-Productive Time) Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {nptData.nptByType?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">NPT Hours by Event Type</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={nptData.nptByType.map(n => ({ name: n._id?.replace(/_/g, ' ')?.substring(0, 12), npt: parseFloat(n.totalNPT?.toFixed(1)), count: n.count }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-15} textAnchor="end" height={45} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                    <Bar dataKey="npt" fill="#f97316" name="NPT (hrs)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {nptData.nptByWell?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">NPT Hours by Well</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={nptData.nptByWell.map(n => ({ name: n.wellName?.substring(0, 8), npt: parseFloat(n.totalNPT?.toFixed(1)) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                    <Bar dataKey="npt" fill="#7c3aed" name="NPT (hrs)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
