"""
Resume parsing: extracts raw text from PDF/DOCX, then uses a spaCy NER
pipeline + heuristic section-splitting to pull out skills, education,
experience, and projects.

This is a real, working pipeline (no external API calls) — it's the one
part of the "AI" stack that runs fully offline.
"""
import re
import io
import fitz  # PyMuPDF
import docx
import spacy
from functools import lru_cache

SECTION_HEADERS = {
    "skills": ["skills", "technical skills", "core competencies"],
    "education": ["education", "academic background"],
    "experience": ["experience", "work experience", "employment history", "professional experience"],
    "projects": ["projects", "personal projects", "academic projects"],
}

# A reasonably broad seed skill vocabulary used to catch skills that generic
# NER models miss (spaCy's default model has no "SKILL" entity type).
SKILL_VOCAB = [
    "python", "java", "javascript", "typescript", "react", "next.js", "node.js",
    "express", "django", "flask", "fastapi", "spring boot", "sql", "postgresql",
    "mysql", "mongodb", "redis", "docker", "kubernetes", "aws", "gcp", "azure",
    "terraform", "ci/cd", "git", "graphql", "rest api", "tailwind", "html", "css",
    "machine learning", "deep learning", "nlp", "pytorch", "tensorflow",
    "pandas", "numpy", "scikit-learn", "spark", "airflow", "kafka", "microservices",
    "system design", "data structures", "algorithms", "c++", "c#", "go", "rust",
    "swift", "kotlin", "android", "ios", "flutter", "react native", "figma",
    "product management", "agile", "scrum", "communication", "leadership",
]


@lru_cache
def _nlp():
    try:
        return spacy.load("en_core_web_sm")
    except OSError as e:
        raise RuntimeError(
            "spaCy model not found. Run: python -m spacy download en_core_web_sm"
        ) from e


def extract_text(file_bytes: bytes, filename: str) -> str:
    if filename.lower().endswith(".pdf"):
        return _extract_pdf(file_bytes)
    elif filename.lower().endswith(".docx"):
        return _extract_docx(file_bytes)
    raise ValueError("Unsupported file type. Upload a .pdf or .docx resume.")


def _extract_pdf(file_bytes: bytes) -> str:
    text_parts = []
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page in doc:
            text_parts.append(page.get_text())
    return "\n".join(text_parts)


def _extract_docx(file_bytes: bytes) -> str:
    document = docx.Document(io.BytesIO(file_bytes))
    return "\n".join(p.text for p in document.paragraphs)


def _split_sections(raw_text: str) -> dict[str, str]:
    """Split resume text into sections using header keywords, case-insensitively."""
    lines = raw_text.splitlines()
    sections: dict[str, list[str]] = {k: [] for k in SECTION_HEADERS}
    current = None

    for line in lines:
        stripped = line.strip().lower().rstrip(":")
        matched_section = None
        for section, headers in SECTION_HEADERS.items():
            if stripped in headers or any(stripped == h for h in headers):
                matched_section = section
                break
        if matched_section:
            current = matched_section
            continue
        if current:
            sections[current].append(line)

    return {k: "\n".join(v).strip() for k, v in sections.items()}


def _extract_skills(raw_text: str, skills_section: str) -> list[str]:
    haystack = (skills_section or raw_text).lower()
    found = set()
    for skill in SKILL_VOCAB:
        pattern = r"\b" + re.escape(skill) + r"\b"
        if re.search(pattern, haystack):
            found.add(skill)
    # Also split comma/pipe separated skills-section lines directly
    if skills_section:
        for token in re.split(r"[,|•\n]", skills_section):
            token = token.strip()
            if 1 < len(token) <= 40:
                found.add(token.lower())
    return sorted(found)


def _bullet_lines(section_text: str) -> list[str]:
    lines = [l.strip("•- \t") for l in section_text.splitlines()]
    return [l for l in lines if len(l) > 3]


def parse_resume(file_bytes: bytes, filename: str) -> dict:
    raw_text = extract_text(file_bytes, filename)
    sections = _split_sections(raw_text)

    skills = _extract_skills(raw_text, sections.get("skills", ""))
    education = _bullet_lines(sections.get("education", "")) or _fallback_education(raw_text)
    experience = _bullet_lines(sections.get("experience", ""))
    projects = _bullet_lines(sections.get("projects", ""))

    return {
        "raw_text": raw_text,
        "parsed": {
            "skills": skills,
            "education": education,
            "experience": experience,
            "projects": projects,
        },
    }


def _fallback_education(raw_text: str) -> list[str]:
    """If no explicit 'Education' header exists, use NER to grab ORG/degree-like lines."""
    doc = _nlp()(raw_text[:5000])  # cap for speed
    degree_kw = re.compile(r"\b(b\.?tech|m\.?tech|bachelor|master|b\.?sc|m\.?sc|mba|phd)\b", re.I)
    lines = [line.strip() for line in raw_text.splitlines() if degree_kw.search(line)]
    return lines[:5]
