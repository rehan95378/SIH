"""Rule-based entity extraction for crime reports.

This first version lets the complete application work before a trained
machine-learning model is connected.
"""

import re
import os
from pathlib import Path
from typing import Dict, List

MODEL_PATH = Path(__file__).with_name("models") / "ner"
MODEL_MAX_CHARS = int(os.getenv("NER_CHUNK_SIZE", "12000"))
_NER = None


def _load_model():
    """Load the optional trained model once, without making it mandatory."""
    global _NER
    if _NER is not None:
        return _NER
    if not MODEL_PATH.exists() or os.getenv("DISABLE_NER_MODEL") == "1":
        return None
    try:
        import spacy
        _NER = spacy.load(MODEL_PATH)
    except (ImportError, OSError, ValueError):
        return None
    return _NER


def _chunks(content: str, max_chars: int = MODEL_MAX_CHARS):
    """Split long multi-line documents at whitespace while retaining offsets."""
    if len(content) <= max_chars:
        yield content, 0
        return
    start = 0
    while start < len(content):
        end = min(start + max_chars, len(content))
        if end < len(content):
            boundary = content.rfind("\n", start, end)
            if boundary <= start:
                boundary = content.rfind(" ", start, end)
            if boundary > start:
                end = boundary
        yield content[start:end], start
        start = end


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
        if re.match(r"^\d{4}-\d{2}-\d{2}$", value.strip()):
            continue
        _add_entity(entities, seen, document_id, "phone", value, 0.98)

    for value in re.findall(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", content, re.I):
        _add_entity(entities, seen, document_id, "email", value, 0.98)

    for value in re.findall(r"\b[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}\b", content, re.I):
        _add_entity(entities, seen, document_id, "vehicle", value.upper(), 0.95)

    for value in re.findall(
        r"\b(?:IP\s+)?(?:\d{1,3}\.){3}\d{1,3}\b", content, re.I
    ):
        _add_entity(entities, seen, document_id, "ip_address", value, 0.96)

    for value in re.findall(r"https?://[^\s<>()\[\]{}\"']+", content, re.I):
        _add_entity(entities, seen, document_id, "url", value.rstrip(".,;:"), 0.96)

    for value in re.findall(r"\b(?:[01]\d|2[0-3]):[0-5]\d\b", content):
        _add_entity(entities, seen, document_id, "time", value, 0.94)

    for value in re.findall(
        r"\b(?:SHA256|MD5)\s+[a-f0-9]{16,64}\b", content, re.I
    ):
        _add_entity(entities, seen, document_id, "hash", value, 0.96)

    for value in re.findall(
        r"\b(?:FIR|CASE|ECIR|SEIZURE)-[A-Z0-9-]{4,}\b", content, re.I
    ):
        _add_entity(entities, seen, document_id, "case_id", value, 0.96)

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

    model = _load_model()
    if model:
        for chunk, offset in _chunks(content):
            for span in model(chunk).ents:
                if not span.text.strip():
                    continue
                label = span.label_.lower()
                model_name = re.sub(r"\s+", " ", span.text).strip()
                if any(
                    model_name.lower() in entity["name"].lower()
                    or entity["name"].lower() in model_name.lower()
                    for entity in entities
                ):
                    continue
                _add_entity(entities, seen, document_id, label, model_name, 0.78)

    # Prefer specific types (e.g., person) over location if same name was matched,
    # and prefer the longest version when a full name also produced a shorter span.
    clean_entities = [
        entity for entity in entities
        if not (
            entity["type"] == "location"
            and any(other["type"] == "person" and other["name"].lower() == entity["name"].lower() for other in entities)
        )
    ]
    return [
        entity for entity in clean_entities
        if not any(
            entity["type"] == other["type"]
            and entity["name"].lower() != other["name"].lower()
            and entity["name"].lower() in other["name"].lower()
            for other in clean_entities
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