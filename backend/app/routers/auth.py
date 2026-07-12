"""
Auth is primarily handled client-side via Supabase Auth (Google OAuth +
Email/Password) — the frontend gets a JWT directly from Supabase.

This router only verifies the JWT on protected backend routes and
upserts the `profiles` row on first login.
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from app.db.supabase_client import get_supabase

router = APIRouter(prefix="/auth", tags=["auth"])


def get_current_user(authorization: str = Header(...)) -> str:
    """Validate the Supabase JWT passed as 'Authorization: Bearer <token>' and
    return the user id. Raises 401 if invalid."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    supabase = get_supabase()
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(401, "Invalid token")
        return user.user.id
    except Exception:
        raise HTTPException(401, "Invalid or expired token")


@router.post("/sync-profile")
def sync_profile(user_id: str = Depends(get_current_user)):
    """Call once after login to ensure a profiles row exists."""
    supabase = get_supabase()
    supabase.table("profiles").upsert({"id": user_id}).execute()
    return {"ok": True}
