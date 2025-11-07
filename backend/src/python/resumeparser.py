"Here the resume parsing will be happens  and sends the parsed data to resumeParseData collection directly" 
"sample code"


import re
import os
from typing import Dict
from PyPDF2 import PdfReader

def parse_resume(file_path: str) -> Dict:
    """
    Parses a resume PDF and extracts basic information.
    :param file_path: Path to the uploaded resume file.
    :return: Dictionary with extracted fields.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    text = ""

    try:
        reader = PdfReader(file_path)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    except Exception as e:
        raise RuntimeError(f"Error reading PDF: {e}")

  
    name_match = re.search(r"([A-Z][a-z]+\s[A-Z][a-z]+)", text)
    email_match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    phone_match = re.search(r"\+?\d[\d\s-]{8,}\d", text)

    skills_keywords = [
        "Python", "JavaScript", "Node", "React", "MongoDB", "HTML", "CSS",
        "C++", "SQL", "Machine Learning", "Django", "Flask"
    ]
    found_skills = [skill for skill in skills_keywords if re.search(rf"\b{skill}\b", text, re.IGNORECASE)]

    return {
        "name": name_match.group(1) if name_match else None,
        "email": email_match.group(0) if email_match else None,
        "phone": phone_match.group(0) if phone_match else None,
        "skills": list(set(found_skills)),
        "raw_text": text[:500]  # limit raw text preview
    }


if __name__ == "__main__":
    test_path = "sample_resume.pdf"
    result = parse_resume(test_path)
