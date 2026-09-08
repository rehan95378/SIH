import './EntityList.css';

export default function EntityList({ nodes = [], onSelect }) {
  return (
    <div className="entity-list">
      {nodes.map((node) => (
        <button className="entity-row" key={node.id} onClick={() => onSelect?.(node)} type="button">
          <span className="entity-type">{node.type}</span>
          <strong>{node.name}</strong>
          <span className="entity-confidence">
            {node.confidence ? `${Math.round(node.confidence * 100)}% match` : 'Analyzed'}
          </span>
        </button>
      ))}
      {!nodes.length && <p className="muted">No entities found yet.</p>}
    </div>
  );
}
