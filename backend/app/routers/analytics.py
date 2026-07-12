from collections import Counter
from fastapi import APIRouter, Depends
from app.routers.auth import get_current_user
from app.db.supabase_client import get_supabase

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def get_summary(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    jobs = supabase.table("jobs").select("id").eq("user_id", user_id).execute().data
    job_ids = [j["id"] for j in jobs]

    if not job_ids:
        return {
            "total_jobs": 0,
            "green_jobs": 0,
            "red_jobs": 0,
            "average_match": 0,
            "top_skills": [],
            "missing_skills": [],
        }

    matches = (
        supabase.table("match_results").select("*").in_("job_id", job_ids).execute().data
    )

    green = [m for m in matches if m["status"] == "green"]
    red = [m for m in matches if m["status"] == "red"]
    avg = round(sum(m["match_score"] for m in matches) / len(matches), 1) if matches else 0

    skill_counter = Counter()
    missing_counter = Counter()
    for m in matches:
        skill_counter.update(m.get("skill_match") or [])
        missing_counter.update(m.get("missing_skills") or [])

    return {
        "total_jobs": len(jobs),
        "green_jobs": len(green),
        "red_jobs": len(red),
        "average_match": avg,
        "top_skills": skill_counter.most_common(10),
        "missing_skills": missing_counter.most_common(10),
    }
