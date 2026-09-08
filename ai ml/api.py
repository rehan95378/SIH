"""HTTP API for the local crime-report extraction service."""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Dict

from extract import extract_document
from graph import analyze_graph
from pattern_detection import detect_patterns
from document_parser import extract_text
from parsers.cdr_parser import parse_cdr
from parsers.financial_parser import parse_financial_transactions
from parsers.social_parser import parse_social_connections


PARSER_TYPES = {
    "cdr": parse_cdr,
    "financial": parse_financial_transactions,
    "social": parse_social_connections,
}


def process_document(payload: Dict) -> Dict:
    """Extract and analyse one document from a JSON request."""
    document_id = payload.get("document_id")
    if not isinstance(document_id, str) or not document_id.strip():
        raise ValueError("document_id must be a non-empty string")
    content = extract_text(
        content=payload.get("content"),
        content_base64=payload.get("content_base64"),
        mime_type=payload.get("mime_type", "text/plain"),
    )

    data_type = payload.get("data_type", "report")
    if data_type in PARSER_TYPES:
        result = PARSER_TYPES[data_type](content, document_id)
    elif data_type == "report":
        result = extract_document(document_id, content)
    else:
        raise ValueError("data_type must be report, cdr, financial, or social")

    result["data_type"] = data_type
    result["extracted_text"] = content
    result["analytics"] = analyze_graph(
        result["entities"], result["relationships"]
    )
    result["analytics"]["suspicious_patterns"] = detect_patterns(
        result["entities"], result["relationships"]
    )
    return result


class ExtractionHandler(BaseHTTPRequestHandler):
    """Handle health checks and extraction requests."""

    def _send_json(self, status: int, body: Dict) -> None:
        encoded = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self) -> None:  # noqa: N802 - required by BaseHTTPRequestHandler
        if self.path == "/health":
            self._send_json(200, {"status": "ok", "service": "crime-ai"})
            return
        self._send_json(404, {"message": "Route not found"})

    def do_POST(self) -> None:  # noqa: N802 - required by BaseHTTPRequestHandler
        if self.path != "/extract":
            self._send_json(404, {"message": "Route not found"})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length))
            if not isinstance(payload, dict):
                raise ValueError("request body must be a JSON object")
            self._send_json(200, process_document(payload))
        except json.JSONDecodeError as error:
            self._send_json(400, {"message": str(error)})
        except ValueError as error:
            self._send_json(400, {"message": str(error)})
        except (RuntimeError, OSError) as error:
            self._send_json(503, {"message": str(error)})
        except Exception as error:
            print(f"[AI API] unexpected extraction error: {error}", file=sys.stderr)
            self._send_json(500, {"message": "Internal server error"})

    def log_message(self, format: str, *args) -> None:
        """Keep service logs short and readable."""
        print(f"[AI API] {format % args}")


def create_server() -> ThreadingHTTPServer:
    """Create the server using configurable host and port values."""
    host = os.getenv("AI_HOST", "127.0.0.1")
    port = int(os.getenv("AI_PORT", "8000"))
    return ThreadingHTTPServer((host, port), ExtractionHandler)


if __name__ == "__main__":
    server = create_server()
    print(f"Crime AI service listening on http://{server.server_address[0]}:{server.server_address[1]}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Crime AI service")
    finally:
        server.server_close()