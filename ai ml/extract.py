"""Rule-based entity extraction for crime reports.

This first version lets the complete application work before a trained
machine-learning model is connected.
"""

import re
from pathlib import Path
from typing import Dict, List

MODEL_PATH = Path(__file__).with_name("models") / "ner"


def _slug(value: str) -> str:
    """Create a stable id segment from an entity name."""
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def _add_entity(
    entities: List[Dict],
    seen: set,
    document_id: str,
    entity_type: str,
    name: str,
    confidence: float,
) -> None:
    """Add a unique entity using the backend database contract."""
    clean_name = re.sub(r"\s+", " ", name).strip(" .,;:")
    key = (entity_type, clean_name.lower())
    if not clean_name or key in seen:
        return

    seen.add(key)
    entities.append(
        {
            "id": f"{document_id}-{_slug(entity_type)}-{_slug(clean_name)}",
            "type": entity_type,
            "name": clean_name,
            "source_document_id": document_id,
            "confidence": confidence,
        }
    )


def extract_entities(document_id: str, content: str) -> List[Dict]:
    """Extract phones, vehicles, organizations, locations, and people."""
    if not document_id or not isinstance(content, str) or not content.strip():
        raise ValueError("document_id and non-empty content are required")

    entities: List[Dict] = []
    seen = set()

    if MODEL_PATH.exists():
        try:
            import spacy
            model = spacy.load(MODEL_PATH)
            for span in model(content).ents:
                _add_entity(
                    entities,
                    seen,
                    document_id,
                    span.label_.lower(),
                    span.text,
                    0.85,
                )
            if entities:
                return entities
        except (ImportError, OSError):
            pass

    for value in re.findall(r"\+?\d[\d\s().-]{7,}\d", content):
        _add_entity(entities, seen, document_id, "phone", value, 0.98)

    for value in re.findall(r"\b[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}\b", content, re.I):
        _add_entity(entities, seen, document_id, "vehicle", value.upper(), 0.95)

    organization_pattern = (
        r"\b[A-Z][\w&]*(?:\s+[A-Z][\w&]*){0,5}\s+"
        r"(?:Logistics|Industries|Corporation|Corp|Company|Ltd|Limited)\b"
    )
    for value in re.findall(organization_pattern, content):
        _add_entity(entities, seen, document_id, "organization", value, 0.90)

    location_pattern = r"\b(?:near|at|in|from)\s+([A-Z][\w-]*(?:\s+[A-Z][\w-]*){0,3})"
    for value in re.findall(location_pattern, content):
        _add_entity(entities, seen, document_id, "location", value, 0.78)

    ignored_words = {"The", "A", "An", "This", "Report", "Near", "At", "In", "From"}
    for value in re.findall(r"\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?\b", content):
        if value not in ignored_words:
            _add_entity(entities, seen, document_id, "person", value, 0.70)

    return entities


def build_relationships(document_id: str, entities: List[Dict]) -> List[Dict]:
    """Create co-occurrence links between entities in the same document."""
    relationships = []
    for source_index, source in enumerate(entities):
        for target_index in range(source_index + 1, len(entities)):
            target = entities[target_index]
            relationships.append(
                {
                    "id": f"{document_id}-edge-{source_index}-{target_index}",
                    "source": source["id"],
                    "target": target["id"],
                    "relationship_type": "co_occurs",
                    "source_document_id": document_id,
                }
            )
    return relationships


def extract_document(document_id: str, content: str) -> Dict:
    """Return entities and relationships in the backend's AI response shape."""
    entities = extract_entities(document_id, content)
    return {
        "status": "trained_ner" if MODEL_PATH.exists() else "local_rule_based",
        "document_id": document_id,
        "entities": entities,
        "relationships": build_relationships(document_id, entities),
    }