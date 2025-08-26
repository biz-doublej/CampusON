from typing import Optional, List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    DEBUG: bool = True
    PORT: int = 8001

    # Gemini
    GEMINI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None  # Alternative name for Gemini API key
    GEMINI_MODEL_NAME: str = "gemini-2.0-flash-exp"

    # OpenAI (optional for embeddings)
    OPENAI_API_KEY: Optional[str] = None

    # Poppler (optional explicit path; auto-resolve in parser if not set)
    POPPLER_PATH: Optional[str] = None

    # Database (use SQLite by default for local dev)
    DATABASE_URL: str = "sqlite:///./app.db"

    # CORS/Hosts (defaults for local dev)
    ALLOWED_ORIGINS: List[str] = ["*"]
    ALLOWED_HOSTS: List[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()


