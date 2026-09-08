import { useEffect, useState } from 'react';
import { createCase, getCases, updateCaseStatus } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Cases.css';

export default function Cases() {
  const { token } = useAuth();
  const [cases, setCases] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCases = () => getCases(token)
    .then((result) => setCases(result.cases || []))
    .catch((requestError) => setError(requestError.message));

  useEffect(() => {
    loadCases();
  }, [token]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await createCase(token, {
        id: `case-${Date.now()}`,
        title,
        description
      });
      setCases((current) => [result.case, ...current]);
      setTitle('');
      setDescription('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (caseId, status) => {
    try {
      const result = await updateCaseStatus(token, caseId, status);
      setCases((current) => current.map((item) => (
        item.id === caseId ? result.case : item
      )));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  return (
    <section className="cases-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">INVESTIGATION MANAGEMENT</p>
          <h1>Cases</h1>
          <p className="muted">Create a case to keep related evidence and review work together.</p>
        </div>
      </div>
      {error && <p className="error-message">{error}</p>}

      <div className="cases-layout">
        <form className="panel case-form" onSubmit={handleCreate}>
          <p className="eyebrow">NEW INVESTIGATION</p>
          <h2>Create a case</h2>
          <label>
            Case title
            <input
              required
              placeholder="Example: East Port network"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          <label>
            Short description
            <textarea
              placeholder="What is this investigation about?"
              rows="5"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <button disabled={saving} type="submit">
            {saving ? 'Creating...' : 'Create case'}
          </button>
        </form>

        <div className="case-list">
          {cases.map((item) => (
            <article className="panel case-card" key={item.id}>
              <div>
                <span className={`case-status ${item.status}`}>{item.status}</span>
                <h2>{item.title}</h2>
                <p className="muted">{item.description || 'No description added.'}</p>
              </div>
              <select
                aria-label={`Change status for ${item.title}`}
                value={item.status}
                onChange={(event) => handleStatusChange(item.id, event.target.value)}
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </article>
          ))}
          {!cases.length && <p className="muted">No cases found yet.</p>}
        </div>
      </div>
    </section>
  );
}
