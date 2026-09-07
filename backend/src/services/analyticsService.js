// This service calculates graph scores without depending on a third-party
// graph library, which keeps the first version easy to understand and run.

const validateGraph = (graph) => {
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    throw new Error('Graph must contain nodes and edges arrays.');
  }
};

const nodeIds = (graph) => graph.nodes.map((node) => node.id);

// PageRank estimates importance by sharing each node's score with its
// neighbours. It is similar to finding well-connected hubs in a city map.
const calculatePageRank = (graph, { damping = 0.85, iterations = 20 } = {}) => {
  validateGraph(graph);
  const ids = nodeIds(graph);
  const scores = Object.fromEntries(ids.map((id) => [id, ids.length ? 1 / ids.length : 0]));
  const outgoing = Object.fromEntries(ids.map((id) => [id, []]));

  for (const edge of graph.edges) {
    if (outgoing[edge.source] && outgoing[edge.target]) {
      outgoing[edge.source].push(edge.target);
    }
  }

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const next = Object.fromEntries(ids.map((id) => [id, (1 - damping) / ids.length]));
    const danglingShare = ids
      .filter((id) => outgoing[id].length === 0)
      .reduce((total, id) => total + scores[id], 0) / (ids.length || 1);

    for (const id of ids) {
      next[id] += damping * danglingShare;
    }

    for (const source of ids) {
      const targets = outgoing[source];
      if (targets.length === 0) continue;

      const share = damping * scores[source] / targets.length;
      for (const target of targets) {
        next[target] += share;
      }
    }

    for (const id of ids) {
      scores[id] = next[id];
    }
  }

  return scores;
};

const shortestPathsFrom = (start, adjacency) => {
  const distances = { [start]: 0 };
  const paths = { [start]: 1 };
  const queue = [start];

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    for (const neighbour of adjacency[current]) {
      if (distances[neighbour] === undefined) {
        distances[neighbour] = distances[current] + 1;
        paths[neighbour] = paths[current];
        queue.push(neighbour);
      } else if (distances[neighbour] === distances[current] + 1) {
        paths[neighbour] += paths[current];
      }
    }
  }

  return { distances, paths, queue };
};

// Betweenness finds bridge-like nodes that sit between other nodes' shortest
// paths, similar to a middleman connecting separate groups.
const calculateBetweenness = (graph) => {
  validateGraph(graph);
  const ids = nodeIds(graph);
  const scores = Object.fromEntries(ids.map((id) => [id, 0]));
  const adjacency = Object.fromEntries(ids.map((id) => [id, []]));

  for (const edge of graph.edges) {
    if (adjacency[edge.source] && adjacency[edge.target]) {
      adjacency[edge.source].push(edge.target);
      adjacency[edge.target].push(edge.source);
    }
  }

  for (const start of ids) {
    const { distances, paths, queue } = shortestPathsFrom(start, adjacency);
    const dependencies = Object.fromEntries(ids.map((id) => [id, 0]));

    for (let index = queue.length - 1; index > 0; index -= 1) {
      const current = queue[index];
      for (const predecessor of ids) {
        if (
          adjacency[predecessor].includes(current)
          && distances[predecessor] === distances[current] - 1
        ) {
          dependencies[predecessor] += (
            (paths[predecessor] / paths[current]) * (1 + dependencies[current])
          );
        }
      }
      scores[current] += dependencies[current];
    }
  }

  return Object.fromEntries(ids.map((id) => [id, scores[id] / 2]));
};

const suspiciousPatterns = (graph, betweenness) => {
  const pairDocuments = new Map();

  for (const edge of graph.edges) {
    const pair = [edge.source, edge.target].sort().join('|');
    if (!pairDocuments.has(pair)) pairDocuments.set(pair, new Set());
    pairDocuments.get(pair).add(edge.source_document_id);
  }

  const highFrequencyContacts = [...pairDocuments.entries()]
    .filter(([, documents]) => documents.size > 5)
    .map(([pair, documents]) => ({
      source: pair.split('|')[0],
      target: pair.split('|')[1],
      document_count: documents.size
    }));

  const ids = Object.keys(betweenness);
  const bridgeCount = Math.max(1, Math.ceil(ids.length * 0.1));
  const bridgeNodes = ids
    .sort((left, right) => betweenness[right] - betweenness[left])
    .slice(0, bridgeCount);

  return {
    high_frequency_contacts: highFrequencyContacts,
    bridge_nodes: bridgeNodes
  };
};

const computeScores = async (graph) => {
  validateGraph(graph);
  const pagerank = calculatePageRank(graph);
  const betweenness = calculateBetweenness(graph);

  return {
    pagerank,
    betweenness,
    suspicious_patterns: suspiciousPatterns(graph, betweenness)
  };
};

module.exports = {
  computeScores,
  calculatePageRank,
  calculateBetweenness,
  suspiciousPatterns
};
