import sys
import json
import os
from pymongo import MongoClient
from datetime import datetime, UTC
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from bson import ObjectId
import numpy as np


load_dotenv()

MONGO_URL = os.getenv("MONGODB_CONNECTION")
DB_NAME = "Final_year_project"


model = SentenceTransformer("all-MiniLM-L6-v2")


def embed(text):
    """Generate vector embedding from text."""
    return model.encode([text])[0].astype("float32")


def load_data(db, user_object_id):
    profile = db.combineddatas.find_one({"userId": user_object_id})
    resume = db.resumedatas.find_one({"userId": user_object_id})
    return profile, resume




def github_text(g):
    return f"""
    GitHub Summary:
    Total Stars: {g.get('totalStars')}
    Total Commits: {g.get('totalCommits')}
    Repo Count: {g.get('repoCount')}
    Top Languages: {', '.join(g.get('languages', []))}
    """


def leetcode_text(lc):
    return f"""
    LeetCode Summary:
    Total Solved: {lc.get('totalSolved')}
    Easy: {lc.get('easySolved')}
    Medium: {lc.get('mediumSolved')}
    Hard: {lc.get('hardSolved')}
    """


def codeforces_text(cf):
    return f"""
    Codeforces Summary:
    Rating: {cf.get('rating')}
    Max Rating: {cf.get('maxRating')}
    Rank: {cf.get('rank')}
    """


def codechef_text(cc):
    return f"""
    CodeChef Summary:
    Rating: {cc.get('rating')}
    Stars: {cc.get('stars')}
    Highest Rating: {cc.get('highestRating')}
    """


def resume_text_block(resume):
    return f"""
    Skills: {', '.join(resume.get('skills', []))}
    Experience: {' '.join(resume.get('experience', []))}
    Projects: {' '.join(resume.get('projects', []))}
    """


def activity_text(profile):
    """Build a text summary of consistency & activity."""
    return f"""
    Overall Coding Activity:
    GitHub Commits: {profile['github'].get('totalCommits')}
    LeetCode Problems Solved: {profile['leetcode'].get('totalSolved')}
    Codeforces Rating: {profile['codeforces'].get('rating')}
    CodeChef Rating: {profile['codechef'].get('rating')}
    """

# ------------------------- MAIN ----------------------------

def main():

    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Missing userId"}))
        return

    raw_user_id = sys.argv[1]

    
    try:
        user_object_id = ObjectId(raw_user_id)
    except Exception:
        print(json.dumps({"success": False, "error": "Invalid ObjectId"}))
        return

    if not MONGO_URL:
        print(json.dumps({"success": False, "error": "Missing MONGODB_CONNECTION"}))
        return

   
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]

    profile, resume = load_data(db, user_object_id)

    if not profile:
        print(json.dumps({"success": False, "error": "Combined profile missing"}))
        return
    
    if not resume:
        print(json.dumps({"success": False, "error": "Resume data missing"}))
        return

    
    github_block = github_text(profile["github"])
    leetcode_block = leetcode_text(profile["leetcode"])
    codeforces_block = codeforces_text(profile["codeforces"])
    codechef_block = codechef_text(profile["codechef"])
    resume_block = resume_text_block(resume)
    activity_block = activity_text(profile)

    
    github_vec = embed(github_block)
    leetcode_vec = embed(leetcode_block)
    codeforces_vec = embed(codeforces_block)
    codechef_vec = embed(codechef_block)
    resume_vec = embed(resume_block)
    activity_vec = embed(activity_block)

   
    db.embeddings.update_one(
        {"userId": user_object_id},
        {
            "$set": {
                "github_embed": github_vec.tolist(),
                "leetcode_embed": leetcode_vec.tolist(),
                "codeforces_embed": codeforces_vec.tolist(),
                "codechef_embed": codechef_vec.tolist(),
                "resume_embed": resume_vec.tolist(),
                "activity_embed": activity_vec.tolist(),
                "updatedAt": datetime.now(UTC)
            },
            "$setOnInsert": {
                "createdAt": datetime.now(UTC)
            }
        },
        upsert=True
    )

    print(json.dumps({"success": True, "message": "Platform-wise embeddings generated and saved"}))


main()
