import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import RiskBadge from '../../components/RiskBadge';
import { LoadingState } from '../../components/States';
import { PlayCircle, Sliders, AlertTriangle, Info, RefreshCw, Target, Layers } from 'lucide-react';

const RISK_COLORS = { LOW: 'bg-emerald-50 border-emerald-200 text-emerald-800', MEDIUM: 'bg-amber-50 border-amber-200 text-amber-800', HIGH: 'bg-orange-50 border-orange-200 text-orange-800', CRITICAL: 'bg-red-50 border-red-200 text-red-800' };
const RISK_DOT = { LOW: 'bg-emerald-500', MEDIUM: 'bg-amber-500', HIGH: 'bg-orange-500', CRITICAL: 'bg-red-500' };

const ScenarioSimulator = () => {
  const [wells, setWells] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [selectedWell, setSelectedWell] = useState(null);
  const [simDepth, setSimDepth] = useState(2820);
  const [simRadius, setSimRadius] = useState(20);
  const [simSensitivity, setSimSensitivity] = useState('MEDIUM');
  const [simFormation, setSimFormation] = useState('');
  const [simResults, setSimResults] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/wells'),
      api.get('/events?verificationStatus=APPROVED&limit=200'),
    ]).then(([wr, er]) => {
      setWells(wr.data.data);
      setAllEvents(er.data.data);
      const active = wr.data.data.find(w => w.status === 'DRILLING') || wr.data.data[0];
      if (active) {
        setSelectedWell(active);
        setSimDepth(active.currentDepth || 2820);
        setSimFormation(active.currentFormation || '');
      }
    }).finally(() => setLoading(false));
  }, []);

  const getSensitivityThresholds = (sensitivity) => {
    switch (sensitivity) {
      case 'LOW': return { depthWindow: 30, maxDist: 5, minSev: ['CRITICAL'] };
      case 'HIGH': return { depthWindow: 200, maxDist: 50, minSev: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] };
      default: return { depthWindow: 100, maxDist: 20, minSev: ['MEDIUM', 'HIGH', 'CRITICAL'] };
    }
  };

  const calcDist = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const runSimulation = async () => {
    if (!selectedWell) return;
    setSimulating(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate processing

    try {
      const thresh = getSensitivityThresholds(simSensitivity);
      const sevOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
      const minSevNum = Math.min(...thresh.minSev.map(s => sevOrder[s]));

      // Find offset wells within radius
      const offsetWells = wells.filter(w => {
        if (!w.latitude || !w.longitude || !selectedWell.latitude) return false;
        if (w._id === selectedWell._id) return false;
        const d = calcDist(selectedWell.latitude, selectedWell.longitude, w.latitude, w.longitude);
        return d <= thresh.maxDist;
      });

      // Match events
      const matches = [];
      for (const ev of allEvents) {
        if (!ev.depth) continue;
        const depthDiff = Math.abs(ev.depth - simDepth);
        if (depthDiff > thresh.depthWindow) continue;
        if (sevOrder[ev.severity] < minSevNum) continue;

        const offsetWell = offsetWells.find(w => w._id === ev.wellId?._id || w._id === ev.wellId);
        if (!offsetWell) continue;

        const dist = calcDist(selectedWell.latitude, selectedWell.longitude, offsetWell.latitude, offsetWell.longitude);
        const formMatch = !simFormation || ev.formation === simFormation;

        // Score
        let score = 0;
        score += Math.max(0, (thresh.depthWindow - depthDiff) / thresh.depthWindow) * 40;
        score += Math.max(0, (thresh.maxDist - dist) / thresh.maxDist) * 25;
        score += sevOrder[ev.severity] * 8;
        score += formMatch ? 20 : 0;
        if (ev.eventType === 'MUD_LOSS' || ev.eventType === 'KICK') score += 10;

        matches.push({
          event: ev,
          offsetWell,
          depthDiff: depthDiff.toFixed(0),
          distance: dist.toFixed(2),
          formMatch,
          score: Math.min(100, score.toFixed(1)),
        });
      }

      matches.sort((a, b) => b.score - a.score);

      // Determine overall risk
      let overallRisk = 'LOW';
      if (matches.some(m => m.event.severity === 'CRITICAL' && m.depthDiff < 30)) overallRisk = 'CRITICAL';
      else if (matches.some(m => m.event.severity === 'HIGH' && m.depthDiff < 80)) overallRisk = 'HIGH';
      else if (matches.some(m => m.event.severity === 'HIGH' || m.event.severity === 'CRITICAL')) overallRisk = 'HIGH';
      else if (matches.some(m => m.event.severity === 'MEDIUM')) overallRisk = 'MEDIUM';

      setSimResults({
        depth: simDepth,
        formation: simFormation,
        radius: simRadius,
        sensitivity: simSensitivity,
        offsetWells: offsetWells.length,
        matches: matches.slice(0, 8),
        overallRisk,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setSimulating(false);
    }
  };

  if (loading) return <LoadingState message="Loading simulator..." />;

  const formations = selectedWell?.formations?.map(f => f.name) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Drilling Scenario Simulator</h1>
          <p className="text-sm text-slate-500 mt-0.5">What-if analysis using verified historical drilling evidence</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <Info size={14} />
          <span>Simulation uses historical evidence only — not a future prediction tool</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sliders size={16} className="text-blue-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Simulation Parameters</h2>
            </div>

            {/* Well selector */}
            <div className="space-y-1 mb-4">
              <label className="text-xs font-medium text-slate-500">Active Well</label>
              <select
                value={selectedWell?._id || ''}
                onChange={e => {
                  const w = wells.find(x => x._id === e.target.value);
                  setSelectedWell(w);
                  if (w) { setSimDepth(w.currentDepth || 2820); setSimFormation(w.currentFormation || ''); }
                }}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {wells.map(w => <option key={w._id} value={w._id}>{w.wellName} — {w.status}</option>)}
              </select>
            </div>

            {/* Depth slider */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <label className="text-xs font-medium text-slate-500">Simulated Depth</label>
                <span className="text-xs font-bold text-blue-600">{simDepth} m</span>
              </div>
              <input
                type="range"
                min={selectedWell?.formations?.[0]?.topDepth || 0}
                max={selectedWell?.targetDepth || 4000}
                value={simDepth}
                onChange={e => setSimDepth(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>0m</span>
                <span>{selectedWell?.targetDepth || 4000}m (TD)</span>
              </div>
            </div>

            {/* Radius slider */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <label className="text-xs font-medium text-slate-500">Search Radius</label>
                <span className="text-xs font-bold text-blue-600">{simRadius} km</span>
              </div>
              <input
                type="range" min={5} max={50} step={5} value={simRadius}
                onChange={e => setSimRadius(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            {/* Formation */}
            <div className="space-y-1 mb-4">
              <label className="text-xs font-medium text-slate-500">Formation Filter</label>
              <select
                value={simFormation}
                onChange={e => setSimFormation(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="">All formations</option>
                {formations.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {/* Sensitivity */}
            <div className="space-y-1 mb-5">
              <label className="text-xs font-medium text-slate-500">Risk Sensitivity</label>
              <div className="grid grid-cols-3 gap-1">
                {['LOW', 'MEDIUM', 'HIGH'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSimSensitivity(s)}
                    className={`text-xs py-1.5 rounded-lg font-medium transition-colors ${simSensitivity === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={runSimulation}
              disabled={simulating || !selectedWell}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {simulating ? <RefreshCw size={15} className="animate-spin" /> : <PlayCircle size={15} />}
              {simulating ? 'Running Simulation...' : 'Run Simulation'}
            </button>
          </div>

          {/* Current well info */}
          {selectedWell && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Selected Well</div>
              <div className="text-sm font-bold text-slate-800">{selectedWell.wellName}</div>
              <div className="text-xs text-slate-500">{selectedWell.field}</div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-slate-400">Current Depth</span>
                <span className="font-semibold text-slate-700">{selectedWell.currentDepth}m</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Formation</span>
                <span className="font-semibold text-slate-700">{selectedWell.currentFormation || '—'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Status</span>
                <span className="font-semibold text-slate-700">{selectedWell.status}</span>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {!simResults && !simulating && (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 h-64 flex flex-col items-center justify-center text-slate-400">
              <PlayCircle size={36} className="mb-3 text-slate-300" />
              <p className="text-sm font-medium">Configure parameters and run simulation</p>
              <p className="text-xs mt-1">System will match against verified historical events</p>
            </div>
          )}

          {simulating && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm h-64 flex flex-col items-center justify-center">
              <RefreshCw size={32} className="animate-spin text-blue-600 mb-3" />
              <p className="text-sm font-medium text-slate-600">Running simulation...</p>
              <p className="text-xs text-slate-400 mt-1">Matching against verified historical database</p>
            </div>
          )}

          {simResults && !simulating && (
            <div className="space-y-4">
              {/* Result summary */}
              <div className={`rounded-xl border p-5 ${RISK_COLORS[simResults.overallRisk]}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${RISK_DOT[simResults.overallRisk]}`} />
                    <span className="font-bold text-sm">Historical Risk Indicator: {simResults.overallRisk}</span>
                  </div>
                  <RiskBadge level={simResults.overallRisk} />
                </div>
                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div><div className="opacity-60">Sim Depth</div><div className="font-bold text-base">{simResults.depth}m</div></div>
                  <div><div className="opacity-60">Radius</div><div className="font-bold text-base">{simResults.radius}km</div></div>
                  <div><div className="opacity-60">Offset Wells</div><div className="font-bold text-base">{simResults.offsetWells}</div></div>
                  <div><div className="opacity-60">Matches Found</div><div className="font-bold text-base">{simResults.matches.length}</div></div>
                </div>
                <p className="text-xs mt-3 opacity-75">
                  ⚠ Prototype historical-risk scoring model — simulation uses verified historical evidence only.
                  Not a prediction. Requires engineering review.
                </p>
              </div>

              {/* Matches */}
              {simResults.matches.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 text-center text-slate-400">
                  <Target size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No historical matches found with current parameters.</p>
                  <p className="text-xs mt-1">Try increasing depth window, radius, or lowering sensitivity.</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-50">
                    <h3 className="text-sm font-semibold text-slate-700">Historical Event Matches ({simResults.matches.length})</h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {simResults.matches.map((m, i) => (
                      <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="text-sm font-semibold text-slate-800">{m.event.eventType?.replace(/_/g, ' ')}</span>
                            <span className="ml-2 text-xs text-slate-400">in {m.offsetWell.wellName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-600">Score: {m.score}</span>
                            <RiskBadge level={m.event.severity} size="xs" />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div className="bg-slate-50 rounded-lg p-2">
                            <div className="text-slate-400">Event Depth</div>
                            <div className="font-bold text-slate-700">{m.event.depth}m</div>
                            <div className="text-slate-400">Δ {m.depthDiff}m from sim</div>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2">
                            <div className="text-slate-400">Distance</div>
                            <div className="font-bold text-slate-700">{m.distance} km</div>
                            <div className={m.formMatch ? 'text-emerald-600' : 'text-slate-400'}>{m.formMatch ? '✓ Formation match' : 'Different formation'}</div>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-2">
                            <div className="text-slate-400">Formation</div>
                            <div className="font-bold text-slate-700">{m.event.formation || '—'}</div>
                            <div className="text-slate-400">NPT: {m.event.nptHours || 0}h</div>
                          </div>
                        </div>
                        {m.event.mitigation && (
                          <div className="mt-2 text-xs text-slate-500 bg-blue-50 rounded p-2">
                            <span className="font-medium text-blue-700">Historical mitigation: </span>
                            {m.event.mitigation.substring(0, 120)}{m.event.mitigation.length > 120 ? '...' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
                Simulation generated at {new Date(simResults.timestamp).toLocaleString()} ·
                Sensitivity: {simResults.sensitivity} · {simResults.matches.length} historical event(s) matched ·
                Representative Demonstration Data
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioSimulator;
