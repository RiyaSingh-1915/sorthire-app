from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


# ---------- Resume ----------
class ParsedResume(BaseModel):
    skills: list[str] = []
    education: list[str] = []
    experience: list[str] = []
    projects: list[str] = []


class ResumeOut(BaseModel):
    id: str
    user_id: str
    file_name: str
    parsed: ParsedResume
    ats_score: Optional[float] = None
    ats_feedback: dict = {}
    created_at: datetime


# ---------- Jobs ----------
class JobCreate(BaseModel):
    company_name: str
    role: str
    job_link: Optional[str] = None
    job_description: str
    location: Optional[str] = None


class JobOut(JobCreate):
    id: str
    user_id: str
    created_at: datetime


# ---------- Matching ----------
class MatchResult(BaseModel):
    job_id: str
    resume_id: str
    match_score: float
    skill_match: list[str]
    missing_skills: list[str]
    recommendation: str
    status: Literal["green", "red"]


# ---------- Company ----------
class CompanyInfo(BaseModel):
    name: str
    logo_url: Optional[str] = None
    description: Optional[str] = None
    company_type: Optional[str] = None  # Startup / LLP / MNC
    employee_count: Optional[str] = None
    industry: Optional[str] = None
    founded_year: Optional[int] = None
    headquarters: Optional[str] = None
    ceo_founder: Optional[str] = None
    rating: Optional[float] = None
    work_culture_rating: Optional[float] = None
    work_life_balance_rating: Optional[float] = None
    working_days: Optional[str] = None
    saturday_working: Optional[bool] = None
    work_mode: Optional[str] = None  # Hybrid / Remote / Office
    source: Optional[str] = None


# ---------- Salary ----------
class SalaryDetails(BaseModel):
    ctc: Optional[str] = None
    in_hand_estimate: Optional[str] = None
    bonus: Optional[str] = None
    joining_bonus: Optional[str] = None
    variable_pay: Optional[str] = None
    benefits: list[str] = []


# ---------- Office ----------
class OfficeInfo(BaseModel):
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    nearest_metro: Optional[str] = None
    nearest_bus: Optional[str] = None
    nearest_railway: Optional[str] = None
    distance_from_station_km: Optional[float] = None
    transportation_notes: Optional[str] = None


# ---------- Analytics ----------
class AnalyticsSummary(BaseModel):
    total_jobs: int
    green_jobs: int
    red_jobs: int
    average_match: float
    top_skills: list[tuple[str, int]]
    missing_skills: list[tuple[str, int]]
