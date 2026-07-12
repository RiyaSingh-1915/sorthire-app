from fastapi import APIRouter, Depends, HTTPException
from app.routers.auth import get_current_user
from app.models.schemas import JobCreate
from app.db.supabase_client import get_supabase
from app.services import matching
from app.config import get_settings

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("")
def create_job(job: JobCreate, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    row = {**job.model_dump(), "user_id": user_id}
    result = supabase.table("jobs").insert(row).execute()
    created = result.data[0]

    # Auto-run matching against the active resume right away
    try:
        _run_match_for_job(created["id"], user_id)
    except HTTPException:
        pass  # no resume yet — user can trigger matching later from the dashboard

    return created


@router.get("")
def list_jobs(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    jobs = supabase.table("jobs").select("*").eq("user_id", user_id).execute().data
    job_ids = [j["id"] for j in jobs]
    matches = (
        supabase.table("match_results")
        .select("*")
        .in_("job_id", job_ids)
        .execute()
        .data
        if job_ids
        else []
    )
    matches_by_job = {m["job_id"]: m for m in matches}
    for job in jobs:
        job["match"] = matches_by_job.get(job["id"])
    return jobs


@router.get("/{job_id}")
def get_job(job_id: str, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    job = (
        supabase.table("jobs").select("*").eq("id", job_id).eq("user_id", user_id).execute()
    ).data
    if not job:
        raise HTTPException(404, "Job not found")
    match = (
        supabase.table("match_results").select("*").eq("job_id", job_id).execute()
    ).data
    result = job[0]
    result["match"] = match[0] if match else None
    return result


@router.delete("/{job_id}")
def delete_job(job_id: str, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    supabase.table("jobs").delete().eq("id", job_id).eq("user_id", user_id).execute()
    return {"ok": True}


@router.post("/{job_id}/match")
def run_match(job_id: str, user_id: str = Depends(get_current_user)):
    return _run_match_for_job(job_id, user_id)


def _run_match_for_job(job_id: str, user_id: str):
    supabase = get_supabase()
    settings = get_settings()

    job = (
        supabase.table("jobs").select("*").eq("id", job_id).eq("user_id", user_id).execute()
    ).data
    if not job:
        raise HTTPException(404, "Job not found")
    job = job[0]

    resume = (
        supabase.table("resumes")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .limit(1)
        .execute()
    ).data
    if not resume:
        raise HTTPException(400, "Upload a resume before matching")
    resume = resume[0]

    result = matching.match_resume_to_job(
        resume_text=resume["raw_text"],
        resume_skills=resume["parsed_json"].get("skills", []),
        job_description=job["job_description"],
        green_threshold=settings.match_green_threshold,
    )

    row = {
        "job_id": job_id,
        "resume_id": resume["id"],
        "match_score": result["match_score"],
        "skill_match": result["skill_match"],
        "missing_skills": result["missing_skills"],
        "recommendation": result["recommendation"],
        "status": result["status"],
    }
    saved = supabase.table("match_results").upsert(
        row, on_conflict="job_id,resume_id"
    ).execute()
    return saved.data[0]
