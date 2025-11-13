"Here the resume parsing will be happens  and sends the parsed data to resumeParseData collection directly" 
"sample code"

import sys, re, json
from PyPDF2 import PdfReader

def parse_resume(file_path):
    text = ""
    reader = PdfReader(file_path)
    for page in reader.pages:
        text += page.extract_text() + "\n"

    name = re.search(r"([A-Z][a-z]+\s[A-Z][a-z]+)", text)
    email = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)

    result = {
        "name": name.group(1) if name else None,
        "email": email.group(0) if email else None,
        
    }
    return result

if __name__ == "__main__":
    file_path = sys.argv[1]
    output = parse_resume(file_path)
    print(json.dumps(output)) 

