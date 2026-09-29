# eRTMAC-NWIS — Nearby Wells Intelligence System

> **"Turning Historical Drilling Experience into Proactive Intelligence."**
>
> SIH 2026 · Problem Statement 121 · Oil India Limited · Smart Automation

---

## ⚠️ Important Disclaimer

All data in this application is **representative demonstration data** and is **NOT real Oil India operational data**. This is a prototype decision-support platform for SIH26 demonstration purposes only.

---

## Overview

eRTMAC-NWIS is an AI-powered offset well knowledge and decision support platform for drilling operations. It enables drilling engineers to learn from historical nearby-well incidents **before** similar problems occur in the active well.

**Core Question it answers:** *"What happened in nearby wells at this depth and formation, and is the current well at risk?"*

---

## Architecture

```
React (Vite + Tailwind)
    │
    │ REST API (JWT)
    ▼
Node.js + Express
    │
    ├──────────────────────┐
    ▼                      ▼
MongoDB               Python FastAPI (AI Service)
(Mongoose)                │
                          ├── PyMuPDF (PDF extraction)
                          ├── Sentence Transformers (embeddings)
                          ├── FAISS (vector search)
                          └── Gemini API (generation)
```

---

## Technology Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Visualization | Recharts, Leaflet + React-Leaflet, OpenStreetMap |
| Backend | Node.js, Express.js, Mongoose (MongoDB) |
| Auth | JWT, bcryptjs, Helmet |
| AI Service | Python, FastAPI, PyMuPDF, Sentence Transformers |
| Vector DB | FAISS (local disk) |
| LLM | Google Gemini API (configurable model) |

---

## Project Structure

```
eRTMAC-NWIS/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Shared UI components
│   │   ├── pages/
│   │   │   ├── engineer/      # Engineer dashboard pages
│   │   │   ├── manager/       # Manager dashboard pages
│   │   │   └── admin/         # Admin dashboard pages
│   │   ├── context/           # Auth context
│   │   ├── services/          # Axios API service
│   │   └── layouts/           # App layout with sidebar
│   └── package.json
├── server/                    # Node.js + Express backend
│   └── src/
│       ├── controllers/       # Route controllers
│       ├── models/            # Mongoose models
│       ├── routes/            # Express routes
│       ├── middleware/        # Auth, role, audit middleware
│       └── config/            # DB config
├── ai-service/                # Python FastAPI AI service
│   ├── main.py                # All endpoints
│   ├── requirements.txt
│   └── data/faiss_index/      # FAISS index (auto-created)
├── scripts/
│   └── seed.js                # Database seed script
└── README.md
```

---

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+ and pip
- **MongoDB** (local or Atlas)
- **Gemini API Key** (optional — app works without it via fallbacks)

---

## Environment Setup

### Backend (`server/.env`)

```env
MONGODB_URI=mongodb://localhost:27017/ertmac_nwis
JWT_SECRET=your_jwt_secret_here_make_it_long_and_random
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
AI_SERVICE_URL=http://localhost:8000
NODE_ENV=development
```

### AI Service (`ai-service/.env`)

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

### Frontend (`client/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Installation & Setup

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and credentials
```

### 2. Frontend

```bash
cd client
npm install
cp .env.example .env
```

### 3. AI Service

```bash
cd ai-service
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Gemini API key
```

### 4. Seed Database

```bash
cd scripts
npm install mongoose bcryptjs dotenv
node seed.js
```

---

## Running the Application

### Terminal 1 — Backend

```bash
cd server
npm run dev
# Starts at http://localhost:5000
```

### Terminal 2 — Frontend

```bash
cd client
npm run dev
# Opens at http://localhost:5173
```

### Terminal 3 — AI Service

```bash
cd ai-service
# Activate venv first
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# Starts at http://localhost:8000
```

---

## Demo Accounts

> ⚠️ These are demonstration credentials only.

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ertmac.demo | Demo@2024 |
| Engineer | engineer@ertmac.demo | Demo@2024 |
| Manager | manager@ertmac.demo | Demo@2024 |

---

## SIH Demo Flow (Core Scenario)

1. **Login** as Engineer → `engineer@ertmac.demo`
2. **Dashboard** → See WELL-101 drilling at 2820m in Formation-X
3. **Well Map** → See WELL-103 nearby (2.1 km)
4. **Risk Radar** → HIGH RISK alert: 30m from historical mud loss at 2850m
5. **Click "Ask AI"** → Query: "Why is this interval considered risky?"
6. **AI Copilot** → RAG-retrieves WELL-103 DDR Page 14 → Gemini explains
7. **Digital Well Twin** → Visualize formation layers and historical event markers
8. **Incident Timeline** → View the mud loss sequence from 2023
9. **Multi-Well Compare** → Overlay WELL-101 and WELL-103 torque/ROP charts
10. **Switch to Manager** → Operations overview, risk heatmap, AI briefing
11. **Switch to Admin** → Upload PDF, AI extracts events, Admin verifies, Approves
12. **Knowledge indexed** → Engineer can now search the new evidence

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET | /api/wells | All wells |
| GET | /api/wells/:id/nearby | Nearby wells |
| GET | /api/risks/active/:wellId | Well risk alerts |
| POST | /api/risks/calculate | Generate risk alerts |
| POST | /api/risks/:id/acknowledge | Acknowledge alert |
| POST | /api/reports/upload | Upload PDF |
| POST | /api/reports/:id/process | AI extraction |
| POST | /api/reports/:id/approve-item | Admin approve |
| POST | /api/ai/chat | AI Copilot chat |
| POST | /api/rag/search | Semantic search |
| GET | /api/analytics/overview | Dashboard metrics |
| GET | /api/admin/system-health | System status |
| GET | /api/admin/audit-logs | Audit trail |

---

## Key Features

### 1. Digital Well Twin
Visual stratigraphic visualization with formation layers, event markers, current depth indicator, and casing representation.

### 2. Predictive Risk Radar
Deterministic risk scoring engine (NOT ML black-box):
- Depth proximity (35 pts)
- Geographic distance (25 pts)
- Formation similarity (25 pts)
- Event severity (15 pts)

Result: LOW / MEDIUM / HIGH / CRITICAL with full explanation.

### 3. AI Offset Well Matching
Multi-factor relevance scoring beyond simple nearest-well selection:
- Geographic distance
- Formation similarity
- Depth similarity
- Historical event count and type

### 4. AI Extraction Verification Studio
Human-in-the-loop workflow:
1. Admin uploads PDF
2. AI extracts events (Gemini + heuristic fallback)
3. Admin reviews each item with source comparison
4. Admin edits if needed
5. Admin approves → enters trusted knowledge base
6. System indexes → available for RAG search

### 5. Evidence-Grounded AI Copilot
RAG pipeline:
- PDF → text extraction → chunking
- Sentence Transformer embeddings
- FAISS semantic search
- Top-k verified chunks → Gemini prompt
- Grounded answer + source citations

---

## Risk Engine

> ⚠️ "Prototype historical-risk scoring model — not scientifically validated for production use."

The risk engine is **deterministic and transparent**:

```javascript
calculateRisk(activeWell, offsetWells, historicalEvents) {
  // Factor 1: Depth proximity (0-35 pts): <20m = 35, <50m = 28, <100m = 20...
  // Factor 2: Geographic distance (0-25 pts): <2km = 25, <5km = 20...
  // Factor 3: Formation similarity (0-25 pts): exact match = 25, partial = 12...
  // Factor 4: Event severity (0-15 pts): CRITICAL = 15, HIGH = 12...
  
  totalScore = sum of factors
  riskLevel = CRITICAL(≥75) | HIGH(≥55) | MEDIUM(≥35) | LOW(<35)
}
```

All risk factors are displayed to the user for full transparency.

---

## RAG Pipeline

```
PDF Upload
  → PyMuPDF text extraction (page-aware)
  → Admin AI extraction review
  → Admin approval
  → Sentence Transformer embeddings (all-MiniLM-L6-v2)
  → FAISS vector index (persisted to disk)
  → Semantic search (cosine similarity)
  → Top-5 verified chunks assembled
  → Gemini prompt with grounded context
  → Answer + source citations
```

Fallback when AI is unavailable:
- Database keyword/regex search
- Deterministic summary generation
- Clearly labeled "AI unavailable"

---

## Security

- JWT authentication with 24h expiry
- bcrypt password hashing (cost factor 12)
- Role-based access control (ENGINEER / MANAGER / ADMIN)
- Backend enforcement of all permissions
- Rate limiting on auth endpoints
- Helmet security headers
- File type validation for uploads (PDF only)
- No credentials in frontend code
- Audit logging of all important actions

---

## Limitations & Production Integration Points

| Limitation | Production Solution |
|------------|---------------------|
| Demo data | Connect to OIL's eRTMAC real-time data stream |
| Manual PDF upload | Integrate with DMS/document workflow systems |
| Local FAISS | Scale to Pinecone / Weaviate / Qdrant |
| Single-server | Kubernetes deployment with horizontal scaling |
| Gemini API | Enterprise LLM or private on-premise model |
| Demo risk model | Validated geological risk model with domain experts |
| Static formation data | Real-time pore pressure prediction integration |

---

## Known Issues

- FAISS index is loaded in-memory per process (restart to reload after indexing)
- The AI service requires internet for Gemini API calls
- Leaflet map uses OSM tiles (requires internet for tile loading)

---

*eRTMAC-NWIS — From Historical Drilling Knowledge to Proactive Drilling Intelligence.*
