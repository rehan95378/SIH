import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { LoadingState } from '../../components/States';
import { Upload, FileText, Play, CheckCircle, XCircle, Loader2 } from 'lucide-react';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState({});
  const [wells, setWells] = useState([]);
  const [uploadForm, setUploadForm] = useState({ wellId: '', title: '', reportType: 'DAILY_DRILLING_REPORT' });
  const fileRef = useRef(null);

  useEffect(() => {
    Promise.all([loadReports(), api.get('/wells').then(r => setWells(r.data.data))]);
  }, []);

  const loadReports = async () => {
    setLoading(true);
    api.get('/reports').then(r => setReports(r.data.data)).finally(() => setLoading(false));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files[0];
    if (!file) return alert('Please select a PDF file.');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('wellId', uploadForm.wellId);
    fd.append('title', uploadForm.title || file.name.replace('.pdf', ''));
    fd.append('reportType', uploadForm.reportType);

    setUploading(true);
    try {
      await api.post('/reports/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      fileRef.current.value = '';
      setUploadForm({ wellId: '', title: '', reportType: 'DAILY_DRILLING_REPORT' });
      loadReports();
    } catch (e) {
      alert('Upload failed: ' + (e.response?.data?.message || e.message));
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async (reportId) => {
    setProcessing(p => ({ ...p, [reportId]: true }));
    try {
      await api.post(`/reports/${reportId}/process`);
      loadReports();
    } catch (e) {
      alert('Processing failed: ' + (e.response?.data?.message || e.message));
    } finally {
      setProcessing(p => ({ ...p, [reportId]: false }));
    }
  };

  if (loading) return <LoadingState />;

  const statusColors = {
    PENDING_REVIEW: 'bg-amber-100 text-amber-700',
    PARTIALLY_APPROVED: 'bg-blue-100 text-blue-700',
    FULLY_APPROVED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Document Management</h1>
        <p className="text-sm text-slate-500">Upload and process drilling reports for AI extraction</p>
      </div>

      {/* Upload form */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Upload New Report</h3>
        <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">PDF File *</label>
            <input ref={fileRef} type="file" accept=".pdf" required className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-600 file:text-xs cursor-pointer" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Associated Well</label>
            <select value={uploadForm.wellId} onChange={e => setUploadForm(p => ({ ...p, wellId: e.target.value }))} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none">
              <option value="">Select well...</option>
              {wells.map(w => <option key={w._id} value={w._id}>{w.wellName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Report Type</label>
            <select value={uploadForm.reportType} onChange={e => setUploadForm(p => ({ ...p, reportType: e.target.value }))} className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none">
              {['DAILY_DRILLING_REPORT', 'WELL_COMPLETION_REPORT', 'MUD_LOG', 'GEOLOGICAL_REPORT', 'INCIDENT_REPORT', 'OTHER'].map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={uploading} className="flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Upload PDF'}
          </button>
        </form>
      </div>

      {/* Reports table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="bg-slate-50 text-slate-500">
            <th className="text-left px-4 py-3 font-medium">Title</th>
            <th className="text-left px-4 py-3 font-medium">Well</th>
            <th className="text-left px-4 py-3 font-medium">Type</th>
            <th className="text-left px-4 py-3 font-medium">Extraction</th>
            <th className="text-left px-4 py-3 font-medium">Verification</th>
            <th className="text-left px-4 py-3 font-medium">Events</th>
            <th className="text-left px-4 py-3 font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {reports.map(r => (
              <tr key={r._id} className="border-t border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-medium text-slate-700 truncate max-w-xs">{r.title}</span>
                  </div>
                  {r.isDemo && <span className="text-xs text-amber-600 ml-5">Demo data</span>}
                </td>
                <td className="px-4 py-3 text-slate-600">{r.wellName || r.wellId?.wellName || '—'}</td>
                <td className="px-4 py-3 text-slate-500">{r.reportType?.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full font-medium text-xs ${
                    r.extractionStatus === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                    r.extractionStatus === 'PROCESSING' ? 'bg-blue-100 text-blue-700' :
                    r.extractionStatus === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{r.extractionStatus}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full font-medium text-xs ${statusColors[r.verificationStatus] || 'bg-slate-100'}`}>
                    {r.verificationStatus?.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{r.extractedData?.length || 0}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {r.extractionStatus === 'PENDING' && (
                      <button onClick={() => handleProcess(r._id)} disabled={processing[r._id]}
                        className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                        {processing[r._id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        {processing[r._id] ? '...' : 'Process'}
                      </button>
                    )}
                    {r.extractionStatus === 'COMPLETED' && r.verificationStatus === 'PENDING_REVIEW' && (
                      <a href={`/admin/extraction-review?reportId=${r._id}`} className="text-xs text-blue-600 hover:underline">Review</a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reports.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No reports uploaded yet.</div>}
      </div>
    </div>
  );
};

export default AdminReports;
