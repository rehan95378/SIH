import { useState } from 'react';
import { search } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import './SearchPanel.css';

export default function SearchPanel({ onSelect }) {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!query.trim()) {
      setError('Enter a name or identifier to search.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await search(token, query.trim(), type);
      setResults(data.results || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="panel search-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">FIND EVIDENCE</p>
          <h2>Search the network</h2>
        </div>
      </div>
      <form className="search-form" onSubmit={handleSubmit}>
        <input
          aria-label="Search term"
          placeholder="Search a person, place, document..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select aria-label="Search type" value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">Everything</option>
          <option value="entity">Entities</option>
          <option value="document">Documents</option>
          <option value="report">Reports</option>
        </select>
        <button disabled={busy} type="submit">{busy ? 'Searching...' : 'Search'}</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      <div className="search-results">
        {results.map((result) => (
          <button
            className="search-result"
            key={`${result.result_type}-${result.id}`}
            onClick={() => onSelect?.(result)}
            type="button"
          >
            <span>{result.result_type}</span>
            <strong>{result.title || 'Untitled result'}</strong>
            <small>{new Date(result.created_at).toLocaleDateString()}</small>
          </button>
        ))}
        {query && !busy && !results.length && !error && (
          <p className="muted">No matching records found.</p>
        )}
      </div>
    </article>
  );
}
