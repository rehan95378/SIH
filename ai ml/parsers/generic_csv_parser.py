"""Schema-tolerant CSV extraction for unfamiliar evidence exports."""

import csv
import io
import re
from typing import Dict, List


HEADER_TYPES = {
    "phone": "phone", "mobile": "phone", "caller": "phone", "receiver": "phone",
    "email": "organization", "e-mail": "organization",
    "account": "organization", "account_id": "organization", "iban": "organization",
    "vehicle": "vehicle", "plate": "vehicle", "registration": "vehicle",
    "person": "person", "name": "person", "subject": "person",
    "suspect": "person", "victim": "person",
    "location": "location", "address": "location", "place": "location",
    "ip": "organization", "ip_address": "organization", "url": "organization",
    "date": "organization", "time": "organization", "timestamp": "organization",
    "device": "organization", "imei": "organization", "hash": "organization",
    "organization": "organization", "organisation": "organization", "company": "organization",
}
VALUE_PATTERNS = (
    ("phone", re.compile(r"(?:\+?\d[\d\s().-]{7,}\d)")),
)


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def _type_for_header(header: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", header.lower()).strip("_")
    if normalized in HEADER_TYPES:
        return HEADER_TYPES[normalized]
    for token, entity_type in HEADER_TYPES.items():
        if token in normalized:
            return entity_type
    return "csv_value"


def parse_generic_csv(content: str, document_id: str, max_rows: int = 10000) -> Dict:
    """Extract entities and same-row relationships from an unknown CSV schema."""
    if not document_id or not isinstance(content, str) or not content.strip():
        raise ValueError("document_id and non-empty content are required")

    reader = csv.DictReader(io.StringIO(content.lstrip("\ufeff"), newline=""))
    if not reader.fieldnames:
        raise ValueError("CSV must contain a header row")

    headers = [header.strip().lstrip("\ufeff") for header in reader.fieldnames]
    entities: List[Dict] = []
    relationships: List[Dict] = []
    entity_ids = {}
    row_count = 0

    def add_entity(entity_type: str, value: str) -> str:
        clean = re.sub(r"\s+", " ", value).strip()
        key = (entity_type, clean.casefold())
        if not clean:
            return ""
        if key not in entity_ids:
            entity_id = f"n-{_slug(entity_type)}-{_slug(clean)}"
            entity_ids[key] = entity_id
            entities.append({
                "id": entity_id,
                "type": entity_type,
                "name": clean,
                "source_document_id": document_id,
                "confidence": 0.65 if entity_type == "csv_value" else 0.82,
            })
        return entity_ids[key]

    for row_index, raw_row in enumerate(reader):
        if row_index >= max_rows:
            raise ValueError(f"CSV exceeds the {max_rows} row safety limit")
        row_count += 1
        row_entities = []
        for header, raw_value in zip(headers, raw_row.values()):
            value = (raw_value or "").strip()
            entity_id = add_entity(_type_for_header(header), value)
            if entity_id and entity_id not in row_entities:
                row_entities.append(entity_id)
            for entity_type, pattern in VALUE_PATTERNS:
                for match in pattern.findall(value):
                    detected_id = add_entity(entity_type, match.rstrip(".,;:"))
                    if detected_id and detected_id not in row_entities:
                        row_entities.append(detected_id)
        for left_index, source in enumerate(row_entities):
            for target in row_entities[left_index + 1:]:
                relationships.append({
                    "id": f"{document_id}-csv-{row_index}-{left_index}-{row_entities.index(target)}",
                    "source": source,
                    "target": target,
                    "relationship_type": "co-occurred",
                    "source_document_id": document_id,
                })

    if row_count == 0:
        raise ValueError("CSV must contain at least one data row")
    return {
        "status": "csv_auto_detected",
        "document_id": document_id,
        "entities": entities,
        "relationships": relationships,
        "metadata": {"columns": headers, "rows": row_count},
    }
