import { useState } from 'react';
import { uploadReport } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import './UploadPanel.css';

const evidenceTypes = [
  ['report', 'Report / text'],
  ['csv', 'CSV / auto-detect columns'],
  ['cdr', 'Call detail record'],
  ['financial', 'Financial transactions'],
  ['social', 'Social connections']
];

export default function UploadPanel({ onComplete }) {
  const { token } = useAuth();
  const [dataType, setDataType] = useState('report');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file && !content.trim()) {
      setMessage('Add text or choose a file first.');
      return;
    }
    setBusy(true);
    setMessage('Sending evidence to AI analysis...');
    try {
      const result = await uploadReport(token, {
        title: title || file?.name || `${dataType} evidence`,
        dataType,
        content,
        file
      });
      setAnalysis(result);
      setMessage(
        `Analysis complete: ${result.graph?.nodes?.length || 0} entities found.`
      );
      setContent('');
      setFile(null);
      onComplete?.(result);
    } catch (error) {
      setMessage(error.message);
      setAnalysis(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="upload-panel" onSubmit={handleSubmit}>
      <div className="upload-fields">
        <label>
          Evidence type
          <select value={dataType} onChange={(event) => setDataType(event.target.value)}>
            {evidenceTypes.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Title
          <input
            placeholder="Example: Warehouse incident report"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
      </div>
      <label>
        Upload file
        <input
          accept=".txt,.csv,.pdf,.png,.jpg,.jpeg"
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
      </label>
      <div className="upload-divider"><span>or paste text</span></div>
      <label>
        Evidence text
        <textarea
          placeholder="Paste a report or CSV here..."
          rows="8"
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      </label>
      <button disabled={busy} type="submit">
        {busy ? 'Analyzing...' : 'Analyze evidence'}
      </button>
      {message && <p className="upload-message">{message}</p>}
      {analysis?.graph?.nodes?.length > 0 && (
        <section className="analysis-result" aria-live="polite">
          <p className="eyebrow">PLAIN-LANGUAGE RESULT</p>
          <h2>What the system found</h2>
          <p className="muted">
            These are items detected in the text. The system links items that
            appear in the same evidence; it does not decide who committed a crime.
          </p>
          <div className="detected-groups">
            {Object.entries(
              analysis.graph.nodes.reduce((groups, node) => {
                groups[node.type] = [...(groups[node.type] || []), node.name];
                return groups;
              }, {})
            ).map(([type, names]) => (
              <div className="detected-group" key={type}>
                <strong>{type}</strong>
                <span>{names.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </form>
  );
}
