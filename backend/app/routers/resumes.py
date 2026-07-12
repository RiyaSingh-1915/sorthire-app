from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.routers.auth import get_current_user
from app.db.supabase_client import get_supabase, RESUME_BUCKET
from app.services import resume_parser, ai_suggestions, matching
import uuid

router = APIRouter(prefix="/resumes", tags=["resumes"])


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...), user_id: str = Depends(get_current_user)
):
    if not file.filename.lower().endswith((".pdf", ".docx")):
        raise HTTPException(400, "Only .pdf or .docx resumes are supported")

    file_bytes = await file.read()
    parsed = resume_parser.parse_resume(file_bytes, file.filename)

    supabase = get_supabase()

    # Deactivate previous active resume (we keep history, but only one active)
    supabase.table("resumes").update({"is_active": False}).eq(
        "user_id", user_id
    ).eq("is_active", True).execute()

    storage_path = f"{user_id}/{uuid.uuid4()}_{file.filename}"
    supabase.storage.from_(RESUME_BUCKET).upload(
        storage_path, file_bytes, {"content-type": file.content_type}
    )

    ats = ai_suggestions.analyze_ats(parsed["raw_text"])

    row = {
        "user_id": user_id,
        "file_path": storage_path,
        "file_name": file.filename,
        "is_active": True,
        "raw_text": parsed["raw_text"],
        "parsed_json": parsed["parsed"],
        "ats_score": ats.get("ats_score"),
        "ats_feedback": ats,
    }
    result = supabase.table("resumes").insert(row).execute()
    return result.data[0]


@router.get("/active")
def get_active_resume(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    result = (
        supabase.table("resumes")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "No resume uploaded yet")
    return result.data[0]


@router.patch("/{resume_id}/parsed")
def update_parsed_fields(
    resume_id: str, parsed: dict, user_id: str = Depends(get_current_user)
):
    """Let the user manually edit extracted skills/education/experience/projects."""
    supabase = get_supabase()
    result = (
        supabase.table("resumes")
        .update({"parsed_json": parsed})
        .eq("id", resume_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Resume not found")
    return result.data[0]
