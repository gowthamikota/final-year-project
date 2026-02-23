import re
from PyPDF2 import PdfReader


def read_pdf(path):
    text = ""
    reader = PdfReader(path)
    for page in reader.pages:
        part = page.extract_text()
        if part:
            text += part + "\n"
    return text.strip()


# ---------------- BASIC INFO ----------------

def find_email(text):
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else None


def find_phone(text):
    match = re.search(r"(\+?\d{1,3}[\s-]?)?\d{10}", text)
    return match.group(0) if match else None


def find_name(text):
    # Take first 2-3 word capitalized line from top
    lines = text.split("\n")[:10]
    for line in lines:
        line = line.strip()
        if 5 < len(line) < 40 and re.match(r"^[A-Z][a-zA-Z]+\s[A-Z][a-zA-Z]+", line):
            return line
    return None


# ---------------- SECTION EXTRACTION ----------------

def extract_section(text, section_name):
    pattern = rf"{section_name}\s*(.*?)(\n[A-Z][A-Za-z\s]+:?\n|\Z)"
    match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
    return match.group(1).strip() if match else ""


def clean_lines(block, min_len=5, max_items=8):
    lines = []
    for line in block.split("\n"):
        line = line.strip("•- \t")
        if len(line) >= min_len:
            lines.append(line)
    return lines[:max_items]


# ---------------- SKILLS ----------------

def find_skills(text):
    skills_block = extract_section(text, "Skills")
    if not skills_block:
        return []

    # Split by commas or new lines
    parts = re.split(r",|\n", skills_block)
    skills = [p.strip() for p in parts if len(p.strip()) > 1]
    return skills[:20]


# ---------------- EXPERIENCE ----------------

def find_experience(text):
    block = extract_section(text, "Experience")
    return clean_lines(block, min_len=8)


# ---------------- PROJECTS ----------------

def find_projects(text):
    block = extract_section(text, "Projects")
    return clean_lines(block, min_len=8)


# ---------------- EDUCATION ----------------

def find_education(text):
    block = extract_section(text, "Education")
    return clean_lines(block, min_len=6)


# ---------------- MAIN PARSER ----------------

def parse_resume(path):
    text = read_pdf(path)

    return {
        "name": find_name(text),
        "email": find_email(text),
        "phone": find_phone(text),
        "skills": find_skills(text),
        "experience": find_experience(text),
        "projects": find_projects(text),
        "education": find_education(text),
        "raw_text": text[:10000],  
    }