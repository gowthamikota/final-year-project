import re
from PyPDF2 import PdfReader


# ---------------- PDF READER ----------------

def read_pdf(path):
    text = ""
    reader = PdfReader(path)

    for page in reader.pages:
        part = page.extract_text()
        if part:
            text += part + "\n"

    # Fix merged lowercase-uppercase words
    text = re.sub(r"([a-z])([A-Z])", r"\1 \2", text)

    # Fix merged month (Ltd.May → Ltd. May)
    text = re.sub(
        r"\.(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)",
        r". \1",
        text
    )

    # Force newline before main section names
    sections = ["Education", "Skills", "Projects"]
    for sec in sections:
        text = re.sub(rf"\s*{sec}\s*", f"\n{sec}\n", text)

    # Clean spacing
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n", "\n", text)

    return text.strip()


# ---------------- BASIC INFO ----------------

def find_email(text):
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else None


def find_phone(text):
    match = re.search(r"(\+?\d{1,3}[\s-]?)?\d{10}", text)
    return match.group(0) if match else None


def find_name(text):
    lines = text.split("\n")[:5]
    for line in lines:
        line = line.strip()
        if 5 < len(line) < 60 and re.match(r"^[A-Z][a-zA-Z]+\s[A-Z][a-zA-Z]+", line):
            return line
    return None


# ---------------- SECTION SPLITTER ----------------

def extract_section(text, section_name):
    pattern = rf"\n{section_name}\n(.*?)(?=\n[A-Z][A-Za-z &]+\n|\Z)"
    match = re.search(pattern, text, re.DOTALL)
    return match.group(1).strip() if match else ""


# ---------------- SKILLS ----------------

def find_skills(text):
    block = extract_section(text, "Skills")
    if not block:
        return []

    lines = block.split("\n")
    skills = []

    for line in lines:
        parts = re.split(r",", line)
        for part in parts:
            cleaned = part.strip()
            cleaned = re.sub(
                r"^(Programming|Databases|Backend Development|Core Concepts|Tools|Data & Analytics)",
                "",
                cleaned,
            ).strip()

            if len(cleaned) > 1:
                skills.append(cleaned)

    return list(set(skills))


# ---------------- EDUCATION ----------------

def find_education(text):
    block = extract_section(text, "Education")
    if not block:
        return ""

    # Return entire education block as single string
    return block.strip()


# ---------------- PROJECT NAMES ONLY ----------------

def find_projects(text):
    block = extract_section(text, "Projects")
    if not block:
        return []

    lines = block.split("\n")

    project_titles = []

    for line in lines:
        line = line.strip("•- \t")
        if not line:
            continue

        # Detect likely project title
        if "–" in line or "(GitHub)" in line or "(Git Hub)" in line:
            title = (
                line.replace("(GitHub)", "")
                .replace("(Git Hub)", "")
                .strip()
            )
            project_titles.append(title)

    return project_titles


# ---------------- MAIN PARSER ----------------

def parse_resume(path):
    text = read_pdf(path)

    return {
        "name": find_name(text),
        "email": find_email(text),
        "phone": find_phone(text),
        "education": find_education(text),
        "skills": find_skills(text),
        "projects": find_projects(text),
        "raw_text": text[:15000],   # for embeddings
    }