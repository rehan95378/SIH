import './GraphView.css';

const colors = {
  person: '#68d5b4',
  location: '#8db7ff',
  phone: '#f4bd72',
  vehicle: '#dd91dd',
  account: '#f78e69',
  organization: '#ffd166',
  money: '#06d6a0',
  email: '#118ab2',
  default: '#b2c2d4'
};

export default function GraphView({ nodes = [], edges = [], links = [], onSelect }) {
  const graphEdges = edges.length ? edges : links;
  const visibleNodes = nodes.slice(0, 24);
  const positions = visibleNodes.map((node, index) => {
    const angle = (index / Math.max(visibleNodes.length, 1)) * Math.PI * 2;
    return {
      ...node,
      x: 50 + Math.cos(angle) * 35,
      y: 50 + Math.sin(angle) * 34
    };
  });
  const byId = new Map(positions.map((node) => [node.id, node]));

  return (
    <div className="graph-view" aria-label="Entity relationship graph">
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {graphEdges.map((edge) => {
          const source = byId.get(edge.source);
          const target = byId.get(edge.target);
          if (!source || !target) return null;
          return (
            <line
              key={edge.id}
              x1={`${source.x}`}
              y1={`${source.y}`}
              x2={`${target.x}`}
              y2={`${target.y}`}
              stroke="rgba(141, 183, 255, 0.45)"
              strokeWidth="0.4"
            />
          );
        })}
      </svg>
      {positions.map((node) => (
        <button
          className="graph-node"
          key={node.id}
          onClick={() => onSelect?.(node)}
          style={{ left: `${node.x}%`, top: `${node.y}%`, '--node-color': colors[node.type] || colors.default }}
          title={`${node.name} (${node.type})`}
          type="button"
        >
          <span className="node-dot" />
          <span>{node.name}</span>
        </button>
      ))}
      {!nodes.length && <p className="graph-empty">No entities have been analyzed yet.</p>}
    </div>
  );
}
