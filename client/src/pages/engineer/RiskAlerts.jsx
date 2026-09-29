import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RiskBadge from '../../components/RiskBadge';
import AlertCard from '../../components/AlertCard';
import { LoadingState, EmptyState } from '../../components/States';
import { AlertTriangle, RefreshCw, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RiskAlerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [wells, setWells] = useState([]);
  const [selectedWell, setSelectedWell] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterStatus, setFilterStatus] = useState('OPEN');
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterLevel, filterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertsRes, wellsRes] = await Promise.all([
        api.get(`/risks?${filterLevel ? `riskLevel=${filterLevel}&` : ''}${filterStatus ? `status=${filterStatus}` : ''}`),
        api.get('/wells?status=DRILLING'),
      ]);
      setAlerts(alertsRes.data.data);
      setWells(wellsRes.data.data);
      if (!selectedWell && wellsRes.data.data.length > 0) setSelectedWell(wellsRes.data.data[0]._id);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedWell) return;
    setCalculating(true);
    try {
      const res = await api.post('/risks/calculate', { activeWellId: selectedWell, radius: 20 });
      alert(`${res.data.data?.length || 0} new risk alerts generated.`);
      loadData();
    } catch (e) {
      alert('Risk calculation failed: ' + (e.response?.data?.message || e.message));
    } finally {
      setCalculating(false);
    }
  };

  const handleAcknowledge = async (alert) => {
    const note = window.prompt('Acknowledgement note (optional):') || '';
    try {
      await api.post(`/risks/${alert._id}/acknowledge`, { note });
      loadData();
    } catch {}
  };

  if (loading) return <LoadingState message="Loading risk alerts..." />;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Risk Radar</h1>
          <p className="text-sm text-slate-500 mt-0.5">Historical risk indicators based on offset well intelligence</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 text-xs text-amber-700">
        <strong>Important:</strong> These are prototype historical-risk indicators based on verified offset well data. They represent historical patterns, not predictions. All indicators require engineering review.
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Well (for calculation)</label>
          <select value={selectedWell} onChange={e => setSelectedWell(e.target.value)} className="text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none">
            {wells.map(w => <option key={w._id} value={w._id}>{w.wellName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Risk Level</label>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className="text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none">
            <option value="">All Levels</option>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none">
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
          </select>
        </div>
        <button
          onClick={handleCalculate}
          disabled={calculating || !selectedWell}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Calculator className="w-4 h-4" />
          {calculating ? 'Calculating...' : 'Calculate Risks'}
        </button>
        <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Alerts grid */}
      {alerts.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-10 h-10" />}
          title="No risk alerts found"
          message="Run risk calculation to generate historical risk indicators for active wells."
        />
      ) : (
        <div>
          <p className="text-sm text-slate-500 mb-3">{alerts.length} alert(s) found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.map(alert => (
              <AlertCard
                key={alert._id}
                alert={alert}
                onAcknowledge={handleAcknowledge}
                onAskAI={(a) => navigate(`/engineer/ai-assistant?query=${encodeURIComponent(a.reason)}&wellId=${a.activeWellId?._id || a.activeWellId}`)}
                onViewSource={() => navigate('/engineer/reports')}
                onCompare={() => navigate('/engineer/offset-intelligence')}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskAlerts;
