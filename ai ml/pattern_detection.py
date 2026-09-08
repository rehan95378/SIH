"""Suspicious-pattern helpers for the crime-network graph."""

from collections import Counter
from typing import Dict, List


def detect_patterns(entities: List[Dict], relationships: List[Dict]) -> Dict:
    """Return simple explainable patterns for the frontend dashboard."""
    entity_names = {
        entity["id"]: entity.get("name", entity["id"]) for entity in entities
    }
    contact_counts = Counter()
    for relationship in relationships:
        contact_counts[relationship["source"]] += 1
        contact_counts[relationship["target"]] += 1

    high_frequency_contacts = [
        {
            "entity_id": entity_id,
            "entity_name": entity_names[entity_id],
            "contact_count": count,
        }
        for entity_id, count in contact_counts.most_common()
        if count >= 3
    ]

    bridge_nodes = [
        {
            "entity_id": entity_id,
            "entity_name": entity_names[entity_id],
            "contact_count": count,
        }
        for entity_id, count in contact_counts.most_common()
        if count == max(contact_counts.values(), default=0) and count >= 2
    ]

    return {
        "high_frequency_contacts": high_frequency_contacts,
        "bridge_nodes": bridge_nodes,
    }
