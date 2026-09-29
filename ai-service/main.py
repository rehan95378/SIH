"""
eRTMAC-NWIS AI Service v2
PDF Extraction · FAISS RAG · Gemini (google-genai SDK)
"""
import os, json, re, logging, asyncio
from typing import List, Optional, Dict, Any
from pathlib import Path

import fitz          # PyMuPDF
import numpy as np
import faiss
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
GEMINI_API_KEY   = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL     = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
FAISS_INDEX_PATH = Path("data/faiss_index/index.faiss")
FAISS_META_PATH  = Path("data/faiss_index/metadata.json")
EMBEDDING_MODEL  = "all-MiniLM-L6-v2"
EMBEDDING_DIM    = 384

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="eRTMAC-NWIS AI Service", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Global state ──────────────────────────────────────────────────────────────
_embed_model = None
_faiss_index: Optional[faiss.IndexFlatIP] = None
_chunk_meta:  List[Dict] = []
_gemini_client = None
_gemini_ready  = False


# ── Embedding model (lazy) ────────────────────────────────────────────────────
def get_embed_model():
    global _embed_model
    if _embed_model is None:
        logger.info("Loading SentenceTransformer …")
        from sentence_transformers import SentenceTransformer
        _embed_model = SentenceTransformer(EMBEDDING_MODEL)
        logger.info("SentenceTransformer ready.")
    return _embed_model


# ── FAISS ─────────────────────────────────────────────────────────────────────
def load_faiss():
    global _faiss_index, _chunk_meta
    FAISS_INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    if FAISS_INDEX_PATH.exists() and FAISS_META_PATH.exists():
        _faiss_index = faiss.read_index(str(FAISS_INDEX_PATH))
        with open(FAISS_META_PATH, "r", encoding="utf-8") as f:
            _chunk_meta = json.load(f)
        logger.info(f"FAISS loaded: {_faiss_index.ntotal} vectors, {len(_chunk_meta)} chunks")
    else:
        _faiss_index = faiss.IndexFlatIP(EMBEDDING_DIM)
        _chunk_meta  = []
        logger.info("New FAISS index created (empty).")


def save_faiss():
    FAISS_INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    faiss.write_index(_faiss_index, str(FAISS_INDEX_PATH))
    with open(FAISS_META_PATH, "w", encoding="utf-8") as f:
        json.dump(_chunk_meta, f, ensure_ascii=False, indent=2)


# ── Gemini (new google-genai SDK) ─────────────────────────────────────────────
def get_gemini_client():
    global _gemini_client, _gemini_ready
    if _gemini_client is not None:
        return _gemini_client
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set.")
        return None
    try:
        from google import genai
        _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        # Quick validation
        _gemini_ready = True
        logger.info(f"Gemini client ready. Model: {GEMINI_MODEL}")
        return _gemini_client
    except Exception as e:
        logger.error(f"Gemini init failed: {e}")
        return None


def gemini_generate(prompt: str, temperature: float = 0.2) -> Optional[str]:
    """Generate text with Gemini. Returns None on failure."""
    client = get_gemini_client()
    if not client:
        return None
    try:
        from google.genai import types
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=2048,
                system_instruction=(
                    "You are an industrial drilling knowledge assistant for an oil and gas company. "
                    "Use ONLY the supplied verified context for project-specific claims. "
                    "NEVER invent well data, incidents, source pages, or mitigation procedures. "
                    "NEVER claim an event will definitely occur. "
                    "If evidence is insufficient, say: 'I could not find sufficient verified evidence in the knowledge base.' "
                    "Distinguish between: (1) Verified historical fact (2) Calculated risk indicator (3) AI-generated explanation. "
                    "Always cite sources. This is a decision-support tool — do not give autonomous drilling instructions."
                ),
            ),
        )
        return response.text
    except Exception as e:
        logger.error(f"Gemini generate_content failed: {e}")
        return None


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    load_faiss()
    # Initialise Gemini eagerly (fast, no model download)
    get_gemini_client()
    # Load embedding model in background thread so startup is non-blocking
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, get_embed_model)
    logger.info("eRTMAC-NWIS AI Service started.")


# ═══════════════════════════════════════════════════════════════════════════════
# Pydantic models
# ═══════════════════════════════════════════════════════════════════════════════
class EmbedRequest(BaseModel):
    document_id: str
    well_id:     Optional[str] = None
    well_name:   Optional[str] = None
    text:        str
    page_number: Optional[int] = None
    metadata:    Optional[Dict[str, Any]] = {}

class Chunk(BaseModel):
    chunk_id:    str
    document_id: str
    well_id:     Optional[str] = None
    well_name:   Optional[str] = None
    text:        str
    page_number: Optional[int] = None
    metadata:    Optional[Dict[str, Any]] = {}
    is_verified: bool = False

class BatchEmbedRequest(BaseModel):
    chunks: List[Chunk]

class RAGSearchRequest(BaseModel):
    query:        str
    well_id:      Optional[str] = None
    top_k:        int = 5
    verified_only: bool = False

class RAGChatRequest(BaseModel):
    query:      str
    well_id:    Optional[str] = None
    context:    Optional[str] = ""
    session_id: Optional[str] = None

class ExtractReportRequest(BaseModel):
    document_id: Optional[str] = None
    text:        Optional[str] = None
    well_name:   Optional[str] = None


# ═══════════════════════════════════════════════════════════════════════════════
# Heuristic helpers
# ═══════════════════════════════════════════════════════════════════════════════
def chunk_text(text: str, size: int = 500, overlap: int = 60) -> List[str]:
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks, cur = [], ""
    for s in sentences:
        if len(cur) + len(s) <= size:
            cur += " " + s
        else:
            if cur.strip():
                chunks.append(cur.strip())
            cur = s
    if cur.strip():
        chunks.append(cur.strip())
    return [c for c in chunks if len(c) > 30]

def h_event_type(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ["mud loss", "lost circulation", "loss of circulation"]): return "MUD_LOSS"
    if any(w in t for w in ["kick", "gas influx", "well control", "shut-in"]):       return "KICK"
    if any(w in t for w in ["stuck pipe", "pipe stuck", "differential sticking"]):   return "STUCK_PIPE"
    if any(w in t for w in ["high torque", "torque spike", "torque increase"]):      return "HIGH_TORQUE"
    if any(w in t for w in ["overpressure", "over pressure", "high pressure"]):      return "OVERPRESSURE"
    if any(w in t for w in ["fishing", "fish", "bha left"]):                         return "FISHING"
    if any(w in t for w in ["cement", "cementing"]):                                 return "CEMENTING_PROBLEM"
    if any(w in t for w in ["washout", "washed out"]):                               return "WASHOUT"
    return "OTHER"

def h_depth(text: str) -> Optional[float]:
    for p in [r'(?:at|depth|@)\s*(\d{3,5}(?:\.\d+)?)\s*m',
              r'(\d{3,5}(?:\.\d+)?)\s*(?:m|mtr|meters?)',
              r'depth[:\s]+(\d{3,5}(?:\.\d+)?)']:
        m = re.search(p, text, re.IGNORECASE)
        if m: return float(m.group(1))
    return None

def h_formation(text: str) -> Optional[str]:
    for p in [r'(Formation[-\s]?[A-Z0-9]+)',
              r'(?:in|through|into)\s+([A-Za-z][A-Za-z\s\-]+?)\s+formation',
              r'formation[:\s]+([A-Za-z][A-Za-z\s\-]+?)(?:[,\.\n]|$)']:
        m = re.search(p, text, re.IGNORECASE)
        if m: return m.group(1).strip()
    return None

def h_severity(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ["critical", "severe", "major", "catastrophic"]): return "CRITICAL"
    if any(w in t for w in ["high", "significant", "serious"]):               return "HIGH"
    if any(w in t for w in ["moderate", "partial", "medium"]):                return "MEDIUM"
    return "MEDIUM"

def h_mitigation(text: str) -> str:
    for p in [r'(?:mitigation|action|remedy|corrective)[:\s]+([^.!?\n]+)',
              r'(?:pumped|spotted|squeezed|performed)[:\s]+([^.!?\n]+)']:
        m = re.search(p, text, re.IGNORECASE)
        if m: return m.group(1).strip()[:300]
    return "Refer to source document for mitigation details."


# ═══════════════════════════════════════════════════════════════════════════════
# Endpoints
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "eRTMAC-NWIS AI Service v2",
        "gemini_configured": bool(GEMINI_API_KEY),
        "gemini_model":      GEMINI_MODEL,
        "gemini_sdk":        "google-genai",
        "faiss_indexed":     _faiss_index is not None and _faiss_index.ntotal > 0,
        "faiss_vectors":     _faiss_index.ntotal if _faiss_index else 0,
        "embedding_model":   EMBEDDING_MODEL,
    }


# ── PDF extract (raw) ─────────────────────────────────────────────────────────
@app.post("/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files supported.")
    content = await file.read()
    try:
        doc = fitz.open(stream=content, filetype="pdf")
        pages, full_text = [], ""
        for i, page in enumerate(doc):
            pt = page.get_text("text")
            pages.append({"page_number": i + 1, "text": pt, "char_count": len(pt)})
            full_text += f"\n--- PAGE {i+1} ---\n{pt}"
        doc.close()
        return {"page_count": len(pages), "pages": pages, "full_text": full_text, "file_name": file.filename}
    except Exception as e:
        raise HTTPException(422, f"PDF extraction failed: {e}")


# ── Report extraction (Gemini + heuristic fallback) ───────────────────────────
@app.post("/extract-report")
async def extract_report(
    file: Optional[UploadFile] = File(None),
    well_name:   str = Form(""),
    report_type: str = Form("OTHER"),
    document_id: str = Form(""),
):
    if file is None:
        return {"extracted_events": [], "raw_text": "", "page_count": 0}

    content = await file.read()
    try:
        doc = fitz.open(stream=content, filetype="pdf")
    except Exception as e:
        raise HTTPException(422, f"Cannot open PDF: {e}")

    pages_text, full_text = [], ""
    for i, page in enumerate(doc):
        pt = page.get_text("text")
        pages_text.append({"page": i + 1, "text": pt})
        full_text += f"\n--- PAGE {i+1} ---\n{pt}"
    doc.close()

    extracted_events = []

    # ── Gemini extraction ────────────────────────────────────────────────────
    prompt = f"""You are an expert drilling engineer assistant analyzing an oil well drilling report.

Extract ALL drilling events, incidents, and anomalies from the report text below.
Return a JSON array. Each element must have these exact keys:
- event_type: MUD_LOSS | KICK | STUCK_PIPE | HIGH_TORQUE | OVERPRESSURE | FISHING | CEMENTING_PROBLEM | LOST_CIRCULATION | GAS_INFLUX | WASHOUT | BIT_BALLING | DIFFERENTIAL_STICKING | HOLE_STABILITY | NPT | TORQUE_SPIKE | OTHER
- depth: numeric depth in meters (null if not mentioned)
- formation: formation name string (null if not mentioned)
- severity: LOW | MEDIUM | HIGH | CRITICAL
- description: what happened, max 300 chars
- mitigation: actions taken, max 300 chars
- page_number: integer page number
- confidence: float 0.0-1.0

Rules:
- Return ONLY a valid JSON array with no markdown fences, no commentary.
- Demonstration data for well: {well_name}

Report text (first 8000 chars):
{full_text[:8000]}"""

    gemini_answer = gemini_generate(prompt, temperature=0.1)
    if gemini_answer:
        try:
            clean = re.sub(r"```(?:json)?", "", gemini_answer).strip().strip("`").strip()
            events = json.loads(clean)
            if isinstance(events, list) and events:
                extracted_events = events[:25]
                logger.info(f"Gemini extracted {len(extracted_events)} events from {well_name}")
        except Exception as e:
            logger.warning(f"Gemini JSON parse failed: {e}. Falling back to heuristics.")

    # ── Heuristic fallback ────────────────────────────────────────────────────
    if not extracted_events:
        for pi in pages_text:
            for para in [p.strip() for p in pi["text"].split("\n\n") if len(p.strip()) > 50][:8]:
                et = h_event_type(para)
                if et != "OTHER" or any(k in para.lower() for k in ["incident","problem","lost","stuck","kick","loss"]):
                    extracted_events.append({
                        "event_type":  et,
                        "depth":       h_depth(para),
                        "formation":   h_formation(para) or "Unknown",
                        "severity":    h_severity(para),
                        "description": para[:300],
                        "mitigation":  h_mitigation(para),
                        "page_number": pi["page"],
                        "confidence":  0.55,
                    })

    return {
        "extracted_events": extracted_events,
        "raw_text":        full_text[:60000],
        "page_count":      len(pages_text),
        "extraction_method": "gemini" if (gemini_answer and extracted_events) else "heuristic",
    }


# ── JSON-body extraction (for text already on server) ─────────────────────────
@app.post("/extract-text")
async def extract_text_events(req: ExtractReportRequest):
    if not req.text:
        return {"extracted_events": [], "extraction_method": "none"}

    prompt = f"""You are an expert drilling engineer. Extract ALL drilling events from the text below.
Return a JSON array (no markdown). Each element:
- event_type (MUD_LOSS/KICK/STUCK_PIPE/HIGH_TORQUE/OVERPRESSURE/FISHING/CEMENTING_PROBLEM/LOST_CIRCULATION/OTHER)
- depth (number or null), formation (string or null), severity (LOW/MEDIUM/HIGH/CRITICAL)
- description (max 300 chars), mitigation (max 300 chars), page_number (int), confidence (0-1)

Well: {req.well_name or 'Unknown'}. Text:
{req.text[:8000]}"""

    answer = gemini_generate(prompt, temperature=0.1)
    events = []
    if answer:
        try:
            clean = re.sub(r"```(?:json)?", "", answer).strip().strip("`").strip()
            events = json.loads(clean)
            if not isinstance(events, list): events = []
        except: pass

    if not events:
        # heuristic
        for para in [p.strip() for p in req.text.split("\n\n") if len(p.strip()) > 50][:15]:
            et = h_event_type(para)
            if et != "OTHER" or any(k in para.lower() for k in ["incident","lost","stuck","kick","loss","problem"]):
                events.append({"event_type":et,"depth":h_depth(para),"formation":h_formation(para),
                                "severity":h_severity(para),"description":para[:300],"mitigation":h_mitigation(para),
                                "page_number":1,"confidence":0.5})

    return {"extracted_events": events[:25], "extraction_method": "gemini" if answer else "heuristic"}


# ── Embed single chunk ────────────────────────────────────────────────────────
@app.post("/embed")
async def embed_single(req: EmbedRequest):
    global _faiss_index, _chunk_meta
    emb = get_embed_model().encode([req.text], normalize_embeddings=True).astype(np.float32)
    idx = _faiss_index.ntotal
    _faiss_index.add(emb)
    meta = {
        "index": idx, "chunk_id": f"{req.document_id}-{idx}",
        "document_id": req.document_id, "well_id": req.well_id,
        "well_name": req.well_name, "text": req.text,
        "page_number": req.page_number, "metadata": req.metadata or {},
        "is_verified": True,
    }
    _chunk_meta.append(meta)
    save_faiss()
    return {"success": True, "embedding_id": idx, "chunk_id": meta["chunk_id"]}


# ── Embed batch ───────────────────────────────────────────────────────────────
@app.post("/embed/batch")
async def embed_batch(req: BatchEmbedRequest):
    global _faiss_index, _chunk_meta
    if not req.chunks:
        return {"success": True, "count": 0, "embedding_ids": {}}

    texts = [c.text for c in req.chunks]
    embs  = get_embed_model().encode(texts, normalize_embeddings=True, batch_size=32).astype(np.float32)
    start = _faiss_index.ntotal
    _faiss_index.add(embs)

    ids = {}
    for i, chunk in enumerate(req.chunks):
        idx = start + i
        meta = {
            "index": idx, "chunk_id": chunk.chunk_id,
            "document_id": chunk.document_id, "well_id": chunk.well_id,
            "well_name": chunk.well_name, "text": chunk.text,
            "page_number": chunk.page_number, "metadata": chunk.metadata or {},
            "is_verified": chunk.is_verified,
        }
        _chunk_meta.append(meta)
        ids[chunk.chunk_id] = idx

    save_faiss()
    return {"success": True, "count": len(req.chunks), "embedding_ids": ids}


# ── Seed demo knowledge (called from Node backend after seed) ─────────────────
@app.post("/seed-demo-knowledge")
async def seed_demo_knowledge(data: dict):
    """
    Accept a list of drilling events from the backend and index them into FAISS.
    This powers RAG even before any PDF is uploaded.
    """
    global _faiss_index, _chunk_meta

    events = data.get("events", [])
    if not events:
        return {"success": False, "message": "No events provided."}

    emb_model = get_embed_model()
    texts, metas = [], []

    for ev in events:
        text = (
            f"{ev.get('eventType','').replace('_',' ')} at {ev.get('depth','?')}m "
            f"in {ev.get('formation','unknown formation')}. "
            f"Severity: {ev.get('severity','UNKNOWN')}. "
            f"Description: {ev.get('description','')}. "
            f"Cause: {ev.get('cause','')}. "
            f"Mitigation: {ev.get('mitigation','')}. "
            f"Outcome: {ev.get('outcome','')}. "
            f"Well: {ev.get('wellName','Unknown')}, Page {ev.get('sourcePage','N/A')}."
        )
        texts.append(text)
        metas.append({
            "chunk_id":    f"seed-{ev.get('_id', ev.get('wellName','?'))}-{ev.get('depth',0)}",
            "document_id": str(ev.get("sourceDocumentId", "demo")),
            "well_id":     str(ev.get("wellId", "")),
            "well_name":   ev.get("wellName", "Unknown"),
            "text":        text,
            "page_number": ev.get("sourcePage"),
            "metadata": {
                "formation":  ev.get("formation"),
                "depth":      ev.get("depth"),
                "event_type": ev.get("eventType"),
                "severity":   ev.get("severity"),
            },
            "is_verified": ev.get("verificationStatus") == "APPROVED",
        })

    if not texts:
        return {"success": False, "message": "No valid texts to embed."}

    embs  = emb_model.encode(texts, normalize_embeddings=True, batch_size=32).astype(np.float32)
    start = _faiss_index.ntotal
    _faiss_index.add(embs)

    for i, meta in enumerate(metas):
        meta["index"] = start + i
        _chunk_meta.append(meta)

    save_faiss()
    logger.info(f"Seeded {len(texts)} demo knowledge chunks into FAISS. Total: {_faiss_index.ntotal}")
    return {"success": True, "seeded": len(texts), "total_vectors": _faiss_index.ntotal}


# ── RAG Search ────────────────────────────────────────────────────────────────
@app.post("/rag/search")
async def rag_search(req: RAGSearchRequest):
    if _faiss_index is None or _faiss_index.ntotal == 0:
        return {"results": [], "message": "Knowledge base is empty. Seed or index documents first."}

    emb   = get_embed_model().encode([req.query], normalize_embeddings=True).astype(np.float32)
    k     = min(req.top_k * 3, _faiss_index.ntotal)
    scores, indices = _faiss_index.search(emb, k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0 or idx >= len(_chunk_meta): continue
        meta = _chunk_meta[idx]
        if req.verified_only and not meta.get("is_verified", False): continue
        if req.well_id and meta.get("well_id") and meta["well_id"] != req.well_id: continue
        results.append({
            "text":        meta["text"],
            "chunk_id":    meta["chunk_id"],
            "document_id": meta["document_id"],
            "well_id":     meta.get("well_id"),
            "well_name":   meta.get("well_name"),
            "page_number": meta.get("page_number"),
            "metadata":    meta.get("metadata", {}),
            "relevance":   float(score),
            "is_verified": meta.get("is_verified", False),
        })
        if len(results) >= req.top_k: break

    return {"results": results, "query": req.query, "total": len(results)}


# ── RAG Chat (the main AI Copilot endpoint) ───────────────────────────────────
@app.post("/rag/chat")
async def rag_chat(req: RAGChatRequest):
    """Full RAG pipeline: retrieve → augment → Gemini → answer + sources."""

    # Step 1 — semantic retrieval
    retrieved: List[Dict] = []
    if _faiss_index and _faiss_index.ntotal > 0:
        emb = get_embed_model().encode([req.query], normalize_embeddings=True).astype(np.float32)
        k   = min(8, _faiss_index.ntotal)
        scores, indices = _faiss_index.search(emb, k)
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(_chunk_meta): continue
            if float(score) < 0.15: continue          # relevance threshold
            meta = _chunk_meta[idx]
            retrieved.append({
                "text":        meta["text"],
                "document_id": meta["document_id"],
                "well_name":   meta.get("well_name", "Unknown"),
                "page_number": meta.get("page_number"),
                "metadata":    meta.get("metadata", {}),
                "relevance":   float(score),
                "is_verified": meta.get("is_verified", False),
            })

    # Step 2 — build augmented prompt
    ctx_parts = []
    if req.context:
        ctx_parts.append(f"OPERATIONAL CONTEXT:\n{req.context}")

    if retrieved:
        ctx_parts.append("\nRETRIEVED VERIFIED KNOWLEDGE BASE EVIDENCE:")
        for i, ch in enumerate(retrieved[:5]):
            src = f"[Well: {ch['well_name']} | Page: {ch['page_number'] or 'N/A'} | Relevance: {ch['relevance']:.2f} | Verified: {ch['is_verified']}]"
            ctx_parts.append(f"\n{i+1}. {src}\n{ch['text'][:500]}")
    else:
        ctx_parts.append("\nNO MATCHING EVIDENCE found in the knowledge base for this query.")

    augmented_prompt = (
        "\n".join(ctx_parts) +
        f"\n\nUSER QUERY: {req.query}\n\n"
        "Provide a helpful, evidence-grounded response. "
        "For every factual claim about a specific well or event, cite its source. "
        "End your response with a 'Sources:' section listing each cited document, well, and page."
    )

    # Step 3 — Gemini generation
    answer = gemini_generate(augmented_prompt, temperature=0.2)

    if answer:
        sources = []
        for ch in retrieved[:4]:
            sources.append({
                "document_id": ch["document_id"],
                "well_name":   ch["well_name"],
                "page":        ch["page_number"],
                "text":        ch["text"][:250],
                "relevance":   round(ch["relevance"], 3),
                "formation":   ch["metadata"].get("formation"),
                "depth":       ch["metadata"].get("depth"),
                "event_type":  ch["metadata"].get("event_type"),
                "is_verified": ch["is_verified"],
            })
        return {
            "answer":           answer,
            "sources":          sources,
            "retrieved_chunks": len(retrieved),
            "model":            GEMINI_MODEL,
            "used_rag":         len(retrieved) > 0,
            "is_ai_generated":  True,
        }

    # Step 4 — deterministic fallback (Gemini unavailable)
    if retrieved:
        lines = ["Based on verified knowledge base records:\n"]
        for ch in retrieved[:3]:
            lines.append(
                f"• **{ch['well_name']}** (Page {ch['page_number'] or 'N/A'}, "
                f"relevance {ch['relevance']:.0%}):\n  {ch['text'][:300]}\n"
            )
        lines.append("\n⚠ AI service operating in deterministic fallback mode. "
                     "Gemini is unavailable — this response is from the verified database only.")
        answer = "\n".join(lines)
        sources = [{
            "well_name": ch["well_name"], "page": ch["page_number"],
            "text": ch["text"][:200], "relevance": ch["relevance"],
            "is_verified": ch["is_verified"],
        } for ch in retrieved[:3]]
    else:
        answer = (
            "I could not find sufficient verified evidence in the knowledge base to answer this query.\n\n"
            "Suggestions:\n"
            "• Ask an Admin to upload and process drilling reports.\n"
            "• Use more specific search terms (e.g., 'mud loss Formation-X 2850m').\n"
            "• Ensure the Admin has approved extracted events so they enter the knowledge base."
        )
        sources = []

    return {
        "answer":           answer,
        "sources":          sources,
        "retrieved_chunks": len(retrieved),
        "model":            "deterministic-fallback",
        "used_rag":         len(retrieved) > 0,
        "is_ai_generated":  False,
    }


# ── Risk context helper ───────────────────────────────────────────────────────
@app.post("/risk-context")
async def risk_context(data: dict):
    well_name  = data.get("well_name", "")
    formation  = data.get("formation", "")
    event_type = data.get("event_type", "")
    depth      = data.get("depth")
    query = f"{event_type.replace('_', ' ')} in {formation} at {depth}m near {well_name}"
    result = await rag_search(RAGSearchRequest(query=query, top_k=4, verified_only=True))
    return {"context": result["results"], "query": query}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False, workers=1)
