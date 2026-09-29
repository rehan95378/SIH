import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { LoadingState, EmptyState } from '../../components/States';
import { CheckCircle, XCircle, Edit2, Save, AlertTriangle } from 'lucide-react';

const ExtractionReview = () => {
  const [searchParams] = useSearchParams();
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState({});

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    const reportId = searchParams.get('reportId');
    if (reportId && reports.length > 0) {
      const found = reports.find(r => r._id === reportId);
      if (found) setSelectedReport(found);
    }
  }, [reports, searchParams]);

  const loadReports = async () => {
    setLoading(true);
    api.get('/reports?extractionStatus=COMPLETED').then(r => {
      const pending = r.data.data.filter(rep => rep.extractedData?.some(d => d.verificationStatus === 'PENDING'));
      setReports(pending);
      if (pending.length > 0 && !selectedReport) setSelectedReport(pending[0]);
    }).finally(() => setLoading(false));
  };

  const handleApprove = async (reportId, itemId) => {
    setSaving(p => ({ ...p, [itemId]: true }));
    try {
      await api.post(`/reports/${reportId}/approve-item`, { itemId, editedData: editingItem === itemId ? editForm : undefined });
      setEditingItem(null);
      // Reload report
      const res = await api.get(`/reports/${reportId}`);
      const updatedReport = res.data.data;
      setReports(prev => prev.map(r => r._id === reportId ? updatedReport : r));
      setSelectedReport(updatedReport);
    } catch (e) {
      alert('Approval failed: ' + (e.response?.data?.message || e.message));
    } finally {
      setSaving(p => ({ ...p, [itemId]: false }));
    }
  };

  const handleReject = async (reportId, itemId) => {
    const reason = window.prompt('Reason for rejection:');
    if (!reason) return;
    setSaving(p => ({ ...p, [itemId]: true }));
    try {
      await api.post(`/reports/${reportId}/reject-item`, { itemId, reason });
      const res = await api.get(`/reports/${reportId}`);
      const updatedReport = res.data.data;
      setReports(prev => prev.map(r => r._id === reportId ? updatedReport : r));
      setSelectedReport(updatedReport);
    } catch (e) {
      alert('Rejection failed: ' + (e.response?.data?.message || e.message));
    } finally {
      setSaving(p => ({ ...p, [itemId]: false }));
    }
  };

  const startEdit = (item) => {
    setEditingItem(item._id);
    setEditForm({
      eventType: item.eventType,
      depth: item.depth,
      formation: item.formation,
      severity: item.severity,
      description: item.description,
      mitigation: item.mitigation,
    });
  };

  if (loading) return <LoadingState message="Loading extraction queue..." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">AI Extraction Verification Studio</h1>
        <p className="text-sm text-slate-500">Human-in-the-loop verification of AI-extracted drilling events</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
        <strong>⚠ Critical Process:</strong> AI extraction results must be verified by an authorized administrator before entering the trusted knowledge base. Review each extracted item against the source document. Edit if needed. Approve only verified facts. Reject incorrect extractions.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Report list */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-600 mb-3">Pending Review ({reports.length})</p>
          <div className="space-y-2">
            {reports.map(r => (
              <div
                key={r._id}
                onClick={() => setSelectedReport(r)}
                className={`p-3 rounded-lg border cursor-pointer text-xs transition-all ${selectedReport?._id === r._id ? 'border-blue-200 bg-blue-50' : 'border-slate-100 hover:border-blue-100'}`}
              >
                <div className="font-semibold text-slate-700 truncate">{r.title}</div>
                <div className="text-slate-400 mt-0.5">{r.wellName} · {r.extractedData?.filter(d => d.verificationStatus === 'PENDING').length} pending</div>
              </div>
            ))}
            {reports.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No reports pending review.</p>}
          </div>
        </div>

        {/* Extraction items */}
        <div className="lg:col-span-3">
          {!selectedReport ? (
            <EmptyState title="Select a report" message="Choose a report from the left to review its extracted events." />
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                <h3 className="font-semibold text-slate-800 text-sm">{selectedReport.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedReport.wellName} · {selectedReport.pageCount} pages · {selectedReport.extractedData?.length} events extracted</p>
              </div>

              {selectedReport.extractedData?.map((item, idx) => {
                const isEditing = editingItem === item._id.toString();
                const statusColor = {
                  PENDING: 'bg-amber-50 border-amber-200',
                  APPROVED: 'bg-emerald-50 border-emerald-200',
                  REJECTED: 'bg-red-50 border-red-200',
                }[item.verificationStatus] || 'bg-white border-slate-200';

                return (
                  <div key={item._id} className={`rounded-xl border p-5 ${statusColor}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-sm">{item.eventType?.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500">Page {item.sourcePage || 'N/A'}</span>
                          {item.confidence && <span className="text-xs text-blue-600">AI confidence: {(item.confidence * 100).toFixed(0)}%</span>}
                        </div>
                      </div>
                      {item.verificationStatus === 'PENDING' && (
                        <div className="flex gap-2">
                          {!isEditing && (
                            <button onClick={() => startEdit(item)} className="text-xs px-2 py-1 border border-slate-200 text-slate-600 rounded hover:bg-slate-50 flex items-center gap-1">
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                          )}
                          <button
                            onClick={() => handleApprove(selectedReport._id, item._id)}
                            disabled={saving[item._id]}
                            className="text-xs px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(selectedReport._id, item._id)}
                            disabled={saving[item._id]}
                            className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      )}
                      {item.verificationStatus !== 'PENDING' && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.verificationStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {item.verificationStatus}
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Event Type', key: 'eventType', type: 'select', options: ['MUD_LOSS', 'KICK', 'STUCK_PIPE', 'HIGH_TORQUE', 'OVERPRESSURE', 'FISHING', 'LOST_CIRCULATION', 'NPT', 'OTHER'] },
                          { label: 'Depth (m)', key: 'depth', type: 'number' },
                          { label: 'Formation', key: 'formation', type: 'text' },
                          { label: 'Severity', key: 'severity', type: 'select', options: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                            {f.type === 'select' ? (
                              <select value={editForm[f.key] || ''} onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded focus:outline-none">
                                {f.options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
                              </select>
                            ) : (
                              <input type={f.type} value={editForm[f.key] || ''} onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded focus:outline-none" />
                            )}
                          </div>
                        ))}
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                          <textarea value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                            rows={2} className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded focus:outline-none" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Mitigation</label>
                          <textarea value={editForm.mitigation || ''} onChange={e => setEditForm(p => ({ ...p, mitigation: e.target.value }))}
                            rows={2} className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded focus:outline-none" />
                        </div>
                        <div className="col-span-2 flex gap-2">
                          <button onClick={() => setEditingItem(null)} className="px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded hover:bg-slate-50">Cancel</button>
                          <button onClick={() => handleApprove(selectedReport._id, item._id)} className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 flex items-center gap-1">
                            <Save className="w-3 h-3" /> Save & Approve
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        {[
                          { label: 'Depth', value: `${item.depth || 'N/A'}m` },
                          { label: 'Formation', value: item.formation || 'Not extracted' },
                          { label: 'Severity', value: item.severity },
                          { label: 'Source Page', value: item.sourcePage || 'N/A' },
                        ].map(f => (
                          <div key={f.label} className="bg-white/60 rounded-lg p-2">
                            <div className="text-slate-400 mb-0.5">{f.label}</div>
                            <div className="font-medium text-slate-700">{f.value}</div>
                          </div>
                        ))}
                        <div className="col-span-2 sm:col-span-4 bg-white/60 rounded-lg p-2">
                          <div className="text-slate-400 mb-0.5">Description</div>
                          <div className="text-slate-700">{item.description}</div>
                        </div>
                        {item.mitigation && (
                          <div className="col-span-2 sm:col-span-4 bg-white/60 rounded-lg p-2">
                            <div className="text-slate-400 mb-0.5">Mitigation</div>
                            <div className="text-slate-700">{item.mitigation}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {item.verificationStatus !== 'PENDING' && item.verifiedBy && (
                      <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                        {item.verificationStatus === 'APPROVED' ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                        {item.verificationStatus} by {typeof item.verifiedBy === 'object' ? item.verifiedBy.name : 'Admin'}
                        {item.verifiedAt ? ` · ${new Date(item.verifiedAt).toLocaleDateString()}` : ''}
                        {item.adminNotes && ` · Note: ${item.adminNotes}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtractionReview;
