"""
Ingest textbook PDFs into the knowledge base (KnowledgeChunk) for RAG.

Usage (PowerShell/Windows):
  cd backend/python-api
  pip install -r requirements.txt
  python scripts/ingest_textbook.py --dir "C:\\Users\\jaewo\\Desktop\\dev-team-main\\해부생리학(제3판)(한국해부생리학교수협의회, 2023)강의용" \
         --department physical_therapy --course "해부생리학(제3판)"

Notes:
- Requires OPENAI_API_KEY in .env to generate embeddings (optional).
- Without embeddings, FAISS is skipped but LIKE-based retrieval still works.
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import List, Dict, Any, Optional


def _add_repo_to_syspath():
    here = Path(__file__).resolve()
    api_root = here.parents[1]  # backend/python-api
    if str(api_root) not in sys.path:
        sys.path.insert(0, str(api_root))


_add_repo_to_syspath()

from app.db.database import Base, engine, SessionLocal  # noqa: E402
from app.models.knowledge import KnowledgeChunk  # noqa: E402
from app.ai import rag as rag_ai  # noqa: E402
from app.utils.embedding_utils import create_embedding  # noqa: E402


def _ocr_pages_with_tesseract(pdf_path: Path, dpi: int = 220, lang: str = "kor+eng") -> Optional[List[str]]:
    try:
        from pdf2image import convert_from_path  # type: ignore
        import pytesseract  # type: ignore
    except Exception:
        return None
    try:
        images = convert_from_path(str(pdf_path), dpi=dpi)
        texts: List[str] = []
        for img in images:
            try:
                # Allow explicit Tesseract path via env
                tess_cmd = os.environ.get("TESSERACT_CMD")
                if tess_cmd:
                    import pytesseract as _pt  # type: ignore
                    _pt.pytesseract.tesseract_cmd = tess_cmd  # type: ignore
                txt = pytesseract.image_to_string(img, lang=lang) or ""
            except Exception:
                txt = ""
            txt = "\n".join(line.strip() for line in txt.splitlines()).strip()
            texts.append(txt)
        return texts
    except Exception:
        return None


def extract_text_from_pdf(pdf_path: Path) -> List[str]:
    """Extract text per page from a PDF.

    - First try PyPDF2 (fast)
    - If most pages are empty, fallback to pdfminer.six per-page extraction
    """
    pages: List[str] = []
    try:
        import PyPDF2  # type: ignore
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for i in range(len(reader.pages)):
                try:
                    txt = reader.pages[i].extract_text() or ""
                except Exception:
                    txt = ""
                txt = "\n".join(line.strip() for line in txt.splitlines()).strip()
                pages.append(txt)
    except Exception:
        pages = []

    # If many pages are empty, try pdfminer fallback
    non_empty = sum(1 for p in pages if p and len(p) > 30)
    need_fallback = (len(pages) == 0) or (len(pages) >= 4 and non_empty / max(1, len(pages)) < 0.25)
    if need_fallback:
        try:
            from pdfminer.high_level import extract_text  # type: ignore
            # try per-page extraction via page_numbers
            # First, estimate page count by progressively extracting until empty streak
            # If PyPDF2 succeeded in counting, use that length
            page_count = len(pages) if pages else 200  # safety upper bound
            fallback_pages: List[str] = []
            # If pages list is empty, incrementally try up to 200 pages; stop after 5 consecutive empty
            empty_streak = 0
            max_consecutive_empty = 5
            for i in range(page_count or 200):
                try:
                    txt = extract_text(str(pdf_path), page_numbers=[i]) or ""
                except Exception:
                    txt = ""
                txt = "\n".join(line.strip() for line in txt.splitlines()).strip()
                if not txt:
                    empty_streak += 1
                else:
                    empty_streak = 0
                fallback_pages.append(txt)
                if not pages and i > 5 and empty_streak >= max_consecutive_empty:
                    break
            # replace pages if fallback has more signal
            if sum(1 for p in fallback_pages if p and len(p) > 30) > non_empty:
                pages = fallback_pages
        except Exception:
            pass

    # If still empty or mostly empty, try OCR fill for missing/short pages
    if len(pages) == 0 or (len(pages) >= 4 and sum(1 for p in pages if p and len(p) > 30) / max(1, len(pages)) < 0.5):
        ocr_pages = _ocr_pages_with_tesseract(pdf_path)
        if ocr_pages is not None and len(ocr_pages) > 0:
            if len(pages) == 0:
                pages = ocr_pages
            else:
                # fill only empty/very short pages
                filled: List[str] = []
                for i in range(max(len(pages), len(ocr_pages))):
                    base = pages[i] if i < len(pages) else ""
                    ocr = ocr_pages[i] if i < len(ocr_pages) else ""
                    if base and len(base) > 30:
                        filled.append(base)
                    else:
                        filled.append(ocr)
                pages = filled
    return pages


def chunk_text(text: str, max_len: int = 1200, overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks for better retrieval granularity."""
    if not text:
        return []
    chunks: List[str] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(n, start + max_len)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= n:
            break
        start = end - overlap
        if start < 0:
            start = 0
    return chunks


def ingest_pdf(db_session, pdf_path: Path, department: str, course: str) -> Dict[str, Any]:
    pages = extract_text_from_pdf(pdf_path)
    saved = 0
    for idx, page_text in enumerate(pages, start=1):
        if not page_text.strip():
            continue
        for piece in chunk_text(page_text):
            emb = None
            try:
                emb = create_embedding(piece)
            except Exception:
                emb = None
            kc = KnowledgeChunk(
                text=piece,
                meta={
                    "type": "course",
                    "department": department,
                    "course": course,
                    "source_file": pdf_path.name,
                    "page": idx,
                },
                embedding=emb if isinstance(emb, list) else emb,
            )
            db_session.add(kc)
            saved += 1
    return {"file": pdf_path.name, "saved": saved}


def main():
    parser = argparse.ArgumentParser(description="Ingest textbook PDFs into RAG knowledge base")
    parser.add_argument("--dir", required=True, help="Directory containing PDF files")
    parser.add_argument("--department", default="physical_therapy", help="Department key (e.g., physical_therapy)")
    parser.add_argument("--course", default="해부생리학(제3판)", help="Course or source label")
    parser.add_argument("--build-index", action="store_true", help="Build FAISS index after ingestion")
    args = parser.parse_args()

    root = Path(args.dir)
    if not root.exists() or not root.is_dir():
        print(f"[ERROR] Directory not found: {root}")
        sys.exit(1)

    # DB init
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        total_saved = 0
        results: List[Dict[str, Any]] = []
        pdfs = sorted([p for p in root.iterdir() if p.suffix.lower() == ".pdf"], key=lambda p: p.name)
        if not pdfs:
            print(f"[WARN] No PDFs found in {root}")
        for pdf in pdfs:
            print(f"[INFO] Ingesting {pdf.name} ...")
            pages = extract_text_from_pdf(pdf)
            non_empty_pages = sum(1 for p in pages if p)
            print(f"[INFO] Extracted pages: total={len(pages)}, non_empty={non_empty_pages}")
            # reuse ingest logic by writing through a temporary path? We already have pages; let's call ingest per page via a small wrapper
            # Use the ingest_pdf to keep meta/page numbering in sync by mocking internal call
            saved = 0
            page_start = 1
            if len(pages) > 0:
                # create chunks from extracted pages (same as inside ingest_pdf)
                for idx, page_text in enumerate(pages, start=1):
                    if not page_text.strip():
                        continue
                    for piece in chunk_text(page_text):
                        emb = None
                        try:
                            emb = create_embedding(piece)
                        except Exception:
                            emb = None
                        kc = KnowledgeChunk(
                            text=piece,
                            meta={
                                "type": "course",
                                "department": args.department,
                                "course": args.course,
                                "source_file": pdf.name,
                                "page": idx,
                            },
                            embedding=emb if isinstance(emb, list) else emb,
                        )
                        db.add(kc)
                        saved += 1
            res = {"file": pdf.name, "saved": saved}
            results.append(res)
            print(f"[OK] {res['file']}: saved {res['saved']} chunks")
            total_saved += int(res.get("saved", 0))
        db.commit()
        print(f"[DONE] Total chunks saved: {total_saved}")
        if args.build_index:
            print("[INFO] Building FAISS index ...")
            try:
                res = rag_ai.build_index(db)
                print(f"[OK] Index build: {res}")
            except Exception as ie:
                print(f"[WARN] Index build failed: {ie}")
        else:
            print("[NEXT] To build FAISS index, run: POST /api/ai/rag/build or rerun with --build-index")
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Ingestion failed: {e}")
        sys.exit(2)
    finally:
        db.close()


if __name__ == "__main__":
    main()
