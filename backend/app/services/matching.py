"""
Resume <-> Job matching engine.

- Embeds resume text and job description with OpenAI Embeddings API (text-embedding-3-small)
  and computes cosine similarity for a semantic "fit" score.
- If no OpenAI key is configured, falls back gracefully to a smart Jaccard similarity index
  that measures word-overlap (filtering out common stop words).
- Cross-references extracted resume skills against skills mentioned in the
  job description (simple keyword extraction) for an explicit skill-match /
  missing-skill breakdown.
- Final match_score blends both signals.
- Calls the LLM adapter (services/ai_suggestions.py) for a one-line recommendation.
"""
import re
from functools import lru_cache
from app.config import get_settings
from app.services.resume_parser import SKILL_VOCAB
from app.services import ai_suggestions

SEMANTIC_WEIGHT = 0.5
SKILL_WEIGHT = 0.5

STOP_WORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "with",
    "by", "about", "against", "of", "from", "that", "this", "these", "those",
    "i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
    "my", "your", "his", "their", "is", "are", "was", "were", "be", "been", "have",
    "has", "had", "do", "does", "did", "will", "would", "shall", "should", "can",
    "could", "may", "might", "must"
}


def _get_openai_client():
    settings = get_settings()
    if settings.openai_api_key:
        import openai
        return openai.OpenAI(api_key=settings.openai_api_key)
    return None


def embed(text: str) -> list[float] | None:
    client = _get_openai_client()
    if client:
        try:
            # Clean and truncate text for embedding limits (max 8192 tokens)
            truncated_text = text[:15000]
            settings = get_settings()
            model = settings.embedding_model if "embedding" in settings.embedding_model else "text-embedding-3-small"
            resp = client.embeddings.create(
                model=model,
                input=truncated_text
            )
            return resp.data[0].embedding
        except Exception:
            # Fall back to Jaccard overlap on API error
            pass
    return None


def cosine_sim(a: list[float], b: list[float]) -> float:
    # already normalized vectors -> dot == cosine
    return sum(x * y for x, y in zip(a, b))


def _jaccard_similarity(text1: str, text2: str) -> float:
    """Fallback semantic similarity when OpenAI is not available.
    Computes overlap of words (Jaccard similarity index), filtering out common stop words.
    """
    words1 = {w for w in re.findall(r"\w+", text1.lower()) if w not in STOP_WORDS}
    words2 = {w for w in re.findall(r"\w+", text2.lower()) if w not in STOP_WORDS}
    if not words1 or not words2:
        return 0.0
    intersection = words1 & words2
    union = words1 | words2
    return len(intersection) / len(union)


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

    if resume_vec is not None and job_vec is not None:
        semantic_score = max(0.0, cosine_sim(resume_vec, job_vec)) * 100
    else:
        # Fallback to Jaccard overlap if API key is not present or calls fail.
        # Multiply by a scaling factor to represent typical semantic match ranges
        jaccard = _jaccard_similarity(resume_text, job_description)
        semantic_score = min(100.0, jaccard * 250.0)

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

