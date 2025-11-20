import sys
import re
import json
from PyPDF2 import PdfReader

def read_pdf(path):
    text = ""
    reader = PdfReader(path)
    for page in reader.pages:
        part = page.extract_text()
        if part:
            text += part + "\n"
    return text

def find_name(text):
    m = re.search(r"\b([A-Z][a-z]{2,}\s[A-Z][a-z]{2,})\b", text)
    return m.group(1) if m else None

def find_email(text):
    m = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return m.group(0) if m else None

def find_phone(text):
    m = re.search(r"\b(\+?\d{1,3}[- ]?)?\d{10}\b", text)
    return m.group(0) if m else None

def find_skills(text):
    m = re.search(r"Skills\s*:?\s*(.*)", text, re.IGNORECASE)
    if not m:
        return []
    line = m.group(1)
    parts = [p.strip() for p in line.split(",")]
    return [p for p in parts if p]

def find_experience(text):
    exp = []
    items = re.split(r"Experience|EXPERIENCE", text)
    if len(items) < 2:
        return exp
    lines = items[1].split("\n")
    for line in lines:
        if len(line.strip()) > 6:
            exp.append(line.strip())
    return exp[:6]

def find_projects(text):
    pro = []
    items = re.split(r"Projects|PROJECTS", text)
    if len(items) < 2:
        return pro
    lines = items[1].split("\n")
    for line in lines:
        if len(line.strip()) > 6:
            pro.append(line.strip())
    return pro[:6]

def find_education(text):
    edu = []
    items = re.split(r"Education|EDUCATION", text)
    if len(items) < 2:
        return edu
    lines = items[1].split("\n")
    for line in lines:
        if len(line.strip()) > 4:
            edu.append(line.strip())
    return edu[:5]

def parse_resume(path):
    text = read_pdf(path)
    result = {
        "name": find_name(text),
        "email": find_email(text),
        "phone": find_phone(text),
        "skills": find_skills(text),
        "experience": find_experience(text),
        "projects": find_projects(text),
        "education": find_education(text)
    }
    return result

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing file path"}))
        return

    file_path = sys.argv[1]

    try:
        out = parse_resume(file_path)
        print(json.dumps(out))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

main()
