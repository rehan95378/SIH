import { useEffect, useState } from 'react';
import { getAuditLog } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Audit.css';

export default function Audit() {
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    getAuditLog(token)
      .then((result) => setLogs(result.logs || []))
      .catch((requestError) => setError(requestError.message));
  }, [token]);

  return (
    <section className="audit-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ACCOUNTABILITY</p>
          <h1>Audit log</h1>
          <p className="muted">A timeline of actions recorded by the investigation system.</p>
        </div>
      </div>
      {error && <p className="error-message">{error}</p>}
      <article className="panel audit-panel">
        {logs.map((log) => (
          <div className="audit-row" key={log.id}>
            <div>
              <strong>{log.action}</strong>
              <p className="muted">
                {log.resource_type || 'system'}
                {log.resource_id ? ` · ${log.resource_id}` : ''}
              </p>
            </div>
            <time dateTime={log.created_at}>
              {new Date(log.created_at).toLocaleString()}
            </time>
          </div>
        ))}
        {!logs.length && <p className="muted">No recorded actions yet.</p>}
      </article>
    </section>
  );
}
