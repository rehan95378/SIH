import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAnalytics, getGraph } from '../api/client.js';
import ReportExport from '../components/ReportExport.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './Dashboard.css';

const emptyState = {
  graph: { nodes: [], edges: [] },
  analytics: { pagerank: {}, betweenness: {}, suspicious_patterns: {} }
};

export default function Dashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(emptyState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getGraph(token), getAnalytics(token)])
      .then(([graph, analytics]) => {
        if (active) {
          setData({ graph, analytics });
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const nodeMap = new Map((data.graph?.nodes || []).map((n) => [n.id, n.name]));
  const topNode = Object.entries(data.analytics?.pagerank || {})
    .sort(([, first], [, second]) => second - first)[0];
  const patterns = data.analytics?.suspicious_patterns || {};

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">OVERVIEW</p>
          <h1>Investigation dashboard</h1>
          <p className="muted">A quick view of the evidence currently in your network.</p>
        </div>
        <div className="dashboard-actions">
          <span className="live-indicator">● Live data</span>
          <ReportExport analytics={data.analytics} graph={data.graph} />
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}
      {loading && <p className="muted">Loading investigation data...</p>}

      <div className="metric-grid">
        <article className="metric-card">
          <span>Entities</span>
          <strong>{data.graph?.nodes?.length || 0}</strong>
          <small>People, places, phones, and objects</small>
        </article>
        <article className="metric-card">
          <span>Connections</span>
          <strong>{data.graph?.edges?.length || 0}</strong>
          <small>Relationships found in evidence</small>
        </article>
        <article className="metric-card">
          <span>High-frequency contacts</span>
          <strong>{patterns.high_frequency_contacts?.length || 0}</strong>
          <small>Entities needing review</small>
        </article>
        <article className="metric-card accent">
          <span>Top-ranked entity</span>
          <strong>{topNode ? topNode[1].toFixed(3) : '—'}</strong>
          <small>{topNode ? (nodeMap.get(topNode[0]) || topNode[0]) : 'No graph data yet'}</small>
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">REVIEW QUEUE</p>
              <h2>Bridge nodes</h2>
            </div>
            <span className="count-badge">{patterns.bridge_nodes?.length || 0}</span>
          </div>
          {patterns.bridge_nodes?.length ? (
            <ul className="simple-list">
              {patterns.bridge_nodes.slice(0, 5).map((node, index) => {
                const id = typeof node === 'string' ? node : (node?.entity_id || `bridge-${index}`);
                const name = typeof node === 'string'
                  ? (nodeMap.get(node) || node)
                  : (node?.entity_name || nodeMap.get(node?.entity_id) || id);
                const connectionCount = typeof node === 'object' && node?.contact_count != null
                  ? `${node.contact_count} connections`
                  : `${(data.graph?.edges?.filter((e) => e.source === id || e.target === id) || []).length} connections`;
                return (
                  <li key={id}>
                    <strong>{name}</strong>
                    <span>{connectionCount}</span>
                  </li>
                );
              })}
            </ul>
          ) : <p className="muted">No bridge nodes found yet.</p>}
        </article>
        <article className="panel">
          <p className="eyebrow">NEXT STEP</p>
          <h2>Upload more evidence</h2>
          <p className="muted">
            Add a report, PDF, image, CDR, financial file, or social file to
            expand the network.
          </p>
          <Link className="primary-link" to="/ingest">Open upload workspace →</Link>
        </article>
      </div>
    </section>
  );
}
