import sys
import json
import os
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
from bson import ObjectId

load_dotenv()

# Load embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")
index = faiss.IndexFlatL2(384)

def load_data(db, user_object_id):
    """
    Fetch combined profile & resume for a given user.
    """
    profile = db.combineddatas.find_one({"userId": user_object_id})
    resume = db.resumedatas.find_one({"userId": user_object_id})
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
    """
    Converts text → embedding vector
    """
    return model.encode([text])[0].astype("float32")

def main():

    # ----------- Validate userId argument ----------- #
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Missing userId"}))
        return

    raw_user_id = sys.argv[1]

    # Convert string → ObjectId
    try:
        user_object_id = ObjectId(raw_user_id)
    except Exception:
        print(json.dumps({"success": False, "error": "Invalid ObjectId"}))
        return

    # ----------- Connect MongoDB ----------- #
    mongo_url = os.getenv("MONGODB_CONNECTION")
    if not mongo_url:
        print(json.dumps({"success": False, "error": "Missing MONGODB_CONNECTION"}))
        return

    client = MongoClient(mongo_url)
    db = client["Final_year_project"]

    # ----------- Load mongo data ----------- #
    profile, resume = load_data(db, user_object_id)

    if not profile:
        print(json.dumps({"success": False, "error": "Combined profile missing"}))
        return

    if not resume:
        print(json.dumps({"success": False, "error": "Resume data missing"}))
        return

    # ----------- Build text data ----------- #
    profile_text = build_profile_text(profile)
    resume_text = build_resume_text(resume)

    # ----------- Embeddings ----------- #
    profile_vec = embed(profile_text)
    resume_vec = embed(resume_text)

    index.add(np.array([profile_vec]))
    index.add(np.array([resume_vec]))

    # ----------- Final output ----------- #
    print(json.dumps({"success": True, "message": "Embeddings generated"}))

main()
