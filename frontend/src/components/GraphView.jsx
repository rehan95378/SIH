import './GraphView.css';

const colors = {
  person: '#68d5b4',
  location: '#8db7ff',
  phone: '#f4bd72',
  vehicle: '#dd91dd',
  default: '#b2c2d4'
};

export default function GraphView({ nodes = [], edges = [], onSelect }) {
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
      {edges.map((edge) => {
        const source = byId.get(edge.source);
        const target = byId.get(edge.target);
        if (!source || !target) return null;
        return (
          <span
            className="graph-edge"
            key={edge.id}
            style={{
              left: `${source.x}%`,
              top: `${source.y}%`,
              width: `${Math.hypot(target.x - source.x, target.y - source.y)}%`,
              transform: `rotate(${Math.atan2(target.y - source.y, target.x - source.x)}rad)`
            }}
          />
        );
      })}
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
