import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import WellCard from '../../components/WellCard';
import RiskBadge from '../../components/RiskBadge';
import { LoadingState, EmptyState } from '../../components/States';
import { RefreshCw, Radio, Layers } from 'lucide-react';

const WellsPage = () => {
  const [wells, setWells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('DRILLING');
  const [selected, setSelected] = useState(null);

  useEffect(() => { loadWells(); }, [filter]);

  const loadWells = async () => {
    setLoading(true);
    try {
      const query = filter ? `?status=${filter}` : '';
      const res = await api.get(`/wells${query}`);
      setWells(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Active Wells</h1>
          <p className="text-sm text-slate-500">Select a well to view detailed information</p>
        </div>
        <button onClick={loadWells} className="w-8 h-8 border border-slate-200 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {['', 'DRILLING', 'COMPLETED', 'PRODUCING', 'SUSPENDED', 'ABANDONED', 'TESTING'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-sm px-4 py-1.5 rounded-lg border transition-colors ${filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <LoadingState message="Loading wells..." /> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {wells.length === 0 && <div className="col-span-2"><EmptyState title="No wells found" message="Try a different status filter." /></div>}
            {wells.map(well => (
              <WellCard key={well._id} well={well} onClick={setSelected} />
            ))}
          </div>

          {/* Well detail panel */}
          <div>
            {selected ? (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 sticky top-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-slate-800">{selected.wellName}</h2>
                    <p className="text-sm text-slate-500">{selected.field}</p>
                  </div>
                  <RiskBadge level={selected.riskLevel || 'LOW'} size="xs" />
                </div>
                <div className="space-y-2 text-xs">
                  {[
                    ['Status', selected.status],
                    ['Current Depth', `${selected.currentDepth?.toLocaleString()}m`],
                    ['Target Depth', `${selected.targetDepth?.toLocaleString()}m`],
                    ['Formation', selected.currentFormation || 'N/A'],
                    ['Operator', selected.operator],
                    ['Latitude', selected.latitude?.toFixed(5)],
                    ['Longitude', selected.longitude?.toFixed(5)],
                    ['Spud Date', selected.spudDate ? new Date(selected.spudDate).toLocaleDateString() : 'N/A'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-400">{k}</span>
                      <span className="font-medium text-slate-700 text-right">{v}</span>
                    </div>
                  ))}
                </div>
                {selected.formations?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" /> Formations ({selected.formations.length})
                    </p>
                    <div className="space-y-1.5">
                      {selected.formations.map((f, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-700">{f.name}</span>
                          <span className="text-slate-400">{f.topDepth}–{f.bottomDepth}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selected.description && (
                  <p className="mt-3 text-xs text-slate-500 italic border-t border-slate-50 pt-3">{selected.description}</p>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <Radio className="w-8 h-8 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">Select a well</p>
                <p className="text-xs text-slate-400 mt-1">Click any well card to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WellsPage;
