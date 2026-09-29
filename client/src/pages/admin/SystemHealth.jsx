import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingState } from '../../components/States';

const SystemHealth = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ragStatus, setRagStatus] = useState(null);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHealth = async () => {
    try {
      const [healthRes, ragRes] = await Promise.all([
        api.get('/admin/system-health'),
        api.get('/rag/status'),
      ]);
      setHealth(healthRes.data.data);
      setRagStatus(ragRes.data.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message="Checking system health..." />;

  const statusBg = (status) => {
    if (['HEALTHY', 'CONNECTED', 'CONFIGURED', 'INDEXED'].includes(status)) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (['UNAVAILABLE', 'DISCONNECTED', 'NOT_CONFIGURED'].includes(status)) return 'bg-red-50 border-red-200 text-red-700';
    if (['DEGRADED', 'NOT_INDEXED'].includes(status)) return 'bg-amber-50 border-amber-200 text-amber-700';
    return 'bg-amber-50 border-amber-200 text-amber-700';
  };

  const statusLabel = (key, status) => {
    const labels = {
      HEALTHY: 'Healthy',
      CONNECTED: 'Connected',
      CONFIGURED: 'Configured',
      INDEXED: 'Indexed',
      DEGRADED: 'Degraded',
      NOT_CONFIGURED: 'Not Configured',
      NOT_INDEXED: 'Not Indexed',
      DISCONNECTED: 'Disconnected',
      UNAVAILABLE: 'Unavailable',
      UNKNOWN: 'Checking…',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">System Health Monitor</h1>
        <p className="text-sm text-slate-500">Real-time service status and infrastructure monitoring</p>
      </div>

      {health && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(health.services).map(([key, svc]) => (
              <div key={key} className={`rounded-xl border p-4 ${statusBg(svc.status)}`}>
                  <div className="text-xs font-semibold capitalize mb-2">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div className="text-lg font-bold">{statusLabel(key, svc.status)}</div>
                  <div className="text-xs mt-1 opacity-75">{svc.message}</div>
                </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Backend Stats</h3>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex justify-between"><span>Uptime</span><span className="font-medium text-slate-700">{Math.floor(health.services.backend?.uptime || 0)}s</span></div>
                <div className="flex justify-between"><span>Memory (used)</span><span className="font-medium text-slate-700">{Math.round((health.services.backend?.memory?.heapUsed || 0) / 1024 / 1024)}MB</span></div>
                <div className="flex justify-between"><span>Platform</span><span className="font-medium text-slate-700">{health.system?.platform}</span></div>
                <div className="flex justify-between"><span>CPUs</span><span className="font-medium text-slate-700">{health.system?.cpus}</span></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Knowledge Base</h3>
              <div className="space-y-2 text-xs text-slate-500">
                <div className="flex justify-between"><span>Total Documents</span><span className="font-medium text-slate-700">{health.stats?.totalDocs}</span></div>
                <div className="flex justify-between"><span>Verified Events</span><span className="font-medium text-slate-700">{health.stats?.totalEvents}</span></div>
                <div className="flex justify-between"><span>RAG Chunks</span><span className="font-medium text-slate-700">{ragStatus?.totalChunks || 0}</span></div>
                <div className="flex justify-between"><span>Verified Chunks</span><span className="font-medium text-slate-700">{ragStatus?.verifiedChunks || 0}</span></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">AI Service</h3>
              <div className="space-y-2 text-xs text-slate-500">
                {(() => {
                  const aiSt = health.services.aiService?.status;
                  const gemSt = health.services.gemini?.status;
                  const faissSt = health.services.faiss?.status;
                  const svcLabels = { HEALTHY: 'Healthy', CONNECTED: 'Connected', CONFIGURED: 'Configured', INDEXED: 'Indexed', DEGRADED: 'Degraded', NOT_CONFIGURED: 'Not Configured', NOT_INDEXED: 'Not Indexed', DISCONNECTED: 'Disconnected', UNAVAILABLE: 'Unavailable', UNKNOWN: 'Checking…' };
                  const aiColor = aiSt === 'HEALTHY' ? 'text-emerald-600' : aiSt === 'DEGRADED' ? 'text-amber-600' : 'text-red-600';
                  const gemColor = gemSt === 'CONFIGURED' ? 'text-emerald-600' : 'text-amber-600';
                  const faissColor = faissSt === 'INDEXED' ? 'text-emerald-600' : 'text-amber-600';
                  return (
                    <>
                      <div className="flex justify-between"><span>Status</span><span className={`font-medium ${aiColor}`}>{svcLabels[aiSt] || aiSt}</span></div>
                      <div className="flex justify-between"><span>Gemini</span><span className={`font-medium ${gemColor}`}>{svcLabels[gemSt] || gemSt}</span></div>
                      <div className="flex justify-between"><span>FAISS</span><span className={`font-medium ${faissColor}`}>{svcLabels[faissSt] || faissSt}</span></div>
                      <div className="flex justify-between"><span>Last Indexed</span><span className="font-medium text-slate-700">{ragStatus?.lastIndexed ? new Date(ragStatus.lastIndexed).toLocaleDateString() : 'Never'}</span></div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 text-right">Last updated: {new Date(health.timestamp).toLocaleTimeString()}</div>
        </>
      )}
    </div>
  );
};

export default SystemHealth;
