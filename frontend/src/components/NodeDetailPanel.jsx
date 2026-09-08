import { useEffect, useState } from 'react';
import { getEntityRelationships } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import './NodeDetailPanel.css';

export default function NodeDetailPanel({ node, nodes }) {
  const { token } = useAuth();
  const [relationships, setRelationships] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!node) return undefined;
    setError('');
    getEntityRelationships(token, node.id)
      .then((result) => setRelationships(result.edges || []))
      .catch((requestError) => setError(requestError.message));
    return undefined;
  }, [node, token]);

  if (!node) {
    return (
      <aside className="node-detail-panel panel">
        <p className="muted">Select an entity to see its details.</p>
      </aside>
    );
  }

  const names = new Map(nodes.map((item) => [item.id, item.name]));
  return (
    <aside className="node-detail-panel panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">ENTITY DETAILS</p>
          <h2>{node.name}</h2>
        </div>
        <span className="entity-type-badge">{node.type}</span>
      </div>
      <div className="node-facts">
        <span>Confidence<strong>{node.confidence ? `${Math.round(node.confidence * 100)}%` : '—'}</strong></span>
        <span>PageRank<strong>{node.pagerank?.toFixed?.(3) || '—'}</strong></span>
        <span>Betweenness<strong>{node.betweenness?.toFixed?.(3) || '—'}</strong></span>
      </div>
      <h3>Direct connections</h3>
      {error && <p className="error-message">{error}</p>}
      <ul className="connection-list">
        {relationships.map((edge) => {
          const otherId = edge.source === node.id ? edge.target : edge.source;
          return (
            <li key={edge.id}>
              <span>{names.get(otherId) || otherId}</span>
              <small>{edge.relationship_type.replaceAll('_', ' ')}</small>
            </li>
          );
        })}
        {!relationships.length && !error && <li className="muted">No direct connections found.</li>}
      </ul>
    </aside>
  );
}
