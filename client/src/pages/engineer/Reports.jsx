import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingState } from '../../components/States';
import { FileText, Download } from 'lucide-react';

const EngineerReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports?verificationStatus=FULLY_APPROVED&verificationStatus=PARTIALLY_APPROVED').then(res => {
      setReports(res.data.data);
    }).catch(() => {
      api.get('/reports').then(res => setReports(res.data.data));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading reports..." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Drilling Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Verified drilling reports and extracted knowledge</p>
      </div>

      <div className="space-y-3">
        {reports.map(report => (
          <div key={report._id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">{report.title}</h3>
                  <p className="text-xs text-slate-400">{report.wellName || report.wellId?.wellName} · {report.reportType?.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                report.verificationStatus === 'FULLY_APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                report.verificationStatus === 'PARTIALLY_APPROVED' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-600'
              }`}>{report.verificationStatus?.replace(/_/g, ' ')}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="bg-slate-50 rounded-lg p-2 text-xs">
                <div className="text-slate-400">Pages</div>
                <div className="font-medium text-slate-700">{report.pageCount || 'N/A'}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-xs">
                <div className="text-slate-400">Extracted Events</div>
                <div className="font-medium text-slate-700">{report.extractedData?.length || 0}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2 text-xs">
                <div className="text-slate-400">Approved</div>
                <div className="font-medium text-emerald-700">{report.extractedData?.filter(d => d.verificationStatus === 'APPROVED').length || 0}</div>
              </div>
            </div>

            {report.isDemo && (
              <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                ⚠ Representative Demonstration Data — Not Real Oil India Operational Data
              </div>
            )}
          </div>
        ))}
        {reports.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">No reports available. Ask Admin to upload reports.</div>
        )}
      </div>
    </div>
  );
};

export default EngineerReports;
