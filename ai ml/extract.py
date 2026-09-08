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
    """Extract useful evidence entities with conservative report rules.

    The demo NER model was trained on short synthetic sentences. For long,
    natural-language complaints, deterministic patterns avoid treating words
    such as "Yours" or "10:00" as people.
    """
    if not document_id or not isinstance(content, str) or not content.strip():
        raise ValueError("document_id and non-empty content are required")

    entities: List[Dict] = []
    seen = set()

    for value in re.findall(
        r"(?:\+?\d[\d\s().-]{7,}\d|\b\d{4}[Xx]{6}\b)", content
    ):
        _add_entity(entities, seen, document_id, "phone", value, 0.98)

    for value in re.findall(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", content, re.I):
        _add_entity(entities, seen, document_id, "email", value, 0.98)

    for value in re.findall(r"\b[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}\b", content, re.I):
        _add_entity(entities, seen, document_id, "vehicle", value.upper(), 0.95)

    for value in re.findall(
        r"(?:₹|Rs\.?|INR)\s?[\d,]+(?:\.\d{1,2})?", content, re.I
    ):
        _add_entity(entities, seen, document_id, "money", value, 0.98)

    for value in re.findall(
        r"\b(?:\d{1,2}(?:st|nd|rd|th)?\s+"
        r"(?:January|February|March|April|May|June|July|August|September|October|November|December)"
        r"\s+\d{4}|\d{4}-\d{2}-\d{2})\b",
        content,
        re.I,
    ):
        _add_entity(entities, seen, document_id, "date", value, 0.97)

    for value in re.findall(
        r"\b(?:Lenovo laptop|digital camera|gold jewellery|silver ornaments)\b",
        content,
        re.I,
    ):
        _add_entity(entities, seen, document_id, "item", value, 0.92)

    organization_pattern = (
        r"\b[A-Z][\w&]*(?:\s+[A-Z][\w&]*){0,5}\s+"
        r"(?:Logistics|Industries|Corporation|Corp|Company|Ltd|Limited)\b"
    )
    for value in re.findall(organization_pattern, content):
        _add_entity(entities, seen, document_id, "organization", value, 0.90)

    location_pattern = (
        r"\b(?:near|at|in|from|Police Station)\s+"
        r"([A-Z][\w-]*(?:\s+[A-Z][\w-]*){0,3})"
    )
    for value in re.findall(location_pattern, content):
        _add_entity(entities, seen, document_id, "location", value, 0.88)

    ignored_words = {
        "The", "A", "An", "This", "Report", "Near", "At", "In", "From",
        "Officer", "Charge", "Police", "Station", "New", "Delhi", "Yours",
        "Thanking", "Lenovo", "One", "Yesterday", "September",
    }
    for value in re.findall(
        r"\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){2}(?=Mobile|Phone|\b)",
        content,
    ):
        if not any(word in ignored_words for word in value.split()):
            _add_entity(entities, seen, document_id, "person", value, 0.86)

    for value in re.findall(
        r"\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,2}\b", content
    ):
        if not any(word in ignored_words for word in value.split()):
            _add_entity(entities, seen, document_id, "person", value, 0.86)

    # Prefer the longest version when a full name also produced a shorter span.
    return [
        entity for entity in entities
        if not any(
            entity["type"] == other["type"]
            and entity["name"].lower() != other["name"].lower()
            and entity["name"].lower() in other["name"].lower()
            for other in entities
        )
    ]


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
        "status": "report_rule_based",
        "document_id": document_id,
        "entities": entities,
        "relationships": build_relationships(document_id, entities),
    }