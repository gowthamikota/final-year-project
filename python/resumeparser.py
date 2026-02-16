import re
from PyPDF2 import PdfReader

MAX_LINE_LEN = 140

# A lightweight skill lexicon to backstop section parsing
KNOWN_SKILLS = [
    "python", "java", "javascript", "typescript", "react", "angular", "vue",
    "node", "express", "django", "flask", "fastapi", "spring", "spring boot",
    "mongodb", "postgresql", "mysql", "sql", "redis", "docker", "kubernetes",
    "aws", "azure", "gcp", "git", "github", "gitlab", "ci/cd", "linux",
    "html", "css", "tailwind", "sass", "graphql", "rest", "pandas", "numpy",
    "tensorflow", "pytorch", "scikit-learn", "machine learning", "data science",
    "redis", "rabbitmq", "kafka"
]


def read_pdf(path):
    text = ""
    try:
        reader = PdfReader(path)
        for page in reader.pages:
            part = page.extract_text()
            if part:
                text += part + "\n"
    except Exception as e:
        print(f"[resumeparser] PDF read error: {e}")
    return text


def truncate_line(line, max_len=MAX_LINE_LEN):
    line = re.sub(r"\s+", " ", line).strip(" -•\t")
    if len(line) <= max_len:
        return line

    # Prefer cutting at sentence boundaries for readability
    sentence_split = re.split(r"[.;]", line)
    if sentence_split:
        candidate = sentence_split[0].strip()
        if 20 < len(candidate) <= max_len:
            return candidate

    trimmed = line[:max_len].rsplit(" ", 1)[0].rstrip(",.;")
    return trimmed + "..."


def dedupe_preserve_order(items):
    seen = set()
    result = []
    for item in items:
        key = item.lower()
        if key and key not in seen:
            seen.add(key)
            result.append(item)
    return result


def extract_section(text, headers, stops):
    header_pattern = "|".join(headers)
    stop_pattern = "|".join(stops)
    regex = rf"(?:{header_pattern})\s*:?[\s\-]*([\s\S]*?)(?=\n(?:{stop_pattern})|\Z)"
    match = re.search(regex, text, re.IGNORECASE)
    return match.group(1) if match else ""


def split_lines(block):
    return [
        re.sub(r"^[•\-\*\d\.]+\s*", "", line).strip()
        for line in re.split(r"\n|•|\-|\u2022", block)
        if line.strip()
    ]


def find_name(text):
    match = re.search(r"\b([A-Z][a-z]{2,}\s[A-Z][a-z]{2,})\b", text)
    return match.group(1) if match else None


def find_email(text):
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else None


def find_phone(text):
    match = re.search(r"\b(\+?\d{1,3}[- ]?)?\d{10}\b", text)
    return match.group(0) if match else None


def find_skills(text):
    block = extract_section(
        text,
        ["Skills", "SKILLS", "Technical Skills", "Core Skills"],
        ["Experience", "EXPERIENCE", "Education", "EDUCATION", "Projects", "PROJECTS", "Certifications", "Certification", "Achievements", "ACHIEVEMENTS", "Awards", "Honors"]
    )

    skills = re.split(r"[,\n;\|]", block) if block else []
    cleaned = []
    for skill in skills:
        skill = re.sub(r"^[•\-\*\d\.]+\s*", "", skill).strip()
        # Filter out common non-skill words
        if 2 < len(skill) < 50 and not re.match(r"^(Skills|Experience|Education|Projects|Certifications?|Achievements?|Awards?|Honors?)", skill, re.IGNORECASE):
            cleaned.append(skill)

    # Backstop with keyword scanning if the section is missing or sparse
    if len(cleaned) < 5:
        text_lower = text.lower()
        for skill in KNOWN_SKILLS:
            if re.search(rf"\b{re.escape(skill)}\b", text_lower):
                formatted = skill.title() if len(skill) <= 4 else skill
                cleaned.append(formatted)

    cleaned = dedupe_preserve_order(cleaned)
    return cleaned[:20]


def find_experience(text):
    block = extract_section(
        text,
        ["Experience", "EXPERIENCE", "Work Experience", "Professional Experience", "Employment History"],
        ["Education", "EDUCATION", "Skills", "SKILLS", "Projects", "PROJECTS", "Certifications", "Certification", "Achievements", "ACHIEVEMENTS", "Awards", "Honors"]
    )

    lines = [] if not block else split_lines(block)
    pruned = []
    for line in lines:
        if len(line) < 12:
            continue
        if re.match(r"^(Experience|Education|Skills|Projects|Certifications?|Achievements?|Awards?|Honors?)", line, re.IGNORECASE):
            continue
        # Filter out lines that are just dates or single words
        if re.match(r"^\d{4}[-/]\d{4}$", line) or re.match(r"^\w+\s+\d{4}\s*[-–]\s*\w+\s+\d{4}$", line):
            continue
        pruned.append(truncate_line(line))

    return dedupe_preserve_order(pruned)[:10]


def find_projects(text):
    block = extract_section(
        text,
        ["Projects", "PROJECTS", "Academic Projects", "Personal Projects"],
        ["Education", "EDUCATION", "Skills", "SKILLS", "Experience", "EXPERIENCE", "Certifications", "Certification", "Achievements", "ACHIEVEMENTS", "Awards", "Honors"]
    )

    lines = [] if not block else split_lines(block)
    pruned = []
    for line in lines:
        if len(line) < 10:
            continue
        if re.match(r"^(Projects|Education|Skills|Experience|Certifications?|Achievements?|Awards?|Honors?)", line, re.IGNORECASE):
            continue
        # Filter out lines that are just dates
        if re.match(r"^\d{4}[-/]\d{4}$", line) or re.match(r"^\w+\s+\d{4}\s*[-–]\s*\w+\s+\d{4}$", line):
            continue
        pruned.append(truncate_line(line))

    return dedupe_preserve_order(pruned)[:10]


def find_education(text):
    block = extract_section(
        text,
        ["Education", "EDUCATION", "Academics", "Academic Background"],
        ["Achievements", "ACHIEVEMENTS", "Skills", "SKILLS", "Experience", "EXPERIENCE", "Projects", "PROJECTS", "Certifications", "Certification", "Awards", "Honors"]
    )

    lines = [] if not block else split_lines(block)
    pruned = []
    for line in lines:
        if len(line) < 8:
            continue
        # Strictly filter out achievement-related content
        if re.search(r"\b(achieve|achievement|award|honor|prize|winner|medal|scholarship|rank|topper|distinction|dean['']?s list|merit)\b", line, re.IGNORECASE):
            continue
        if re.match(r"^(Education|Skills|Experience|Projects|Certifications?|Achievements?|Awards?|Honors?)", line, re.IGNORECASE):
            continue
        pruned.append(truncate_line(line, max_len=120))

    return dedupe_preserve_order(pruned)[:5]


def find_certifications(text):
    block = extract_section(
        text,
        ["Certifications", "CERTIFICATIONS", "Certification", "Certificates", "Professional Certifications"],
        ["Achievements", "ACHIEVEMENTS", "Awards", "AWARDS", "Skills", "SKILLS", "Experience", "EXPERIENCE", "Projects", "PROJECTS", "Education", "EDUCATION", "Honors"]
    )

    lines = [] if not block else split_lines(block)
    pruned = []
    for line in lines:
        if len(line) < 8:
            continue
        if re.match(r"^(Certifications?|Skills|Experience|Education|Projects|Achievements?|Awards?|Honors?)", line, re.IGNORECASE):
            continue
        pruned.append(truncate_line(line, max_len=140))

    return dedupe_preserve_order(pruned)[:10]


def find_achievements(text):
    block = extract_section(
        text,
        ["Achievements", "ACHIEVEMENTS", "Awards", "AWARDS", "Honors", "HONORS", "Honors and Awards"],
        ["Skills", "SKILLS", "Experience", "EXPERIENCE", "Projects", "PROJECTS", "Education", "EDUCATION", "Certifications", "CERTIFICATION"]
    )

    lines = [] if not block else split_lines(block)
    pruned = []
    for line in lines:
        if len(line) < 8:
            continue
        if re.match(r"^(Achievements?|Awards?|Honors?|Skills|Experience|Education|Projects|Certifications?)", line, re.IGNORECASE):
            continue
        pruned.append(truncate_line(line, max_len=140))

    return dedupe_preserve_order(pruned)[:10]


def parse_resume(path):
    text = read_pdf(path)
    if not text:
        return {"success": False, "error": "Unable to read resume"}

    return {
        "name": find_name(text),
        "email": find_email(text),
        "phone": find_phone(text),
        "skills": find_skills(text),
        "experience": find_experience(text),
        "projects": find_projects(text),
        "education": find_education(text),
        "certifications": find_certifications(text),
        "achievements": find_achievements(text),
    }
