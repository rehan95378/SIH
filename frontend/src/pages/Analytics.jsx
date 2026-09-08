import { useEffect, useMemo, useState } from 'react';
import { getAnalytics, getGraph } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Analytics.css';

const emptyAnalytics = {
  pagerank: {},
  betweenness: {},
  suspicious_patterns: {}
};

export default function Analytics() {
  const { token } = useAuth();
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getGraph(token), getAnalytics(token)])
      .then(([graphData, analyticsData]) => {
        setGraph(graphData);
        setAnalytics(analyticsData);
      })
      .catch((requestError) => setError(requestError.message));
  }, [token]);

  const names = useMemo(
    () => new Map(graph.nodes.map((node) => [node.id, node.name])),
    [graph.nodes]
  );
  const rankedEntities = Object.entries(analytics.pagerank)
    .sort(([, first], [, second]) => second - first)
    .slice(0, 10);
  const bridgeNodes = analytics.suspicious_patterns.bridge_nodes || [];
  const frequentContacts = analytics.suspicious_patterns.high_frequency_contacts || [];

  return (
    <section className="analytics-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">NETWORK INTELLIGENCE</p>
          <h1>Analytics</h1>
          <p className="muted">
            These scores help prioritize which entities deserve closer review.
          </p>
        </div>
      </div>
      {error && <p className="error-message">{error}</p>}

      <div className="analytics-grid">
        <article className="panel">
          <p className="eyebrow">IMPORTANCE</p>
          <h2>Most connected entities</h2>
          <p className="muted">Higher scores mean the entity is more central in the network.</p>
          <ol className="score-list">
            {rankedEntities.map(([id, score]) => (
              <li key={id}>
                <span>{names.get(id) || id}</span>
                <strong>{score.toFixed(3)}</strong>
              </li>
            ))}
            {!rankedEntities.length && <p className="muted">No scores available yet.</p>}
          </ol>
        </article>

        <article className="panel">
          <p className="eyebrow">BRIDGE NODES</p>
          <h2>Entities linking groups</h2>
          <p className="muted">These entities may connect otherwise separate parts of the network.</p>
          <ul className="tag-list">
            {bridgeNodes.map((id) => <li key={id}>{names.get(id) || id}</li>)}
            {!bridgeNodes.length && <p className="muted">No bridge nodes found yet.</p>}
          </ul>
        </article>
      </div>

      <article className="panel">
        <p className="eyebrow">REPEATED CONTACTS</p>
        <h2>High-frequency relationships</h2>
        <p className="muted">These pairs appeared together in more than five documents.</p>
        {frequentContacts.length ? (
          <ul className="score-list">
            {frequentContacts.map((contact) => (
              <li key={`${contact.source}-${contact.target}`}>
                <span>{names.get(contact.source) || contact.source} ↔ {names.get(contact.target) || contact.target}</span>
                <strong>{contact.document_count} documents</strong>
              </li>
            ))}
          </ul>
        ) : <p className="muted">No repeated contact patterns found yet.</p>}
      </article>
    </section>
  );
}
