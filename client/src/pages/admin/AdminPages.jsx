// Admin supporting pages

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingState } from '../../components/States';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');

  useEffect(() => {
    api.get(`/admin/audit-logs?limit=100${action ? `&action=${action}` : ''}`).then(r => setLogs(r.data.data)).finally(() => setLoading(false));
  }, [action]);

  const actions = ['LOGIN', 'USER_CREATED', 'ROLE_CHANGED', 'WELL_CREATED', 'REPORT_UPLOADED', 'DATA_APPROVED', 'DATA_REJECTED', 'KNOWLEDGE_INDEXED', 'RISK_ACKNOWLEDGED'];

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Audit Logs</h1>
          <p className="text-sm text-slate-500">{logs.length} log entries</p>
        </div>
        <select value={action} onChange={e => setAction(e.target.value)} className="text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none">
          <option value="">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="bg-slate-50 text-slate-500">
            <th className="text-left px-4 py-3 font-medium">Timestamp</th>
            <th className="text-left px-4 py-3 font-medium">User</th>
            <th className="text-left px-4 py-3 font-medium">Role</th>
            <th className="text-left px-4 py-3 font-medium">Action</th>
            <th className="text-left px-4 py-3 font-medium">Entity</th>
            <th className="text-left px-4 py-3 font-medium">Details</th>
          </tr></thead>
          <tbody>
            {logs.map(log => (
              <tr key={log._id} className="border-t border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-4 py-2.5 font-medium text-slate-700">{log.userId?.name || log.userName || '—'}</td>
                <td className="px-4 py-2.5"><span className="text-xs px-1.5 py-0.5 bg-slate-100 rounded">{log.userRole || '—'}</span></td>
                <td className="px-4 py-2.5"><span className="font-medium text-slate-700">{log.action?.replace(/_/g, ' ')}</span></td>
                <td className="px-4 py-2.5 text-slate-500">{log.entityType || '—'}</td>
                <td className="px-4 py-2.5 text-slate-400 max-w-xs truncate">{log.details ? JSON.stringify(log.details).substring(0, 80) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No audit logs yet.</div>}
      </div>
    </div>
  );
};

export const DataQuality = () => {
  const [quality, setQuality] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/data-quality').then(r => setQuality(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const severityColor = { HIGH: 'bg-red-100 text-red-700', MEDIUM: 'bg-amber-100 text-amber-700', INFO: 'bg-blue-100 text-blue-700' };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Data Quality Dashboard</h1>
        <p className="text-sm text-slate-500">Detect and resolve data integrity issues</p>
      </div>
      <div className={`text-center p-6 rounded-xl border ${quality?.qualityScore >= 80 ? 'bg-emerald-50 border-emerald-200' : quality?.qualityScore >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
        <div className="text-4xl font-bold text-slate-800">{quality?.qualityScore}%</div>
        <div className="text-sm text-slate-500 mt-1">Overall Data Quality Score</div>
      </div>
      <div className="space-y-3">
        {quality?.issues?.length === 0 && <div className="text-center py-8 text-emerald-600 font-medium text-sm">✓ No data quality issues detected.</div>}
        {quality?.issues?.map((issue, i) => (
          <div key={i} className={`rounded-xl border p-4 flex items-start gap-3 ${severityColor[issue.severity] || 'bg-slate-50 border-slate-200'}`}>
            <div className="text-2xl font-bold">{issue.count}</div>
            <div>
              <div className="font-semibold text-sm">{issue.type?.replace(/_/g, ' ')}</div>
              <div className="text-xs mt-0.5 opacity-80">{issue.message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const KnowledgeBase = () => {
  const [ragStatus, setRagStatus] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [indexing, setIndexing] = useState({});

  useEffect(() => {
    Promise.all([
      api.get('/rag/status').then(r => setRagStatus(r.data.data)),
      api.get('/reports?extractionStatus=COMPLETED').then(r => setDocs(r.data.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleIndex = async (docId) => {
    setIndexing(p => ({ ...p, [docId]: true }));
    try {
      await api.post('/rag/index', { documentId: docId });
      api.get('/rag/status').then(r => setRagStatus(r.data.data));
      api.get('/reports?extractionStatus=COMPLETED').then(r => setDocs(r.data.data));
    } catch (e) {
      alert('Indexing failed: ' + (e.response?.data?.message || e.message));
    } finally {
      setIndexing(p => ({ ...p, [docId]: false }));
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Verified RAG Knowledge Base</h1>
        <p className="text-sm text-slate-500">Index approved documents for semantic search</p>
      </div>
      {ragStatus && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Chunks', value: ragStatus.totalChunks },
            { label: 'Verified Chunks', value: ragStatus.verifiedChunks },
            { label: 'AI Service', value: ragStatus.aiServiceAvailable ? 'Available' : 'Unavailable', color: ragStatus.aiServiceAvailable ? 'text-emerald-600' : 'text-red-600' },
            { label: 'Last Indexed', value: ragStatus.lastIndexed ? new Date(ragStatus.lastIndexed).toLocaleDateString() : 'Never' },
          ].map(m => (
            <div key={m.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <div className="text-xs text-slate-400 mb-1">{m.label}</div>
              <div className={`text-xl font-bold ${m.color || 'text-slate-800'}`}>{m.value}</div>
            </div>
          ))}
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="bg-slate-50 text-slate-500">
            <th className="text-left px-4 py-3 font-medium">Document</th>
            <th className="text-left px-4 py-3 font-medium">Well</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="text-left px-4 py-3 font-medium">Indexed</th>
            <th className="text-left px-4 py-3 font-medium">Action</th>
          </tr></thead>
          <tbody>
            {docs.map(d => (
              <tr key={d._id} className="border-t border-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{d.title}</td>
                <td className="px-4 py-3 text-slate-500">{d.wellName || '—'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full font-medium ${d.verificationStatus === 'FULLY_APPROVED' || d.verificationStatus === 'PARTIALLY_APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{d.verificationStatus?.replace(/_/g, ' ')}</span></td>
                <td className="px-4 py-3">{d.indexedInRAG ? <span className="text-emerald-600 font-medium">✓ Indexed</span> : <span className="text-slate-400">Not indexed</span>}</td>
                <td className="px-4 py-3">
                  {!d.indexedInRAG && (d.verificationStatus === 'FULLY_APPROVED' || d.verificationStatus === 'PARTIALLY_APPROVED') && (
                    <button onClick={() => handleIndex(d._id)} disabled={indexing[d._id]}
                      className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                      {indexing[d._id] ? 'Indexing...' : 'Index Now'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const AdminWells = () => {
  const [wells, setWells] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/wells').then(r => setWells(r.data.data)).finally(() => setLoading(false)); }, []);
  if (loading) return <LoadingState />;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">Well Data Management</h1>
      <p className="text-sm text-slate-500">{wells.length} wells in the database</p>
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="bg-slate-50 text-slate-500">
            <th className="text-left px-4 py-3 font-medium">Well</th>
            <th className="text-left px-4 py-3 font-medium">Field</th>
            <th className="text-left px-4 py-3 font-medium">Status</th>
            <th className="text-left px-4 py-3 font-medium">Lat</th>
            <th className="text-left px-4 py-3 font-medium">Lon</th>
            <th className="text-left px-4 py-3 font-medium">Depth</th>
            <th className="text-left px-4 py-3 font-medium">Target</th>
            <th className="text-left px-4 py-3 font-medium">Formations</th>
          </tr></thead>
          <tbody>
            {wells.map(w => (
              <tr key={w._id} className="border-t border-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{w.wellName}</td>
                <td className="px-4 py-3">{w.field}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-slate-100 rounded-full">{w.status}</span></td>
                <td className="px-4 py-3 text-slate-500">{w.latitude?.toFixed(4)}</td>
                <td className="px-4 py-3 text-slate-500">{w.longitude?.toFixed(4)}</td>
                <td className="px-4 py-3">{w.currentDepth}m</td>
                <td className="px-4 py-3">{w.targetDepth}m</td>
                <td className="px-4 py-3">{w.formations?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
