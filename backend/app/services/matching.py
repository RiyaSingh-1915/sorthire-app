"""
Resume <-> Job matching engine.

- Embeds resume text and job description with sentence-transformers and
  computes cosine similarity for a semantic "fit" score.
- Cross-references extracted resume skills against skills mentioned in the
  job description (simple keyword extraction) for an explicit skill-match /
  missing-skill breakdown, which is more legible to users than a raw
  embedding score alone.
- Final match_score blends both signals.
- Calls the LLM adapter (services/ai_suggestions.py) for a one-line
  human-readable recommendation. Falls back to a templated recommendation
  if no LLM key is configured, so the app still works end-to-end offline.
"""
from functools import lru_cache
import numpy as np
from sentence_transformers import SentenceTransformer

from app.config import get_settings
from app.services.resume_parser import SKILL_VOCAB
from app.services import ai_suggestions

SEMANTIC_WEIGHT = 0.5
SKILL_WEIGHT = 0.5


@lru_cache
def _model():
    settings = get_settings()
    return SentenceTransformer(settings.embedding_model)


def embed(text: str) -> np.ndarray:
    return _model().encode(text, normalize_embeddings=True)


def cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b))  # already normalized -> dot == cosine


def _skills_in_text(text: str) -> set[str]:
    text_lower = text.lower()
    return {s for s in SKILL_VOCAB if s in text_lower}


def match_resume_to_job(
    resume_text: str,
    resume_skills: list[str],
    job_description: str,
    green_threshold: float,
) -> dict:
    # 1. Semantic similarity (0-100)
    resume_vec = embed(resume_text)
    job_vec = embed(job_description)
    semantic_score = max(0.0, cosine_sim(resume_vec, job_vec)) * 100

    # 2. Skill overlap
    job_skills = _skills_in_text(job_description)
    resume_skill_set = {s.lower() for s in resume_skills} | _skills_in_text(resume_text)

    matched = sorted(job_skills & resume_skill_set)
    missing = sorted(job_skills - resume_skill_set)

    skill_score = 100.0 if not job_skills else (len(matched) / len(job_skills)) * 100

    final_score = round(SEMANTIC_WEIGHT * semantic_score + SKILL_WEIGHT * skill_score, 1)
    status = "green" if final_score >= green_threshold else "red"

    recommendation = ai_suggestions.generate_match_recommendation(
        matched_skills=matched,
        missing_skills=missing,
        score=final_score,
        status=status,
    )

    return {
        "match_score": final_score,
        "skill_match": matched,
        "missing_skills": missing,
        "recommendation": recommendation,
        "status": status,
    }
