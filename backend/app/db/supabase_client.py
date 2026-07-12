"""
Server-side Supabase client using the service_role key.
NEVER expose this key to the frontend — only used inside FastAPI.
"""
from functools import lru_cache
from supabase import create_client, Client
from app.config import get_settings


@lru_cache
def get_supabase() -> Client:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise RuntimeError(
            "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set. "
            "Copy backend/.env.example to backend/.env and fill them in."
        )
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


RESUME_BUCKET = "resumes"
