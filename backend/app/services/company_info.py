"""
Company enrichment via a fallback chain: Clearbit -> Crunchbase -> Wikipedia.

Fields like "work culture rating" / "Saturday working" / "working days" have
no reliable free public API (Glassdoor/AmbitionBox don't offer one). For
those, we check a hand-curated `company_overrides` table first; if absent,
we return None and the frontend shows "Not available — add manually".

Results are cached in the `companies` table so repeated lookups for the same
employer don't re-hit external APIs.
"""
import httpx
from app.config import get_settings
from app.db.supabase_client import get_supabase


async def get_company_info(name: str) -> dict:
    supabase = get_supabase()
    cached = supabase.table("companies").select("*").eq("name", name).execute()
    if cached.data:
        return cached.data[0]

    info = await _fetch_clearbit(name) or {}
    if not info.get("description"):
        wiki = await _fetch_wikipedia(name)
        info = {**wiki, **info}

    overrides = supabase.table("company_overrides").select("*").eq(
        "company_name", name
    ).execute()
    if overrides.data:
        info.update(overrides.data[0].get("overrides", {}))

    info["name"] = name
    info.setdefault("source", "auto")
    supabase.table("companies").upsert(info, on_conflict="name").execute()
    return info


async def _fetch_clearbit(name: str) -> dict | None:
    settings = get_settings()
    if not settings.clearbit_api_key:
        return None  # TODO(key): set CLEARBIT_API_KEY in backend/.env
    domain_guess = name.lower().replace(" ", "") + ".com"
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(
                f"https://company.clearbit.com/v2/companies/find?domain={domain_guess}",
                headers={"Authorization": f"Bearer {settings.clearbit_api_key}"},
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            return {
                "logo_url": data.get("logo"),
                "description": data.get("description"),
                "employee_count": str(data.get("metrics", {}).get("employees", "")),
                "industry": data.get("category", {}).get("industry"),
                "founded_year": data.get("foundedYear"),
                "headquarters": ", ".join(
                    filter(
                        None,
                        [
                            data.get("geo", {}).get("city"),
                            data.get("geo", {}).get("country"),
                        ],
                    )
                ),
                "company_type": _infer_company_type(data),
                "source": "clearbit",
            }
        except httpx.HTTPError:
            return None


def _infer_company_type(clearbit_data: dict) -> str:
    employees = clearbit_data.get("metrics", {}).get("employees") or 0
    if employees >= 1000:
        return "MNC"
    if employees >= 50:
        return "Mid-size"
    return "Startup"


async def _fetch_wikipedia(name: str) -> dict:
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(
                f"https://en.wikipedia.org/api/rest_v1/page/summary/{name.replace(' ', '_')}"
            )
            if resp.status_code != 200:
                return {}
            data = resp.json()
            return {"description": data.get("extract"), "source": "wikipedia"}
        except httpx.HTTPError:
            return {}


async def get_workplace_images(company_name: str, limit: int = 6) -> list[str]:
    settings = get_settings()
    if not settings.bing_image_search_key:
        return []  # TODO(key): set BING_IMAGE_SEARCH_KEY in backend/.env
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(
                "https://api.bing.microsoft.com/v7.0/images/search",
                params={"q": f"{company_name} office workplace", "count": limit},
                headers={"Ocp-Apim-Subscription-Key": settings.bing_image_search_key},
            )
            if resp.status_code != 200:
                return []
            data = resp.json()
            return [img["contentUrl"] for img in data.get("value", [])]
        except httpx.HTTPError:
            return []
