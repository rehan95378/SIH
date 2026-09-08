"""Convert text, PDF, and image input into text for the extraction pipeline."""

import base64
import io
from typing import Optional


def _decode_base64(value: str) -> bytes:
    try:
        return base64.b64decode(value, validate=True)
    except (ValueError, TypeError) as error:
        raise ValueError("content_base64 must be valid base64") from error


def extract_text(
    content: Optional[str] = None,
    content_base64: Optional[str] = None,
    mime_type: str = "text/plain",
) -> str:
    """Extract UTF-8 text, PDF text, or OCR text from one request."""
    clean_mime = (mime_type or "text/plain").split(";")[0].strip().lower()
    if content_base64:
        raw = _decode_base64(content_base64)
    elif isinstance(content, str):
        if clean_mime not in {"text/plain", "text/csv", "application/csv"}:
            raise ValueError("binary PDF/image input must use content_base64")
        return content.strip()
    else:
        raise ValueError("content or content_base64 is required")

    if clean_mime in {"text/plain", "text/csv", "application/csv"}:
        return raw.decode("utf-8", errors="replace").strip()

    if clean_mime == "application/pdf":
        try:
            from pypdf import PdfReader
        except ImportError as error:
            raise RuntimeError("PDF support requires the pypdf package") from error
        pages = PdfReader(io.BytesIO(raw)).pages
        text = "\n".join(page.extract_text() or "" for page in pages).strip()
        if not text:
            raise ValueError("PDF contains no selectable text; use an OCR image PDF")
        return text

    if clean_mime.startswith("image/"):
        try:
            from PIL import Image
            import pytesseract
        except ImportError as error:
            raise RuntimeError(
                "Image OCR requires the pillow and pytesseract packages"
            ) from error
        text = pytesseract.image_to_string(Image.open(io.BytesIO(raw))).strip()
        if not text:
            raise ValueError("OCR found no readable text in the image")
        return text

    raise ValueError(f"unsupported mime_type: {mime_type}")
