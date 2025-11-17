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
    v = {
        "cfRating": clean_num(profiles["codeforces"]["rating"]),
        "cfMax": clean_num(profiles["codeforces"]["maxRating"]),
        "ccRating": clean_num(profiles["codechef"]["rating"]),
        "ccProblems": clean_num(profiles["codechef"]["totalProblemsSolved"]),
        "ghStars": clean_num(profiles["github"]["totalStars"]),
        "ghCommits": clean_num(profiles["github"]["totalCommits"]),
        "kgSolved": clean_num(profiles["kaggle"]["totalSolved"]),
        "kgRank": clean_num(profiles["kaggle"]["ranking"]),
        "lcSolved": clean_num(profiles["leetcode"]["totalSolved"]),
        "lcRank": clean_num(profiles["leetcode"]["ranking"]),
        "resumeExp": clean_num(len(resume.get("experience", []))),
        "resumeProj": clean_num(len(resume.get("projects", []))),
        "resumeSkills": clean_num(len(resume.get("skills", [])))
    }
    return v

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
        print("Missing userId")
        return

    user_id = sys.argv[1]

    mongo_url = os.getenv("MONGODB_CONNECTION")
    if not mongo_url:
        print("Missing MONGO_URL in .env")
        return

    client = MongoClient(mongo_url)
    db = client["Final_year_project"]

    profiles, resume = load_data(db, user_id)

    if not profiles or not resume:
        print("Data missing")
        return

    vec = make_vec(profiles, resume)
    save_vec(db, user_id, vec)

    print(json.dumps({"success": True}))

main()
