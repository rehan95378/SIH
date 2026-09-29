import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import WellMap from '../../components/WellMap';
import WellCard from '../../components/WellCard';
import RiskBadge from '../../components/RiskBadge';
import { LoadingState } from '../../components/States';

const WellMapPage = () => {
  const [wells, setWells] = useState([]);
  const [activeWell, setActiveWell] = useState(null);
  const [nearbyWells, setNearbyWells] = useState([]);
  const [selectedWell, setSelectedWell] = useState(null);
  const [radius, setRadius] = useState(20);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ formation: '', status: '', riskLevel: '' });

  useEffect(() => {
    loadWells();
  }, []);

  useEffect(() => {
    if (activeWell) loadNearby();
  }, [activeWell?._id, radius]);

  const loadWells = async () => {
    setLoading(true);
    try {
      const res = await api.get('/wells?status=DRILLING');
      const drilling = res.data.data;
      setWells(drilling);
      if (drilling.length > 0) setActiveWell(drilling[0]);
    } finally {
      setLoading(false);
    }
  };

  const loadNearby = async () => {
    if (!activeWell) return;
    try {
      const res = await api.get(`/wells/${activeWell._id}/nearby?radius=${radius}`);
      setNearbyWells(res.data.data);
    } catch {}
  };

  const filteredNearby = nearbyWells.filter(w => {
    if (filters.status && w.status !== filters.status) return false;
    if (filters.riskLevel && w.riskLevel !== filters.riskLevel) return false;
    if (filters.formation && !w.formations?.some(f => f.name.toLowerCase().includes(filters.formation.toLowerCase()))) return false;
    return true;
  });

  if (loading) return <LoadingState message="Loading well map..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Well Map</h1>
          <p className="text-sm text-slate-500 mt-0.5">Interactive geospatial view of active and offset wells</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Active Well</label>
          <select
            value={activeWell?._id || ''}
            onChange={e => setActiveWell(wells.find(w => w._id === e.target.value))}
            className="text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {wells.map(w => <option key={w._id} value={w._id}>{w.wellName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Search Radius</label>
          <select
            value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            className="text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[5, 10, 20, 50].map(r => <option key={r} value={r}>{r} km</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Risk Level</label>
          <select
            value={filters.riskLevel}
            onChange={e => setFilters(f => ({ ...f, riskLevel: e.target.value }))}
            className="text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Risks</option>
            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            {['COMPLETED', 'SUSPENDED', 'PRODUCING', 'ABANDONED'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="text-sm text-slate-500">
          {filteredNearby.length} wells found within {radius} km
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <WellMap
              activeWell={activeWell}
              nearbyWells={filteredNearby}
              onWellClick={setSelectedWell}
              radius={radius}
              height="560px"
            />
          </div>
        </div>

        {/* Well list */}
        <div className="space-y-3">
          {/* Selected well detail */}
          {selectedWell && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-800 mb-2">{selectedWell.wellName}</h3>
              <div className="space-y-1.5 text-xs text-blue-700">
                <div><span className="text-blue-500">Field:</span> {selectedWell.field}</div>
                <div><span className="text-blue-500">Status:</span> {selectedWell.status}</div>
                <div><span className="text-blue-500">Depth:</span> {selectedWell.currentDepth?.toLocaleString()}m</div>
                <div><span className="text-blue-500">Formation:</span> {selectedWell.currentFormation || 'N/A'}</div>
                {selectedWell.distance && <div><span className="text-blue-500">Distance:</span> {selectedWell.distance.toFixed(2)} km</div>}
                <div><span className="text-blue-500">Events:</span> {selectedWell.eventCount || 0} verified</div>
                <div className="pt-1"><RiskBadge level={selectedWell.riskLevel} size="xs" /></div>
              </div>
            </div>
          )}

          {/* Nearby wells list */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredNearby.map(well => (
              <WellCard
                key={well._id}
                well={well}
                distance={well.distance}
                onClick={setSelectedWell}
                compact={false}
              />
            ))}
            {filteredNearby.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                No wells found within {radius} km with current filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WellMapPage;
