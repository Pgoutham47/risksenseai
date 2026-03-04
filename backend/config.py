"""
Centralized configuration for RiskSense AI backend.
Pulls all secrets and settings from environment variables / .env file.
"""
import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./risksenseai.db")

    # CORS
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:8080,http://localhost:5173").split(",")

    # LLM / OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

    # TBO API
    TBO_STAGING_URL: str = os.getenv("TBO_STAGING_URL", "")
    TBO_USERNAME: str = os.getenv("TBO_USERNAME", "")
    TBO_PASSWORD: str = os.getenv("TBO_PASSWORD", "")
    TBO_FLIGHT_URL: str = os.getenv("TBO_FLIGHT_URL", "")
    TBO_FLIGHT_SEARCH_URL: str = os.getenv("TBO_FLIGHT_SEARCH_URL", "")
    TBO_FLIGHT_USERNAME: str = os.getenv("TBO_FLIGHT_USERNAME", "")
    TBO_FLIGHT_PASSWORD: str = os.getenv("TBO_FLIGHT_PASSWORD", "")

    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")


settings = Settings()
