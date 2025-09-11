from typing import List, Dict, Any, Optional
import os
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai  # type: ignore
except Exception:
    genai = None  # type: ignore


def _init_model():
    api_key = (
        getattr(settings, "GEMINI_API_KEY", None)
        or os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
    )
    if not api_key or genai is None:
        return None
    try:
        genai.configure(api_key=api_key)  # type: ignore
        model_name = getattr(settings, 'GEMINI_MODEL_NAME', 'gemini-2.0-flash-exp')
        return genai.GenerativeModel(model_name)  # type: ignore
    except Exception as e:
        logger.warning(f"Gemini init failed: {e}")
        return None


def chat_with_ai(messages: List[Dict[str, str]], context: Optional[str] = None) -> str:
    """Simple chat handler with optional context. Uses Gemini if available, else echo."""
    model = _init_model()
    user_msg = "\n".join([m.get("content", "") for m in messages if m.get("role") == "user"]) or "질문이 비어있습니다."
    if not model:
        # Fallback echo style
        base = "[샘플 응답] 질문을 받았어요. "
        if context:
            base += "(컨텍스트 참조) "
        return base + user_msg[:200]
    try:
        full_prompt = (f"다음은 사용자의 메시지입니다. 한국어로 간결하고 정확하게 답하세요.\n"
                       f"문맥: {context or '없음'}\n"
                       f"메시지: {user_msg}")
        resp = model.generate_content(full_prompt)  # type: ignore
        text = getattr(resp, 'text', None)
        if isinstance(text, str) and text.strip():
            return text.strip()
    except Exception as e:
        logger.warning(f"Chat generation failed, using fallback: {e}")
    return "[샘플 응답] 현재 AI가 초기화되지 않았습니다."

