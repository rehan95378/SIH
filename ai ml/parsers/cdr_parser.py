"""Parser for simple call-detail-record (CDR) CSV files."""

import csv
import io
from typing import Dict, List


def parse_cdr(content: str, document_id: str) -> Dict:
    """Convert CDR rows into phone entities and call relationships.

    Expected columns are ``caller``, ``receiver``, and optionally
    ``timestamp`` and ``duration``.
    """
    if not document_id or not isinstance(content, str) or not content.strip():
        raise ValueError("document_id and non-empty content are required")

    rows = csv.DictReader(io.StringIO(content))
    required = {"caller", "receiver"}
    if not rows.fieldnames or not required.issubset(
        {field.strip().lower() for field in rows.fieldnames}
    ):
        raise ValueError("CDR CSV must contain caller and receiver columns")

    entities: List[Dict] = []
    entity_ids = {}
    relationships: List[Dict] = []

    def add_phone(value: str) -> str:
        phone = value.strip()
        if not phone:
            raise ValueError("CDR caller and receiver values cannot be empty")
        if phone not in entity_ids:
            entity_id = f"{document_id}-phone-{len(entity_ids)}"
            entity_ids[phone] = entity_id
            entities.append(
                {
                    "id": entity_id,
                    "type": "phone",
                    "name": phone,
                    "source_document_id": document_id,
                    "confidence": 0.99,
                }
            )
        return entity_ids[phone]

    for index, raw_row in enumerate(rows):
        row = {key.strip().lower(): (value or "").strip() for key, value in raw_row.items()}
        caller_id = add_phone(row["caller"])
        receiver_id = add_phone(row["receiver"])
        if caller_id == receiver_id:
            raise ValueError("caller and receiver must be different phone numbers")
        relationships.append(
            {
                "id": f"{document_id}-call-{index}",
                "source": caller_id,
                "target": receiver_id,
                "relationship_type": "called",
                "source_document_id": document_id,
                "metadata": {
                    "timestamp": row.get("timestamp", ""),
                    "duration": row.get("duration", ""),
                },
            }
        )

    return {
        "status": "cdr_csv",
        "document_id": document_id,
        "entities": entities,
        "relationships": relationships,
    }
