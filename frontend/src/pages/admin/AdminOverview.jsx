import { useEffect, useState } from 'react';
import { getAdminOverview } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import './AdminOverview.css';

const metrics = [
  ['users', 'Users', 'People with system accounts'],
  ['documents', 'Documents', 'Evidence items uploaded'],
  ['entities', 'Entities', 'People, places, and objects found'],
  ['relationships', 'Relationships', 'Connections found by the AI'],
  ['cases', 'Cases', 'Investigation workspaces'],
  ['reports', 'Reports', 'Generated investigation reports'],
  ['audit_logs', 'Audit events', 'Recorded system actions']
];

export default function AdminOverview() {
  const { token } = useAuth();
  const [overview, setOverview] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminOverview(token)
      .then((result) => setOverview(result.overview || {}))
      .catch((requestError) => setError(requestError.message));
  }, [token]);

  return (
    <section className="admin-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>System overview</h1>
          <p className="muted">A quick summary of what is currently stored in the platform.</p>
        </div>
      </div>
      {error && <p className="error-message">{error}</p>}
      <div className="admin-metric-grid">
        {metrics.map(([key, label, description]) => (
          <article className="metric-card" key={key}>
            <span>{label}</span>
            <strong>{overview[key] ?? '—'}</strong>
            <small>{description}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
