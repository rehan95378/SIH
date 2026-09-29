import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { LoadingState } from '../../components/States';
import { Search } from 'lucide-react';

const Knowledge = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.post('/rag/search', { query, topK: 10 });
      setResults(res.data.data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Knowledge Base Search</h1>
        <p className="text-sm text-slate-500 mt-0.5">Search verified historical drilling knowledge using semantic RAG</p>
      </div>
      <div className="flex gap-3">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder='e.g., "mud loss in Formation-X" or "stuck pipe mitigation"'
          className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={search} disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
          <Search className="w-4 h-4" /> {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {loading && <LoadingState message="Searching knowledge base..." />}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">{results.length} results found</p>
          {results.map((r, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="text-xs font-semibold text-blue-700">{r.wellName || r.well || 'Unknown Well'}</div>
                {r.relevance && <span className="text-xs text-slate-400">Relevance: {(r.relevance * 100).toFixed(0)}%</span>}
              </div>
              <p className="text-sm text-slate-700 mb-2">{r.text?.substring(0, 300)}</p>
              <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                {r.depth && <span>Depth: {r.depth}m</span>}
                {(r.formation || r.metadata?.formation) && <span>Formation: {r.formation || r.metadata.formation}</span>}
                {(r.eventType || r.metadata?.event_type) && <span>Event: {(r.eventType || r.metadata.event_type)?.replace(/_/g, ' ')}</span>}
                {(r.page || r.page_number) && <span>Page: {r.page || r.page_number}</span>}
                {r.is_verified && <span className="text-emerald-600 font-medium">✓ Verified</span>}
                {r.fallback && <span className="text-amber-600">(Database fallback)</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {searched && results.length === 0 && !loading && (
        <div className="text-center py-12 text-slate-400 text-sm">
          No results found. Try different search terms or check if documents have been indexed.
        </div>
      )}
    </div>
  );
};

export default Knowledge;
