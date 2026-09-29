import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import MetricCard from '../../components/MetricCard';
import { LoadingState } from '../../components/States';
import { Users, FileText, Database, Activity, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/admin/system-health'),
    ]).then(([ovRes, healthRes]) => {
      setOverview(ovRes.data.data);
      setHealth(healthRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading admin dashboard..." />;

  const { metrics } = overview || {};

  const quickLinks = [
    { label: 'User Management', path: '/admin/users', icon: Users, color: 'blue', desc: 'Manage engineers & managers' },
    { label: 'Upload Documents', path: '/admin/reports', icon: FileText, color: 'purple', desc: 'Ingest drilling reports' },
    { label: 'AI Extraction', path: '/admin/extraction-review', icon: Shield, color: 'teal', desc: 'Review AI-extracted data' },
    { label: 'Verify Knowledge', path: '/admin/data-verification', icon: CheckCircle, color: 'green', desc: 'Approve/reject extractions' },
    { label: 'Data Quality', path: '/admin/data-quality', icon: AlertTriangle, color: 'amber', desc: 'Monitor data integrity' },
    { label: 'System Health', path: '/admin/system-health', icon: Activity, color: 'slate', desc: 'Monitor all services' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Trusted Knowledge & Security Center</h1>
        <p className="text-sm text-slate-500 mt-0.5">System administration and knowledge verification</p>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard title="Total Users" value={metrics.totalUsers} icon={Users} color="blue" />
          <MetricCard title="Total Wells" value={metrics.totalWells} icon={Database} color="slate" />
          <MetricCard title="Verified Events" value={metrics.totalEvents} icon={CheckCircle} color="green" />
          <MetricCard title="Pending Reviews" value={metrics.pendingReviews} icon={AlertTriangle} color={metrics.pendingReviews > 0 ? 'amber' : 'green'} />
        </div>
      )}

      {/* System health */}
      {health && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">System Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(health.services).map(([key, svc]) => {
              const ok = ['HEALTHY', 'CONNECTED', 'CONFIGURED', 'INDEXED'].includes(svc.status);
              const warn = ['DEGRADED', 'NOT_INDEXED'].includes(svc.status);
              const svcLabels = { HEALTHY: 'Healthy', CONNECTED: 'Connected', CONFIGURED: 'Configured', INDEXED: 'Indexed', DEGRADED: 'Degraded', NOT_CONFIGURED: 'Not Configured', NOT_INDEXED: 'Not Indexed', DISCONNECTED: 'Disconnected', UNAVAILABLE: 'Unavailable', UNKNOWN: 'Checking…' };
              return (
                <div key={key} className={`rounded-lg p-3 border ${ok ? 'bg-emerald-50 border-emerald-100' : warn ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                  <div className="text-xs font-semibold text-slate-600 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div className={`text-xs font-bold ${ok ? 'text-emerald-700' : warn ? 'text-amber-700' : 'text-red-600'}`}>
                    {svcLabels[svc.status] || svc.status}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {quickLinks.map(item => (
          <Link key={item.path} to={item.path} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-blue-100 transition-all">
            <div className={`w-10 h-10 rounded-lg bg-${item.color}-50 flex items-center justify-center mb-3`}>
              <item.icon className={`w-5 h-5 text-${item.color}-600`} />
            </div>
            <div className="text-sm font-semibold text-slate-700">{item.label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
