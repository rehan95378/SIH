"""Parser for simple social-connection CSV files."""

import csv
import io
from typing import Dict, List


def parse_social_connections(content: str, document_id: str) -> Dict:
    """Convert social connection rows into person entities and links.

    Required columns are ``source`` and ``target``. An optional ``platform``
    column is kept as relationship metadata.
    """
    if not document_id or not isinstance(content, str) or not content.strip():
        raise ValueError("document_id and non-empty content are required")

    rows = csv.DictReader(io.StringIO(content))
    required = {"source", "target"}
    available = {field.strip().lower() for field in (rows.fieldnames or [])}
    if not required.issubset(available):
        raise ValueError("social CSV must contain source and target columns")

    entities: List[Dict] = []
    entity_ids = {}
    relationships: List[Dict] = []

    def add_person(value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("social source and target values cannot be empty")
        if name not in entity_ids:
            entity_id = f"{document_id}-person-{len(entity_ids)}"
            entity_ids[name] = entity_id
            entities.append(
                {
                    "id": entity_id,
                    "type": "person",
                    "name": name,
                    "source_document_id": document_id,
                    "confidence": 0.90,
                }
            )
        return entity_ids[name]

    for index, raw_row in enumerate(rows):
        row = {
            key.strip().lower(): (value or "").strip()
            for key, value in raw_row.items()
        }
        source_id = add_person(row["source"])
        target_id = add_person(row["target"])
        if source_id == target_id:
            raise ValueError("social source and target must be different")

        relationships.append(
            {
                "id": f"{document_id}-social-{index}",
                "source": source_id,
                "target": target_id,
                "relationship_type": "connected_to",
                "source_document_id": document_id,
                "metadata": {
                    "platform": row.get("platform", ""),
                    "timestamp": row.get("timestamp", ""),
                },
            }
        )

    return {
        "status": "social_csv",
        "document_id": document_id,
        "entities": entities,
        "relationships": relationships,
    }
