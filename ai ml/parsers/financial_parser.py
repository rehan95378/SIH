"""Parser for simple financial-transaction CSV files."""

import csv
import io
from typing import Dict, List


def parse_financial_transactions(content: str, document_id: str) -> Dict:
    """Convert transaction rows into account entities and transfer edges.

    Required columns are ``from_account``, ``to_account``, and ``amount``.
    Optional columns such as ``timestamp`` and ``description`` are preserved
    as relationship metadata.
    """
    if not document_id or not isinstance(content, str) or not content.strip():
        raise ValueError("document_id and non-empty content are required")

    clean_content = content.lstrip("\ufeff")
    rows = csv.DictReader(io.StringIO(clean_content))
    required = {"from_account", "to_account", "amount"}
    available = {field.strip().lstrip("\ufeff").lower() for field in (rows.fieldnames or [])}
    if not required.issubset(available):
        raise ValueError(
            "financial CSV must contain from_account, to_account, and amount columns"
        )

    entities: List[Dict] = []
    entity_ids = {}
    relationships: List[Dict] = []

    def add_account(value: str) -> str:
        account = value.strip()
        if not account:
            raise ValueError("account values cannot be empty")
        if account not in entity_ids:
            entity_id = f"{document_id}-account-{len(entity_ids)}"
            entity_ids[account] = entity_id
            entities.append(
                {
                    "id": entity_id,
                    "type": "account",
                    "name": account,
                    "source_document_id": document_id,
                    "confidence": 0.99,
                }
            )
        return entity_ids[account]

    for index, raw_row in enumerate(rows):
        row = {
            key.strip().lstrip("\ufeff").lower(): (value or "").strip()
            for key, value in raw_row.items()
        }
        amount = row["amount"]
        try:
            numeric_amount = float(amount)
        except ValueError as error:
            raise ValueError(f"invalid transaction amount: {amount}") from error
        if numeric_amount < 0:
            raise ValueError("transaction amount cannot be negative")

        source_id = add_account(row["from_account"])
        target_id = add_account(row["to_account"])
        if source_id == target_id:
            continue

        relationships.append(
            {
                "id": f"{document_id}-transfer-{index}",
                "source": source_id,
                "target": target_id,
                "relationship_type": "transferred",
                "source_document_id": document_id,
                "metadata": {
                    "amount": numeric_amount,
                    "currency": row.get("currency", ""),
                    "timestamp": row.get("timestamp", ""),
                    "description": row.get("description", ""),
                },
            }
        )

    return {
        "status": "financial_csv",
        "document_id": document_id,
        "entities": entities,
        "relationships": relationships,
    }
