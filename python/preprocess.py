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
    return model.encode([text])[0].astype("float32")


def load_data(db, user_object_id):
    profile = db.combineddatas.find_one({"userId": user_object_id})
    resume = db.resumedatas.find_one({"userId": user_object_id})
    return profile, resume



def preprocess_user(user_id):

    try:
        user_object_id = ObjectId(user_id)
    except:
        return {"success": False, "error": "Invalid ObjectId"}

    if not MONGO_URL:
        return {"success": False, "error": "Missing MONGODB_CONNECTION"}

    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]

    profile, resume = load_data(db, user_object_id)

    if not profile:
        return {"success": False, "error": "Combined profile missing"}

    if not resume:
        return {"success": False, "error": "Resume data missing"}

    g = profile["github"]
    lc = profile["leetcode"]
    cf = profile["codeforces"]
    cc = profile["codechef"]

    github_block = f"""
    GitHub Summary:
    Total Stars: {g.get('totalStars')}
    Total Commits: {g.get('totalCommits')}
    Repo Count: {g.get('repoCount')}
    Top Languages: {', '.join(g.get('languages', []))}
    """

    leetcode_block = f"""
    LeetCode Summary:
    Total Solved: {lc.get('totalSolved')}
    Easy: {lc.get('easySolved')}
    Medium: {lc.get('mediumSolved')}
    Hard: {lc.get('hardSolved')}
    """

    codeforces_block = f"""
    Codeforces Summary:
    Rating: {cf.get('rating')}
    Max Rating: {cf.get('maxRating')}
    Rank: {cf.get('rank')}
    """

    codechef_block = f"""
    CodeChef Summary:
    Rating: {cc.get('rating')}
    Stars: {cc.get('stars')}
    Highest Rating: {cc.get('highestRating')}
    """

    resume_block = f"""
    Skills: {', '.join(resume.get('skills', []))}
    Experience: {' '.join(resume.get('experience', []))}
    Projects: {' '.join(resume.get('projects', []))}
    """

    activity_block = f"""
    Overall Coding Activity:
    GitHub Commits: {g.get('totalCommits')}
    LeetCode Problems Solved: {lc.get('totalSolved')}
    Codeforces Rating: {cf.get('rating')}
    CodeChef Rating: {cc.get('rating')}
    """

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
                "updatedAt": datetime.now(UTC),
            },
            "$setOnInsert": {"createdAt": datetime.now(UTC)},
        },
        upsert=True,
    )

    return {"success": True, "message": "Platform-wise embeddings generated and saved"}
