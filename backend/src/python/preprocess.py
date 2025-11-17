import sys
import json
import os
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def load_data(db, user_id):
    profiles = db.combineddatas.find_one({"userId": user_id})
    resume = db.resumedatas.find_one({"userId": user_id})
    return profiles, resume

def clean_num(x):
    return x if isinstance(x, (int, float)) else 0

def make_vec(profiles, resume):
    return {
        "cfRating": clean_num(profiles["codeforces"].get("rating", 0)),
        "cfMax": clean_num(profiles["codeforces"].get("maxRating", 0)),

        "ccRating": clean_num(profiles["codechef"].get("rating", 0)),
        "ccProblems": clean_num(profiles["codechef"].get("totalProblemsSolved", 0)),

        "ghStars": clean_num(profiles["github"].get("totalStars", 0)),
        "ghCommits": clean_num(profiles["github"].get("totalCommits", 0)),

        "kgSolved": clean_num(profiles["kaggle"].get("totalSolved", 0)),
        "kgRank": clean_num(profiles["kaggle"].get("ranking", 0)),

        "lcSolved": clean_num(profiles["leetcode"].get("totalSolved", 0)),
        "lcRank": clean_num(profiles["leetcode"].get("ranking", 0)),

        "resumeExp": clean_num(len(resume.get("experience", []))),
        "resumeProj": clean_num(len(resume.get("projects", []))),
        "resumeSkills": clean_num(len(resume.get("skills", [])))
    }

def save_vec(db, user_id, vec):
    db.processeddatas.update_one(
        {"userId": user_id},
        {
            "$set": {
                "userId": user_id,
                "vector": vec,
                "updatedAt": datetime.utcnow()
            }
        },
        upsert=True
    )

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

    profiles, resume = load_data(db, user_id)

    if not profiles:
        print(json.dumps({"success": False, "error": "Combined profile missing"}))
        return

    if not resume:
        print(json.dumps({"success": False, "error": "Resume data missing"}))
        return

    vec = make_vec(profiles, resume)
    save_vec(db, user_id, vec)

    print(json.dumps({"success": True}))

main()
