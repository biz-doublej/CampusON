from __future__ import annotations

from pathlib import Path
from typing import List


def extract_text_from_pdf(pdf_path: Path) -> List[str]:
    """Extract raw text for each page in a PDF using PyPDF2.

    This is a lightweight variant of the ingestion script logic that focuses on
    reading textual PDFs (no OCR). It returns a list of strings, one per page.
    """
    pages: List[str] = []
    try:
        from PyPDF2 import PdfReader  # type: ignore
    except Exception:
        return pages

    try:
        reader = PdfReader(str(pdf_path))
    except Exception:
        return pages

    for page in reader.pages:
        try:
            text = page.extract_text() or ""
        except Exception:
            text = ""
        text = "\n".join(line.strip() for line in text.splitlines()).strip()
        pages.append(text)
    return pages
