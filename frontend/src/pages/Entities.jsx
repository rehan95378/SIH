import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getGraph } from '../api/client.js';
import EntityList from '../components/EntityList.jsx';
import GraphView from '../components/GraphView.jsx';
import SearchPanel from '../components/SearchPanel.jsx';
import NodeDetailPanel from '../components/NodeDetailPanel.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './Entities.css';

export default function Entities() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const sourceDocumentId = searchParams.get('source_document_id') || '';
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getGraph(token, sourceDocumentId)
      .then(setGraph)
      .catch((requestError) => setError(requestError.message));
  }, [token, sourceDocumentId]);

  return (
    <section className="entities-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">NETWORK EXPLORER</p>
          <h1>Entities and connections</h1>
          <p className="muted">
            {sourceDocumentId
              ? 'Showing entities from the evidence you just uploaded.'
              : 'Showing entities from all stored evidence.'}
          </p>
        </div>
      </div>
      {error && <p className="error-message">{error}</p>}
      <SearchPanel
        onSelect={(result) => {
          const matchingNode = graph.nodes.find((node) => node.id === result.id);
          if (matchingNode) setSelected(matchingNode);
        }}
      />
      <GraphView edges={graph.edges} nodes={graph.nodes} onSelect={setSelected} />
      <NodeDetailPanel node={selected} nodes={graph.nodes} />
      <article className="panel entities-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">FOUND IN EVIDENCE</p>
            <h2>Entity list</h2>
          </div>
          <span className="count-badge">{graph.nodes.length}</span>
        </div>
        <EntityList nodes={graph.nodes} onSelect={setSelected} />
      </article>
    </section>
  );
}
