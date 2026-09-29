import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingState } from '../../components/States';
import { GitBranch, ChevronRight, ChevronDown, FileText, Layers, AlertTriangle, Wrench, Search } from 'lucide-react';

const KnowledgeGraph = () => {
  const [wells, setWells] = useState([]);
  const [events, setEvents] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedWell, setSelectedWell] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/wells'),
      api.get('/events?verificationStatus=APPROVED&limit=100'),
      api.get('/reports'),
    ]).then(([wr, er, rr]) => {
      setWells(wr.data.data);
      setEvents(er.data.data);
      setReports(rr.data.data);
      if (wr.data.data.length > 0) setSelectedWell(wr.data.data[0]._id);
    }).finally(() => setLoading(false));
  }, []);

  const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  const wellEvents = (wellId) => events.filter(e => e.wellId?._id === wellId || e.wellId === wellId);
  const wellReports = (wellId) => reports.filter(r => String(r.wellId) === String(wellId) || r.wellId?._id === wellId);

  const filteredWells = wells.filter(w => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return w.wellName.toLowerCase().includes(term) || w.field.toLowerCase().includes(term);
  });

  const sevColor = { CRITICAL: 'text-red-600 bg-red-50', HIGH: 'text-orange-600 bg-orange-50', MEDIUM: 'text-amber-600 bg-amber-50', LOW: 'text-emerald-600 bg-emerald-50' };

  if (loading) return <LoadingState message="Loading knowledge graph..." />;

  const currentWell = wells.find(w => w._id === selectedWell);
  const currentEvents = currentWell ? wellEvents(currentWell._id) : [];
  const currentReports = currentWell ? wellReports(currentWell._id) : [];

  // Build formation→events mapping
  const formationMap = {};
  for (const ev of currentEvents) {
    const f = ev.formation || 'Unknown Formation';
    if (!formationMap[f]) formationMap[f] = [];
    formationMap[f].push(ev);
  }

  // Build event→mitigation mapping
  const mitigationGroups = {};
  for (const ev of currentEvents) {
    if (ev.mitigation) {
      if (!mitigationGroups[ev.eventType]) mitigationGroups[ev.eventType] = [];
      mitigationGroups[ev.eventType].push({ depth: ev.depth, mitigation: ev.mitigation });
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Knowledge Graph</h1>
        <p className="text-sm text-slate-500 mt-0.5">Structured relationship explorer: Well → Formation → Event → Mitigation → Document</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Well selector */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Wells</div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search wells..."
              className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filteredWells.map(w => {
              const evCount = wellEvents(w._id).length;
              return (
                <button
                  key={w._id}
                  onClick={() => { setSelectedWell(w._id); setExpanded({}); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${selectedWell === w._id ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  <div className="font-semibold">{w.wellName}</div>
                  <div className={`text-xs mt-0.5 ${selectedWell === w._id ? 'text-blue-100' : 'text-slate-400'}`}>
                    {w.field} · {evCount} events
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Graph explorer */}
        <div className="lg:col-span-3 space-y-4">
          {currentWell ? (
            <>
              {/* Root node */}
              <div className="bg-blue-600 text-white rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <GitBranch size={18} />
                </div>
                <div>
                  <div className="font-bold text-base">{currentWell.wellName}</div>
                  <div className="text-blue-100 text-xs">{currentWell.field} · {currentWell.currentDepth}m depth · {currentWell.status}</div>
                </div>
                <div className="ml-auto text-right text-xs text-blue-100">
                  <div>{currentEvents.length} events</div>
                  <div>{currentReports.length} reports</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Formations branch */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggle('formations')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Layers size={13} className="text-teal-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold text-slate-700">Formations</div>
                      <div className="text-xs text-slate-400">{currentWell.formations?.length || 0} formation intervals</div>
                    </div>
                    {expanded.formations ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                  </button>
                  {expanded.formations && (
                    <div className="border-t border-slate-50">
                      {(currentWell.formations || []).map((f, i) => (
                        <div key={i} className="px-4 py-2.5 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 ml-3" />
                            <span className="text-xs font-semibold text-slate-700">{f.name}</span>
                            <span className="text-xs text-slate-400 ml-auto">{f.topDepth}m–{f.bottomDepth}m</span>
                          </div>
                          {f.lithology && <div className="text-xs text-slate-400 ml-6">{f.lithology}</div>}
                          {formationMap[f.name]?.length > 0 && (
                            <div className="ml-6 mt-1">
                              {formationMap[f.name].map((ev, j) => (
                                <span key={j} className={`inline-block text-xs px-1.5 py-0.5 rounded mr-1 mb-1 ${sevColor[ev.severity] || 'bg-slate-100 text-slate-600'}`}>
                                  {ev.eventType?.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Events branch */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggle('events')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle size={13} className="text-orange-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold text-slate-700">Drilling Events</div>
                      <div className="text-xs text-slate-400">{currentEvents.length} verified events</div>
                    </div>
                    {expanded.events ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                  </button>
                  {expanded.events && (
                    <div className="border-t border-slate-50 max-h-60 overflow-y-auto">
                      {currentEvents.length === 0 && <div className="px-4 py-3 text-xs text-slate-400">No verified events.</div>}
                      {currentEvents.map((ev, i) => (
                        <div key={i} className="px-4 py-2.5 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-400 ml-3" />
                            <span className="text-xs font-semibold text-slate-700">{ev.eventType?.replace(/_/g, ' ')}</span>
                            <span className={`ml-auto text-xs px-1.5 py-0.5 rounded font-medium ${sevColor[ev.severity] || 'bg-slate-100 text-slate-600'}`}>{ev.severity}</span>
                          </div>
                          <div className="ml-6 text-xs text-slate-400">{ev.depth}m · {ev.formation || 'Unknown'}</div>
                          {ev.sourcePage && <div className="ml-6 text-xs text-blue-500">Source: Page {ev.sourcePage}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mitigations branch */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggle('mitigations')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Wrench size={13} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold text-slate-700">Mitigations</div>
                      <div className="text-xs text-slate-400">{Object.keys(mitigationGroups).length} event type(s) with mitigations</div>
                    </div>
                    {expanded.mitigations ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                  </button>
                  {expanded.mitigations && (
                    <div className="border-t border-slate-50 max-h-60 overflow-y-auto">
                      {Object.keys(mitigationGroups).length === 0 && <div className="px-4 py-3 text-xs text-slate-400">No mitigations recorded.</div>}
                      {Object.entries(mitigationGroups).map(([type, items], i) => (
                        <div key={i} className="px-4 py-2.5 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-3" />
                            <span className="text-xs font-semibold text-slate-700">{type.replace(/_/g, ' ')}</span>
                          </div>
                          {items.slice(0, 2).map((m, j) => (
                            <div key={j} className="ml-6 text-xs text-slate-500 bg-emerald-50 rounded p-1.5 mb-1">
                              @{m.depth}m: {m.mitigation.substring(0, 80)}{m.mitigation.length > 80 ? '...' : ''}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reports branch */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggle('reports')}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText size={13} className="text-purple-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold text-slate-700">Source Documents</div>
                      <div className="text-xs text-slate-400">{currentReports.length} report(s)</div>
                    </div>
                    {expanded.reports ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                  </button>
                  {expanded.reports && (
                    <div className="border-t border-slate-50 max-h-60 overflow-y-auto">
                      {currentReports.length === 0 && <div className="px-4 py-3 text-xs text-slate-400">No reports for this well.</div>}
                      {currentReports.map((r, i) => (
                        <div key={i} className="px-4 py-2.5 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 ml-3" />
                            <span className="text-xs font-semibold text-slate-700 flex-1 truncate">{r.title}</span>
                          </div>
                          <div className="ml-6 flex gap-2 text-xs text-slate-400 mt-0.5">
                            <span>{r.pageCount || '?'} pages</span>
                            <span className={`px-1.5 py-0.5 rounded font-medium ${r.verificationStatus === 'FULLY_APPROVED' || r.verificationStatus === 'PARTIALLY_APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {r.verificationStatus?.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Relationship summary */}
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Relationship Summary</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">{currentWell.wellName}</span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full font-medium">{currentWell.formations?.length || 0} Formations</span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">{currentEvents.length} Events</span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-medium">{Object.keys(mitigationGroups).length} Mitigation Types</span>
                  <span className="text-slate-400">→</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">{currentReports.length} Documents</span>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
              <GitBranch size={36} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm">Select a well to explore its knowledge graph</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
