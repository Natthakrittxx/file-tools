# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack file converter app: upload a file, pick a target format, download the result. Frontend is Next.js 16 (React 19, TypeScript), backend is FastAPI (Python 3.12), storage/database is Supabase (PostgreSQL + object storage).

## Commands

### Frontend (`frontend/`)
```bash
npm run dev          # Dev server on :3000
npm run build        # Production build (standalone output)
npm run lint         # ESLint
```

### Backend (`backend/`)
```bash
pip install -r requirements.txt                    # Install deps
uvicorn app.main:app --reload                      # Dev server on :8000
```

### Docker
```bash
docker build -t fm-frontend -f frontend/Dockerfile frontend/
docker build -t fm-backend -f backend/Dockerfile backend/
```

### System Dependencies (macOS local dev)
The backend requires system binaries that Docker installs automatically but must be installed manually for local dev:
```bash
brew install poppler          # pdf2image (pdfinfo, pdftoppm)
brew install cairo            # cairosvg
brew install libmagic         # python-magic
brew install --cask libreoffice   # DOCX/PPTX→PDF conversion
```
After installing LibreOffice via Homebrew, you may need: `ln -s /opt/homebrew/bin/soffice /opt/homebrew/bin/libreoffice`

## Architecture

### Conversion Flow
1. Frontend uploads file via `POST /api/convert` (FormData + target_format query param)
2. Backend validates file size (50MB max), detects MIME type (`python-magic`), sanitizes filename
3. Creates a `conversion_logs` row in Supabase (status: PROCESSING), uploads original to Supabase Storage
4. Dispatches to the correct converter based on `CONVERSION_MATRIX` in `backend/app/services/converter.py`
5. Uploads converted file to Supabase Storage, updates log row (status: COMPLETED)
6. Frontend polls for download URL → `GET /api/download/{id}` returns a 1-hour signed URL

### Conversion Matrix (source → target)
| Converter | Conversions |
|-----------|------------|
| Pillow (`image.py`) | JPG/PNG/GIF ↔ JPG/PNG/GIF |
| cairosvg (`svg.py`) | SVG → PNG/JPG/GIF/PDF |
| pdf2image (`pdf.py`) | PDF → JPG/PNG/GIF |
| pdf2docx (`pdf.py`) | PDF → DOCX |
| python-docx (`document.py`) | DOCX ↔ TXT |
| fpdf2 (`document.py`) | TXT → PDF |
| LibreOffice subprocess (`libreoffice.py`) | DOCX/PPTX → PDF |

### Backend Structure
- `app/main.py` — FastAPI app, CORS, lifespan (creates temp dir)
- `app/config.py` — Pydantic BaseSettings (reads env vars)
- `app/models.py` — FileFormat enum, status enum, extension/MIME mappings
- `app/dependencies.py` — Supabase client (LRU-cached)
- `app/routers/` — `convert.py` (POST /api/convert, GET /api/conversions), `download.py`, `health.py`
- `app/services/converter.py` — Conversion dispatcher + matrix
- `app/services/converters/` — Format-specific converter modules
- `app/services/storage.py` — Supabase Storage upload/download/signed URLs
- `app/utils/` — MIME detection (`mime.py`), filename sanitization (`sanitize.py`)

### Frontend Structure
- `app/page.tsx` — Single-page converter UI
- `hooks/use-file-conversion.ts` — Core state machine: file selection → format detection → conversion → download URL
- `hooks/use-conversion-history.ts` — Fetches recent conversions from backend
- `lib/api.ts` — Fetch wrapper for backend API
- `lib/conversion-matrix.ts` — Client-side format compatibility (mirrors backend matrix)
- `components/` — FileDropzone (react-dropzone), FormatSelector, ConversionCard, ConversionHistory
- `components/ui/` — shadcn/ui primitives (Button, Card, Badge, Select, Progress)

### Environment Variables
Defined in `.env` (see `.env.example`):
- `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — backend Supabase access
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — frontend Supabase access
- `NEXT_PUBLIC_API_URL` — backend API base URL (default: `http://localhost:8000/api`)

### Key Patterns
- Frontend progress is simulated (20→50→80→100%), not streamed from backend
- Supabase client is dependency-injected via FastAPI `Depends()` and LRU-cached
- LibreOffice converter runs as an async subprocess (`asyncio.create_subprocess_exec`)
- The converter dispatcher checks if the result is a coroutine to handle both sync and async converters
- Storage bucket name is `file-conversions`
