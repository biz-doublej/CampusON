from typing import List, Union, Optional
import os
import numpy as np


def _embed_openai(texts: List[str], model_name: Optional[str] = None):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    try:
        from openai import OpenAI  # type: ignore
        client = OpenAI()
        model = model_name or os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        resp = client.embeddings.create(model=model, input=texts)
        vecs = [np.array(d.embedding, dtype=np.float32).tolist() for d in resp.data]
        return vecs
    except Exception:
        return None


def _embed_gemini(texts: List[str], model_name: Optional[str] = None):
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None
    try:
        import google.generativeai as genai  # type: ignore
        genai.configure(api_key=api_key)  # type: ignore
        model = model_name or os.getenv("GEMINI_EMBEDDING_MODEL", "text-embedding-004")
        vecs: List[List[float]] = []
        for t in texts:
            try:
                r = genai.embed_content(model=model, content=t)  # type: ignore
                v = r.get('embedding') or r.get('data', {}).get('embedding')  # sdk versions
                if v is None and hasattr(r, 'embedding'):
                    v = getattr(r, 'embedding')  # type: ignore
                if v is None:
                    vecs.append(None)  # type: ignore
                else:
                    vecs.append(np.array(v, dtype=np.float32).tolist())
            except Exception:
                vecs.append(None)  # type: ignore
        return vecs
    except Exception:
        return None


def create_embedding(text: Union[str, List[str]], model_type: Optional[str] = None, model_name: Optional[str] = None):
    """Create embeddings for a string or list of strings.

    Provider selection order:
    - model_type parameter if provided ('gemini' | 'openai')
    - env EMBEDDING_PROVIDER ('gemini' | 'openai', default 'openai')

    Returns list[vector] for list input, or single vector for string input.
    On failure, returns None (or list of None).
    """
    try:
        if isinstance(text, list):
            texts = text
            single = False
        else:
            texts = [text]
            single = True

        provider = (model_type or os.getenv("EMBEDDING_PROVIDER") or "openai").lower()

        vecs = None
        if provider == "gemini":
            vecs = _embed_gemini(texts, model_name=model_name)
            if vecs is None:
                # fallback to openai if available
                vecs = _embed_openai(texts, model_name=model_name)
        else:
            vecs = _embed_openai(texts, model_name=model_name)
            if vecs is None:
                vecs = _embed_gemini(texts, model_name=model_name)

        if vecs is None:
            return [None] * len(texts) if not single else None
        return vecs if not single else vecs[0]

    except Exception:
        return [None] * len(texts) if isinstance(text, list) else None
