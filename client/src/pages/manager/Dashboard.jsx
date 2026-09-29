import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import MetricCard from '../../components/MetricCard';
import RiskBadge from '../../components/RiskBadge';
import WellMap from '../../components/WellMap';
import { LoadingState } from '../../components/States';
import {
  Activity, AlertTriangle, Database, Users, TrendingUp, Layers, Radio
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const ManagerDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [wells, setWells] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ovRes, wellsRes, alertsRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/wells'),
        api.get('/risks?status=OPEN'),
      ]);
      setOverview(ovRes.data.data);
      setWells(wellsRes.data.data);
      setAlerts(alertsRes.data.data);

      // Get AI briefing
      api.post('/ai/operations-summary').then(res => {
        setBriefing(res.data.data);
      }).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Loading operations intelligence..." />;

  const { metrics, riskDistribution = [], eventTypeDistribution = [] } = overview || {};
  const riskColors = { LOW: '#10b981', MEDIUM: '#f59e0b', HIGH: '#f97316', CRITICAL: '#ef4444' };

  const activeWells = wells.filter(w => w.status === 'DRILLING');
  const highRiskWells = wells.filter(w => ['HIGH', 'CRITICAL'].includes(w.riskLevel));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Operations Intelligence Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">Multi-well operations monitoring and risk management</p>
        </div>
      </div>

      {/* AI Briefing */}
      {briefing && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs">AI</span>
            </div>
            <span className="text-sm font-semibold text-blue-800">AI Operations Briefing</span>
            {!briefing.isAIGenerated && <span className="text-xs text-slate-400">(deterministic)</span>}
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{briefing.summary}</p>
          <p className="text-xs text-slate-400 mt-2 italic">{briefing.disclaimer}</p>
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard title="Active Wells" value={metrics.activeWells} icon={Radio} color="blue" />
          <MetricCard title="High-Risk Wells" value={metrics.highRiskWells} icon={AlertTriangle} color={metrics.highRiskWells > 0 ? 'orange' : 'green'} />
          <MetricCard title="Open Alerts" value={metrics.openAlerts} icon={Activity} color={metrics.openAlerts > 0 ? 'red' : 'green'} />
          <MetricCard title="Pending Reviews" value={metrics.pendingReviews} icon={Layers} color="amber" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Risk Heatmap */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <h3 className="text-sm font-semibold text-slate-700">Enterprise Risk Heatmap</h3>
              <p className="text-xs text-slate-400">All wells colored by risk level</p>
            </div>
            <WellMap
              activeWell={activeWells[0]}
              nearbyWells={wells.filter(w => w._id !== activeWells[0]?._id)}
              height="380px"
            />
          </div>
        </div>

        {/* High risk wells */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">High-Risk Wells</h3>
          <div className="space-y-2">
            {highRiskWells.length === 0 && <p className="text-xs text-slate-400">No high-risk wells.</p>}
            {highRiskWells.map(well => (
              <div key={well._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <div className="text-sm font-semibold text-slate-700">{well.wellName}</div>
                  <div className="text-xs text-slate-400">{well.field} · {well.currentDepth}m</div>
                </div>
                <RiskBadge level={well.riskLevel} size="xs" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      {riskDistribution.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Risk Alert Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={riskDistribution.map(r => ({ name: r._id, value: r.count }))} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {riskDistribution.map((r, i) => (
                    <Cell key={i} fill={riskColors[r._id] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Event Types</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={eventTypeDistribution.slice(0, 6).map(e => ({ name: e._id?.replace(/_/g, ' ')?.substring(0, 12), count: e.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent alerts table */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Open Risk Alerts</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-left px-3 py-2 font-medium">Well</th>
                  <th className="text-left px-3 py-2 font-medium">Event</th>
                  <th className="text-left px-3 py-2 font-medium">Risk</th>
                  <th className="text-left px-3 py-2 font-medium">Depth Diff</th>
                  <th className="text-left px-3 py-2 font-medium">Distance</th>
                  <th className="text-left px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.slice(0, 10).map(a => (
                  <tr key={a._id} className="border-t border-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-700">{a.activeWellName || a.activeWellId?.wellName}</td>
                    <td className="px-3 py-2 text-slate-600">{a.eventType?.replace(/_/g, ' ')}</td>
                    <td className="px-3 py-2"><RiskBadge level={a.riskLevel} size="xs" /></td>
                    <td className="px-3 py-2 text-slate-600">{a.depthDifference}m</td>
                    <td className="px-3 py-2 text-slate-600">{a.distance} km</td>
                    <td className="px-3 py-2"><span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">OPEN</span></td>
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

export default ManagerDashboard;
