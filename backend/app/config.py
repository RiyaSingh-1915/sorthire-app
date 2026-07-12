from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_role_key: str = ""

    llm_provider: str = "openai"  # "openai" | "anthropic"
    openai_api_key: str = ""
    anthropic_api_key: str = ""

    google_maps_api_key: str = ""
    clearbit_api_key: str = ""
    bing_image_search_key: str = ""

    embedding_model: str = "all-MiniLM-L6-v2"
    match_green_threshold: float = 65.0
    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
