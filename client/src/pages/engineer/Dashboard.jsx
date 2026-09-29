import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import RiskBadge from '../../components/RiskBadge';
import MetricCard from '../../components/MetricCard';
import AlertCard from '../../components/AlertCard';
import { LoadingState, ErrorState } from '../../components/States';
import {
  Activity, AlertTriangle, MapPin, Layers, BarChart2, Radio,
  RefreshCw, TrendingUp, Database, Zap, Target
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const EngineerDashboard = () => {
  const navigate = useNavigate();
  const [wells, setWells] = useState([]);
  const [activeWell, setActiveWell] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [readings, setReadings] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(() => loadReadings(), 15000); // Refresh telemetry every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeWell) {
      loadReadings();
      loadAlerts();
    }
  }, [activeWell?._id]);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const [wellsRes, overviewRes] = await Promise.all([
        api.get('/wells?status=DRILLING'),
        api.get('/analytics/overview'),
      ]);
      const drillingWells = wellsRes.data.data;
      setWells(drillingWells);
      setOverview(overviewRes.data.data);
      if (drillingWells.length > 0) setActiveWell(drillingWells[0]);
    } catch (e) {
      setError('Failed to load dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadReadings = async () => {
    if (!activeWell) return;
    try {
      const res = await api.get(`/readings/${activeWell._id}?limit=60`);
      setReadings(res.data.data.slice(0, 60).reverse());
    } catch {}
  };

  const loadAlerts = async () => {
    if (!activeWell) return;
    try {
      const res = await api.get(`/risks/active/${activeWell._id}`);
      setAlerts(res.data.data.filter(a => a.status === 'OPEN'));
    } catch {}
  };

  const handleAcknowledge = async (alert) => {
    try {
      await api.post(`/risks/${alert._id}/acknowledge`, { note: 'Acknowledged from dashboard' });
      setAlerts(prev => prev.filter(a => a._id !== alert._id));
    } catch {}
  };

  const handleAskAI = (alert) => {
    navigate(`/engineer/ai-assistant?query=${encodeURIComponent(alert.reason)}&wellId=${activeWell?._id}`);
  };

  if (loading) return <LoadingState message="Loading drilling intelligence..." />;
  if (error) return <ErrorState message={error} onRetry={loadDashboard} />;

  const telemetryData = readings.slice(-20).map((r, i) => ({
    i,
    depth: r.depth,
    torque: r.torque,
    rpm: r.rpm,
    rop: r.rop,
    pressure: r.pressure,
    mudWeight: r.mudWeight,
  }));

  const latest = readings[readings.length - 1];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Live Drilling Command Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time drilling intelligence and risk monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 pulse-slow" />
            Representative Demonstration Telemetry
          </div>
          <button onClick={loadDashboard} className="w-8 h-8 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active well selector */}
      {wells.length > 1 && (
        <div className="flex gap-2">
          {wells.map(w => (
            <button
              key={w._id}
              onClick={() => setActiveWell(w)}
              className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
                activeWell?._id === w._id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200'
              }`}
            >
              {w.wellName}
            </button>
          ))}
        </div>
      )}

      {/* Active well hero card */}
      {activeWell && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-800">{activeWell.wellName}</h2>
                  <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-slow" />
                    DRILLING
                  </div>
                </div>
                <p className="text-sm text-slate-500">{activeWell.field} · {activeWell.operator}</p>
              </div>
            </div>
            <RiskBadge level={activeWell.riskLevel || 'LOW'} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Current Depth</p>
              <p className="text-xl font-bold text-slate-800">{activeWell.currentDepth?.toLocaleString()}<span className="text-sm font-normal text-slate-400 ml-0.5">m</span></p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Target Depth</p>
              <p className="text-xl font-bold text-slate-800">{activeWell.targetDepth?.toLocaleString()}<span className="text-sm font-normal text-slate-400 ml-0.5">m</span></p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Current Formation</p>
              <p className="text-sm font-semibold text-slate-700">{activeWell.currentFormation || 'N/A'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min((activeWell.currentDepth / activeWell.targetDepth) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-600">
                  {((activeWell.currentDepth / activeWell.targetDepth) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Live telemetry grid */}
          {latest && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Latest Drilling Parameters</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
                {[
                  { label: 'Torque', value: latest.torque?.toFixed(1), unit: 'kNm' },
                  { label: 'RPM', value: latest.rpm?.toFixed(0), unit: 'rpm' },
                  { label: 'WOB', value: latest.wob?.toFixed(0), unit: 'kN' },
                  { label: 'ROP', value: latest.rop?.toFixed(1), unit: 'm/hr' },
                  { label: 'Mud Wt', value: latest.mudWeight?.toFixed(3), unit: 'SG' },
                  { label: 'Mud Flow', value: latest.mudFlow?.toFixed(0), unit: 'L/min' },
                  { label: 'Pressure', value: latest.pressure?.toFixed(0), unit: 'bar' },
                  { label: 'Temp', value: latest.temperature?.toFixed(1), unit: '°C' },
                  { label: 'Hook Load', value: latest.hookLoad?.toFixed(0), unit: 'kN' },
                ].map(p => (
                  <div key={p.label} className="bg-slate-50 rounded-lg p-2.5 text-center">
                    <p className="text-xs text-slate-400 mb-1">{p.label}</p>
                    <p className="font-bold text-slate-800">{p.value || '—'}</p>
                    <p className="text-xs text-slate-400">{p.unit}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Metrics */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard title="Active Wells" value={overview.metrics.activeWells} icon={Radio} color="blue" />
          <MetricCard title="Open Alerts" value={overview.metrics.openAlerts} icon={AlertTriangle} color={overview.metrics.openAlerts > 0 ? 'orange' : 'green'} />
          <MetricCard title="Verified Events" value={overview.metrics.totalEvents} icon={Database} color="slate" />
          <MetricCard title="Pending Reviews" value={overview.metrics.pendingReviews} icon={Layers} color="amber" />
        </div>
      )}

      {/* Telemetry charts */}
      {telemetryData.length > 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Torque & RPM vs Depth</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={telemetryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="depth" tick={{ fontSize: 10 }} label={{ value: 'Depth (m)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="torque" stroke="#2563eb" name="Torque (kNm)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="rpm" stroke="#7c3aed" name="RPM" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">ROP & Pressure vs Depth</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={telemetryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="depth" tick={{ fontSize: 10 }} label={{ value: 'Depth (m)', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="rop" stroke="#0d9488" name="ROP (m/hr)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="pressure" stroke="#f97316" name="Pressure (bar)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Risk Alerts */}
      {alerts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-semibold text-slate-700">Active Risk Alerts</h2>
            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">{alerts.length} open</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map(alert => (
              <AlertCard
                key={alert._id}
                alert={alert}
                onAcknowledge={handleAcknowledge}
                onAskAI={handleAskAI}
                onViewSource={() => navigate(`/engineer/reports`)}
                onCompare={() => navigate(`/engineer/offset-intelligence`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Well Map', icon: MapPin, path: '/engineer/map', color: 'text-blue-600 bg-blue-50', desc: 'View nearby wells' },
          { label: 'Digital Twin', icon: Zap, path: '/engineer/digital-twin', color: 'text-purple-600 bg-purple-50', desc: 'Well visualization' },
          { label: 'AI Copilot', icon: Target, path: '/engineer/ai-assistant', color: 'text-teal-600 bg-teal-50', desc: 'Ask about history' },
          { label: 'Analytics', icon: BarChart2, path: '/engineer/analytics', color: 'text-orange-600 bg-orange-50', desc: 'Charts & trends' },
        ].map(item => (
          <button key={item.path} onClick={() => navigate(item.path)} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-left hover:shadow-md hover:border-blue-100 transition-all">
            <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center mb-2`}>
              <item.icon className="w-4 h-4" />
            </div>
            <div className="text-sm font-semibold text-slate-700">{item.label}</div>
            <div className="text-xs text-slate-400">{item.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EngineerDashboard;
