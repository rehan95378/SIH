"""HTTP API for the local crime-report extraction service."""

import json
import os
import csv
import io
from typing import Dict
from fastapi import FastAPI, HTTPException

from extract import extract_document
from graph import analyze_graph
from pattern_detection import detect_patterns
from document_parser import extract_text
from parsers.cdr_parser import parse_cdr
from parsers.financial_parser import parse_financial_transactions
from parsers.social_parser import parse_social_connections
from parsers.generic_csv_parser import parse_generic_csv


PARSER_TYPES = {
    "cdr": parse_cdr,
    "financial": parse_financial_transactions,
    "social": parse_social_connections,
    "csv": parse_generic_csv,
}


def _looks_like_csv(content: str) -> bool:
    """Detect delimited tabular text when callers omit a CSV MIME type."""
    sample = content[:8192]
    if "\n" not in sample:
        return False
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
        rows = list(csv.reader(io.StringIO(sample), dialect))
    except csv.Error:
        return False
    return len(rows) >= 2 and len(rows[0]) >= 2 and len(rows[1]) >= 2


def process_document(payload: Dict) -> Dict:
    """Extract and analyse one document from a JSON request."""
    document_id = payload.get("document_id", "doc-request")
    if not isinstance(document_id, str) or not document_id.strip():
        raise ValueError("document_id must be a non-empty string")
    content = extract_text(
        content=payload.get("content", payload.get("text")),
        content_base64=payload.get("content_base64"),
        mime_type=payload.get("mime_type", "text/plain"),
    )

    data_type = payload.get("data_type", "report")
    mime_type = (payload.get("mime_type") or "").split(";")[0].lower()
    if data_type == "report" and (
        mime_type in {
        "text/csv", "application/csv",
        } or _looks_like_csv(content)
    ):
        data_type = "csv"
    if data_type in PARSER_TYPES:
        result = PARSER_TYPES[data_type](content, document_id)
    elif data_type == "report":
        result = extract_document(document_id, content)
    else:
        raise ValueError("data_type must be report, csv, cdr, financial, or social")

    result["links"] = result.get("links", result.get("relationships", []))
    result.pop("relationships", None)
    result["data_type"] = data_type
    result["extracted_text"] = content
    result["analytics"] = analyze_graph(result["entities"], result["links"])
    result["analytics"]["suspicious_patterns"] = detect_patterns(
        result["entities"], result["links"], result["analytics"]["betweenness"]
    )
    return result


app = FastAPI(title="Crime Network AI Service")


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "service": "crime-ai"}


@app.post("/extract")
def extract(payload: Dict) -> Dict:
    try:
        result = process_document(payload)
        return {"entities": result["entities"], "links": result["links"]}
    except (ValueError, RuntimeError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@app.post("/analyze")
def analyze(payload: Dict) -> Dict:
    try:
        entities = payload.get("entities", [])
        links = payload.get("links", [])
        result = analyze_graph(entities, links)
        result["suspicious_patterns"] = detect_patterns(
            entities, links, result["betweenness"]
        )
        return result
    except (ValueError, RuntimeError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=os.getenv("AI_HOST", "127.0.0.1"),
        port=int(os.getenv("AI_PORT", "8000")),
    )