"""Graph analytics for the crime-network response contract."""

from collections import defaultdict, deque
from typing import Dict, List


def _validate_graph(entities: List[Dict], relationships: List[Dict]) -> None:
    """Reject graph records that cannot be analysed safely."""
    entity_ids = {entity.get("id") for entity in entities}
    if None in entity_ids:
        raise ValueError("every entity must have an id")

    for relationship in relationships:
        if (
            relationship.get("source") not in entity_ids
            or relationship.get("target") not in entity_ids
        ):
            raise ValueError("relationship references an unknown entity")


def calculate_pagerank(
    entities: List[Dict], relationships: List[Dict], iterations: int = 30
) -> Dict[str, float]:
    """Calculate a simple undirected PageRank score for each entity."""
    _validate_graph(entities, relationships)
    node_ids = [entity["id"] for entity in entities]
    if not node_ids:
        return {}

    graph = {node_id: set() for node_id in node_ids}
    for relationship in relationships:
        source = relationship["source"]
        target = relationship["target"]
        if source != target:
            graph[source].add(target)
            graph[target].add(source)

    damping = 0.85
    scores = {node_id: 1 / len(node_ids) for node_id in node_ids}
    for _ in range(iterations):
        updated = {}
        for node_id in node_ids:
            incoming = sum(
                scores[source] / len(graph[source])
                for source in node_ids
                if node_id in graph[source] and graph[source]
            )
            dangling = sum(
                scores[source] / len(node_ids)
                for source in node_ids
                if not graph[source]
            )
            updated[node_id] = (1 - damping) / len(node_ids) + damping * (
                incoming + dangling
            )
        scores = updated

    return scores


def calculate_betweenness(
    entities: List[Dict], relationships: List[Dict]
) -> Dict[str, float]:
    """Count how often a node lies on shortest paths between other nodes."""
    _validate_graph(entities, relationships)
    node_ids = [entity["id"] for entity in entities]
    graph = {node_id: set() for node_id in node_ids}
    for relationship in relationships:
        source = relationship["source"]
        target = relationship["target"]
        if source != target:
            graph[source].add(target)
            graph[target].add(source)

    scores = defaultdict(float)
    for start in node_ids:
        distances = {start: 0}
        paths = {node_id: 0 for node_id in node_ids}
        paths[start] = 1
        queue = deque([start])
        order = []

        while queue:
            current = queue.popleft()
            order.append(current)
            for neighbor in graph[current]:
                if neighbor not in distances:
                    distances[neighbor] = distances[current] + 1
                    queue.append(neighbor)
                if distances[neighbor] == distances[current] + 1:
                    paths[neighbor] += paths[current]

        dependencies = defaultdict(float)
        for current in reversed(order):
            for neighbor in graph[current]:
                if distances.get(neighbor) == distances[current] + 1:
                    dependencies[current] += (
                        paths[current] / paths[neighbor]
                    ) * (1 + dependencies[neighbor])
            if current != start:
                scores[current] += dependencies[current]

    return dict(scores)


def suspicious_patterns(
    entities: List[Dict], relationships: List[Dict]
) -> Dict[str, List[str]]:
    """Flag highly connected entities and entities joining separate groups."""
    _validate_graph(entities, relationships)
    degrees = {entity["id"]: 0 for entity in entities}
    for relationship in relationships:
        degrees[relationship["source"]] += 1
        degrees[relationship["target"]] += 1

    if not degrees:
        return {"high_frequency_contacts": [], "bridge_nodes": []}

    average_degree = sum(degrees.values()) / len(degrees)
    high_frequency = [
        node_id for node_id, degree in degrees.items() if degree > average_degree * 1.5
    ]
    bridge_nodes = [
        node_id
        for node_id, degree in degrees.items()
        if degree >= 2 and degree == max(degrees.values())
    ]
    return {
        "high_frequency_contacts": high_frequency,
        "bridge_nodes": bridge_nodes,
    }


def analyze_graph(entities: List[Dict], relationships: List[Dict]) -> Dict:
    """Return all analytics in one backend-friendly object."""
    pagerank = calculate_pagerank(entities, relationships)
    betweenness = calculate_betweenness(entities, relationships)
    return {
        "pagerank": pagerank,
        "betweenness": betweenness,
        "suspicious_patterns": suspicious_patterns(entities, relationships),
    }