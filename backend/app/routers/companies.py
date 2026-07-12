from fastapi import APIRouter, Depends
from app.routers.auth import get_current_user
from app.db.supabase_client import get_supabase
from app.services import company_info, maps

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("/{name}")
async def get_company(name: str, user_id: str = Depends(get_current_user)):
    return await company_info.get_company_info(name)


@router.get("/{name}/images")
async def get_images(name: str, user_id: str = Depends(get_current_user)):
    images = await company_info.get_workplace_images(name)
    return {"images": images}


@router.get("/office/{job_id}")
async def get_office_info(job_id: str, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    job = supabase.table("jobs").select("*").eq("id", job_id).execute().data
    if not job or not job[0].get("location"):
        return {"address": None}
    info = await maps.get_office_info(job[0]["location"])
    supabase.table("office_info").upsert(
        {**info, "job_id": job_id}, on_conflict="job_id"
    ).execute()
    return info


@router.get("/salary/{job_id}")
def get_salary(job_id: str, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("salary_details").select("*").eq("job_id", job_id).execute()
    if result.data:
        return result.data[0]
    return {
        "ctc": None,
        "in_hand_estimate": None,
        "bonus": None,
        "joining_bonus": None,
        "variable_pay": None,
        "benefits": [],
        "note": "No salary data yet — add manually or wire a salary-data provider.",
    }


@router.put("/salary/{job_id}")
def upsert_salary(job_id: str, salary: dict, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("salary_details").upsert(
        {**salary, "job_id": job_id}, on_conflict="job_id"
    ).execute()
    return result.data[0]
