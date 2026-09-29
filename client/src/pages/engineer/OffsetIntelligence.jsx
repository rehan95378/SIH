import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingState, EmptyState } from '../../components/States';
import RiskBadge from '../../components/RiskBadge';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const OffsetIntelligence = () => {
  const [wells, setWells] = useState([]);
  const [activeWell, setActiveWell] = useState(null);
  const [offsetWells, setOffsetWells] = useState([]);
  const [selectedOffset, setSelectedOffset] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMatch, setLoadingMatch] = useState(false);

  useEffect(() => {
    loadWells();
  }, []);

  useEffect(() => {
    if (activeWell) loadNearby();
  }, [activeWell?._id]);

  const loadWells = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wells?status=DRILLING');
      setWells(res.data.data);
      if (res.data.data.length > 0) setActiveWell(res.data.data[0]);
    } finally {
      setLoading(false);
    }
  };

  const loadNearby = async () => {
    if (!activeWell) return;
    try {
      const res = await api.get(`/wells/${activeWell._id}/nearby?radius=20`);
      setOffsetWells(res.data.data);
    } catch {}
  };

  const loadMatchScore = async (offsetWell) => {
    setSelectedOffset(offsetWell);
    setLoadingMatch(true);
    try {
      const [matchRes, compRes] = await Promise.all([
        api.get(`/wells/${activeWell._id}/offset-match/${offsetWell._id}`),
        api.post('/ai/compare-wells', { wellId1: activeWell._id, wellId2: offsetWell._id }),
      ]);
      setMatchScore(matchRes.data.data);
      setComparison(compRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMatch(false);
    }
  };

  if (loading) return <LoadingState message="Loading offset intelligence..." />;

  const chartData = comparison ? (() => {
    const r1 = comparison.well1?.readings || [];
    const r2 = comparison.well2?.readings || [];
    const maxLen = Math.min(Math.max(r1.length, r2.length), 100);
    return Array.from({ length: maxLen }, (_, i) => ({
      depth: r1[i]?.depth || r2[i]?.depth || i * 30,
      torque1: r1[i]?.torque,
      torque2: r2[i]?.torque,
      rop1: r1[i]?.rop,
      rop2: r2[i]?.rop,
    }));
  })() : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Offset Well Intelligence</h1>
        <p className="text-sm text-slate-500 mt-0.5">AI-powered relevance scoring and multi-well parameter correlation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Offset well selection */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <label className="block text-xs font-medium text-slate-600 mb-2">Active Well</label>
            <select
              value={activeWell?._id || ''}
              onChange={e => setActiveWell(wells.find(w => w._id === e.target.value))}
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
            >
              {wells.map(w => <option key={w._id} value={w._id}>{w.wellName}</option>)}
            </select>
            {activeWell && (
              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <div>Depth: <span className="font-medium text-slate-700">{activeWell.currentDepth}m</span></div>
                <div>Formation: <span className="font-medium text-slate-700">{activeWell.currentFormation}</span></div>
                <RiskBadge level={activeWell.riskLevel} size="xs" />
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-600 mb-3">Offset Wells ({offsetWells.length})</p>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {offsetWells.map(w => (
                <div
                  key={w._id}
                  onClick={() => loadMatchScore(w)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all text-xs ${
                    selectedOffset?._id === w._id
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-slate-100 hover:border-blue-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-slate-700">{w.wellName}</div>
                  <div className="text-slate-400">{w.distance?.toFixed(1)} km · {w.status}</div>
                  <div className="text-slate-400">{w.eventCount || 0} events</div>
                </div>
              ))}
              {offsetWells.length === 0 && <p className="text-xs text-slate-400">No nearby wells found within 20km.</p>}
            </div>
          </div>
        </div>

        {/* Match score & details */}
        <div className="lg:col-span-2 space-y-5">
          {loadingMatch && <LoadingState message="Calculating match score..." />}

          {matchScore && !loadingMatch && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-800">Offset Match: {selectedOffset?.wellName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">AI relevance scoring — transparent factors</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-700">{matchScore.score}</div>
                  <div className="text-xs text-slate-400">Relevance Score</div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
                    matchScore.overallRelevance === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    matchScore.overallRelevance === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>{matchScore.overallRelevance} RELEVANCE</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Distance', value: `${matchScore.distance} km`, color: 'blue' },
                  { label: 'Formation Match', value: matchScore.formationSimilarity, color: matchScore.formationSimilarity === 'HIGH' ? 'green' : 'amber' },
                  { label: 'Depth Similarity', value: matchScore.depthSimilarity, color: matchScore.depthSimilarity === 'HIGH' ? 'green' : 'amber' },
                  { label: 'Historical Events', value: matchScore.historicalEventCount, color: 'purple' },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                    <p className="font-semibold text-sm text-slate-700">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 mb-4">
                <strong>Why relevant:</strong> {matchScore.explanation}
              </div>

              {matchScore.events?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Historical Events in {selectedOffset?.wellName}</p>
                  <div className="space-y-1">
                    {matchScore.events.map((e, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs p-2 bg-slate-50 rounded-lg">
                        <span className={`px-2 py-0.5 rounded font-medium ${e.severity === 'HIGH' || e.severity === 'CRITICAL' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>{e.type?.replace(/_/g, ' ')}</span>
                        <span className="text-slate-500">{e.depth}m</span>
                        <span className="text-slate-400">Severity: {e.severity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comparison Charts */}
          {comparison && !loadingMatch && chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-1">Multi-Well Parameter Correlation</h3>
              <p className="text-xs text-slate-400 mb-4">Depth vs drilling parameters comparison</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Torque Comparison</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="depth" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="torque1" name={comparison.well1?.wellName} stroke="#2563EB" dot={false} />
                      <Line type="monotone" dataKey="torque2" name={comparison.well2?.wellName} stroke="#7c3aed" dot={false} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">ROP Comparison</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="depth" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="rop1" name={comparison.well1?.wellName} stroke="#0d9488" dot={false} />
                      <Line type="monotone" dataKey="rop2" name={comparison.well2?.wellName} stroke="#f97316" dot={false} strokeDasharray="4 4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {comparison.aiSummary && (
                <div className="mt-4 bg-slate-50 rounded-lg p-3 text-xs text-slate-600 border border-slate-100">
                  <strong className="text-slate-700">AI Analysis:</strong> {comparison.aiSummary}
                </div>
              )}
            </div>
          )}

          {!selectedOffset && (
            <EmptyState title="Select an offset well" message="Click on any nearby well to view relevance score, historical events, and parameter comparison." />
          )}
        </div>
      </div>
    </div>
  );
};

export default OffsetIntelligence;
