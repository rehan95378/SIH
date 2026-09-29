import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import AIChat from '../../components/AIChat';
import { LoadingState } from '../../components/States';

const AIAssistant = () => {
  const [wells, setWells] = useState([]);
  const [selectedWellId, setSelectedWellId] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const wellIdParam = searchParams.get('wellId') || '';

  useEffect(() => {
    api.get('/wells?status=DRILLING').then(res => {
      setWells(res.data.data);
      setSelectedWellId(wellIdParam || res.data.data[0]?._id || '');
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading AI Copilot..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">AI Drilling Copilot</h1>
          <p className="text-sm text-slate-500 mt-0.5">Evidence-grounded drilling knowledge assistant · RAG-powered</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
        <strong>Decision Support Tool:</strong> This AI uses verified historical drilling data from the knowledge base. All responses require engineering review. Do not rely on AI answers for autonomous drilling decisions.
      </div>

      {/* Well selector */}
      {wells.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-600">Context Well:</label>
          <select
            value={selectedWellId}
            onChange={e => setSelectedWellId(e.target.value)}
            className="text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">No specific well</option>
            {wells.map(w => <option key={w._id} value={w._id}>{w.wellName}</option>)}
          </select>
        </div>
      )}

      <div style={{ height: 'calc(100vh - 280px)' }}>
        <AIChat wellId={selectedWellId} initialQuery={initialQuery} />
      </div>
    </div>
  );
};

export default AIAssistant;
