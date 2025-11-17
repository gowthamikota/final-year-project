import sys
import json
import os
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss

load_dotenv()

model = SentenceTransformer("all-MiniLM-L6-v2")
index = faiss.IndexFlatL2(384)  

def load_data(db, user_id):
    profile = db.combineddatas.find_one({"userId": user_id})
    resume = db.resumeparseddatas.find_one({"userId": user_id})
    return profile, resume

def build_profile_text(profile):
    return f"""
    Codeforces rating {profile['codeforces']['rating']},
    Codechef rating {profile['codechef']['rating']},
    Github stars {profile['github']['totalStars']} commits {profile['github']['totalCommits']},
    LeetCode solved {profile['leetcode']['totalSolved']}
    """

def build_resume_text(resume):
    return f"""
    Skills: {', '.join(resume.get('skills', []))}
    Experience: {' '.join(resume.get('experience', []))}
    Projects: {' '.join(resume.get('projects', []))}
    """

def embed(text):
    return model.encode([text])[0].astype("float32")

def main():

    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Missing userId"}))
        return

    user_id = sys.argv[1]
    mongo_url = os.getenv("MONGODB_CONNECTION")
    if not mongo_url:
        print(json.dumps({"success": False, "error": "Missing MONGODB_CONNECTION"}))
        return

    client = MongoClient(mongo_url)
    db = client["Final_year_project"]

    profile, resume = load_data(db, user_id)

    if not profile:
        print(json.dumps({"success": False, "error": "Combined profile missing"}))
        return

    if not resume:
        print(json.dumps({"success": False, "error": "Resume data missing"}))
        return

    profile_text = build_profile_text(profile)
    resume_text = build_resume_text(resume)

    profile_vec = embed(profile_text)
    resume_vec = embed(resume_text)


    index.add(np.array([profile_vec]))
    index.add(np.array([resume_vec]))

    print(json.dumps({"success": True}))

main()
