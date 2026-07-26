from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from app.routers.auth import get_current_user
from app.db.supabase_client import get_supabase, RESUME_BUCKET
from app.services import resume_parser, ai_suggestions, matching
import uuid
import io
import re


router = APIRouter(prefix="/resumes", tags=["resumes"])


def sanitize_filename(filename: str) -> str:
    cleaned = filename.replace(" ", "_")
    cleaned = re.sub(r"[^a-zA-Z0-9._-]", "", cleaned)
    return cleaned


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
    try:
        supabase.table("resumes").update({"is_active": False}).eq(
            "user_id", user_id
        ).eq("is_active", True).execute()
    except Exception as e:
        raise HTTPException(500, f"Database error during deactivation: {e}")

    safe_filename = sanitize_filename(file.filename)
    storage_path = f"{user_id}/{uuid.uuid4()}_{safe_filename}"
    
    # Determine the content type (mime type)
    content_type = file.content_type
    if not content_type:
        if file.filename.lower().endswith(".pdf"):
            content_type = "application/pdf"
        elif file.filename.lower().endswith(".docx"):
            content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        else:
            content_type = "application/octet-stream"

    # Upload to Supabase Storage
    try:
        supabase.storage.from_(RESUME_BUCKET).upload(
            path=storage_path,
            file=io.BytesIO(file_bytes),
            file_options={"content-type": content_type}
        )
    except Exception as e:
        raise HTTPException(
            500, 
            f"Failed to upload resume to storage bucket '{RESUME_BUCKET}': {e}. "
            "Please check if the bucket exists and policies are set correctly."
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
    
    try:
        result = supabase.table("resumes").insert(row).execute()
        return result.data[0]
    except Exception as e:
        # Clean up the uploaded storage file if database insert fails
        try:
            supabase.storage.from_(RESUME_BUCKET).remove([storage_path])
        except Exception:
            pass
        raise HTTPException(500, f"Database insert failed: {e}")


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
