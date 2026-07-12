"""
Single adapter for all LLM calls (OpenAI or Claude, chosen via LLM_PROVIDER).
Every function degrades gracefully to a templated/local response if no API
key is configured, so the rest of the app never breaks in dev.
"""
from app.config import get_settings

PROMPT_ATS = """You are an ATS (Applicant Tracking System) auditor. Given the resume text \
below, return a JSON object with keys: "ats_score" (0-100 integer), \
"missing_keywords" (list of strings), "improvements" (list of short actionable \
strings), "better_keywords" (list of strings to add). Resume:\n\n{resume_text}\n\n\
Respond with ONLY the JSON object, no prose, no markdown fences."""


def _client():
    settings = get_settings()
    if settings.llm_provider == "anthropic" and settings.anthropic_api_key:
        import anthropic
        return ("anthropic", anthropic.Anthropic(api_key=settings.anthropic_api_key))
    if settings.llm_provider == "openai" and settings.openai_api_key:
        import openai
        return ("openai", openai.OpenAI(api_key=settings.openai_api_key))
    return (None, None)


def generate_match_recommendation(
    matched_skills: list[str], missing_skills: list[str], score: float, status: str
) -> str:
    provider, client = _client()
    if not provider:
        # Local fallback — no API key configured
        if status == "green":
            return (
                f"Strong match ({score}%). You already cover {len(matched_skills)} "
                f"of the key skills mentioned in this posting — worth applying."
            )
        return (
            f"Weaker match ({score}%). Missing {len(missing_skills)} key skills "
            f"({', '.join(missing_skills[:5]) or 'n/a'}) — consider upskilling before applying."
        )

    prompt = (
        f"A candidate has a {score}% match to a job. Matched skills: {matched_skills}. "
        f"Missing skills: {missing_skills}. In one encouraging but honest sentence, "
        f"tell them whether to apply and why."
    )
    try:
        if provider == "openai":
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=100,
            )
            return resp.choices[0].message.content.strip()
        else:  # anthropic
            resp = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=100,
                messages=[{"role": "user", "content": prompt}],
            )
            return resp.content[0].text.strip()
    except Exception:
        # Never let an LLM outage break the matching flow
        return f"{score}% match — see skill breakdown for details."


def analyze_ats(resume_text: str) -> dict:
    provider, client = _client()
    if not provider:
        return {
            "ats_score": None,
            "missing_keywords": [],
            "improvements": [
                "Connect an OPENAI_API_KEY or ANTHROPIC_API_KEY to enable AI-generated "
                "ATS scoring and resume improvement suggestions."
            ],
            "better_keywords": [],
        }

    import json

    prompt = PROMPT_ATS.format(resume_text=resume_text[:6000])
    try:
        if provider == "openai":
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
            )
            content = resp.choices[0].message.content
        else:
            resp = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}],
            )
            content = resp.content[0].text
        return json.loads(content)
    except Exception:
        return {
            "ats_score": None,
            "missing_keywords": [],
            "improvements": ["AI analysis temporarily unavailable — please retry."],
            "better_keywords": [],
        }
