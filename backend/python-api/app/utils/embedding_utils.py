from typing import List, Union, Optional
import os


def create_embedding(text: Union[str, List[str]], model_type: str = "openai", model_name: Optional[str] = None):
    """임베딩 생성 유틸. 키가 없거나 오류 시 빈 결과를 반환하여 상위 로직을 막지 않습니다.

    Args:
        text: 단일 문자열 또는 문자열 리스트
        model_type: 현재 'openai'만 지원
        model_name: 선택 모델명
    Returns:
        리스트 입력이면 리스트로, 단일 입력이면 단일 임베딩(또는 None)
    """
    try:
        if isinstance(text, list):
            texts = text
        else:
            texts = [text]

        if model_type == "openai":
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                return [None] * len(texts) if isinstance(text, list) else None
            # TODO: openai 1.x 클라이언트로 교체 구현
            return [None] * len(texts) if isinstance(text, list) else None

        return [None] * len(texts) if isinstance(text, list) else None

    except Exception:
        return [None] * len(texts) if isinstance(text, list) else None


