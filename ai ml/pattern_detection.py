"""Suspicious-pattern helpers for the crime-network graph."""

from typing import Dict, List


def detect_patterns(
    entities: List[Dict], relationships: List[Dict], betweenness: Dict[str, float] | None = None
) -> Dict:
    """Return simple explainable patterns for the frontend dashboard."""
    contact_documents = {}
    for relationship in relationships:
        pair = tuple(sorted((relationship["source"], relationship["target"])))
        contact_documents.setdefault(pair, set()).add(
            relationship["source_document_id"]
        )

    high_frequency_contacts = [
        {
            "source": pair[0],
            "target": pair[1],
            "document_count": len(documents),
        }
        for pair, documents in contact_documents.items()
        if len(documents) > 5
    ]

    scores = betweenness or {}
    bridge_count = max(1, (len(entities) + 9) // 10) if entities else 0
    bridge_nodes = [
        entity_id
        for entity_id, _score in sorted(
            scores.items(), key=lambda item: item[1], reverse=True
        )[:bridge_count]
    ]
    return {
        "high_frequency_contacts": high_frequency_contacts,
        "bridge_nodes": bridge_nodes,
    }
