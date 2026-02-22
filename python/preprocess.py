import os
import json
from pymongo import MongoClient
from datetime import datetime, timezone
from dotenv import load_dotenv
from bson import ObjectId
from fastembed import TextEmbedding

load_dotenv()

MONGO_URL = os.getenv("MONGODB_CONNECTION")
DB_NAME = os.getenv("DB_NAME", "final_year_project")

try:
    embedder = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
except Exception as e:
    print(f"Failed to load embedder: {e}")
    embedder = None


def embed(text):
    """Generate vector embedding using FastEmbed."""
    return embedder.embed([text])[0]   # returns Python list


def load_data(db, user_object_id):
    profile = db.combineddatas.find_one({"userId": user_object_id})
    resume = db.resumedatas.find_one({"userId": user_object_id})
    return profile, resume


def preprocess_user(user_id):
    try:
        user_object_id = ObjectId(user_id)
    except:
        return {"success": False, "error": "Invalid ObjectId"}

    try:
        if not MONGO_URL:
            return {"success": False, "error": "MONGODB_CONNECTION not configured"}

        print(f"[preprocess] Connecting to DB: url={MONGO_URL}, db={DB_NAME}")
        client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]

        # Test connection
        db.command('ping')
    except Exception as e:
        print(f"MongoDB connection error: {e}")
        return {"success": False, "error": f"Database connection failed: {str(e)}"}

    try:
        profile, resume = load_data(db, user_object_id)

        if not profile:
            print(f"[preprocess] No combined profile found for user {user_object_id}")
            print(f"[preprocess] Make sure to upload profiles/resume first")
            return {"success": False, "error": "Combined profile not yet created. Please upload resume and profiles first, then wait 10-20 seconds for data to be scraped."}
        if not resume:
            print(f"[preprocess] No resume found for user {user_object_id}")
            return {"success": False, "error": "Resume data not found. Please upload your resume first."}
    except Exception as e:
        print(f"Error loading user data: {e}")
        return {"success": False, "error": f"Failed to load user data: {str(e)}"}

    g = profile.get("github", {})
    lc = profile.get("leetcode", {})
    cf = profile.get("codeforces", {})
    cc = profile.get("codechef", {})

    # ---------------- GITHUB ----------------
    github_block = f"""
    GitHub Summary:
    Followers: {g.get('followers', 0)}
    Public Repositories: {g.get('publicRepos', 0)}
    Total Stars: {g.get('totalStars', 0)}
    Total Forks: {g.get('totalForks', 0)}
    Pull Requests: {g.get('totalPRs', 0)}
    Issues: {g.get('totalIssues', 0)}
    Top Languages: {', '.join(g.get('topLanguages', []))}
    """

    # ---------------- LEETCODE ----------------
    leetcode_block = f"""
    LeetCode Summary:
    Total Solved: {lc.get('totalSolved', 0)}
    Easy: {lc.get('easySolved', 0)}
    Medium: {lc.get('mediumSolved', 0)}
    Hard: {lc.get('hardSolved', 0)}
    Ranking: {lc.get('ranking', 0)}
    Reputation: {lc.get('reputation', 0)}
    """

    # ---------------- CODEFORCES ----------------
    codeforces_block = f"""
    Codeforces Summary:
    Rating: {cf.get('rating', 0)}
    Max Rating: {cf.get('maxRating', 0)}
    Rank: {cf.get('rank', '')}
    Max Rank: {cf.get('maxRank', '')}
    """

    # ---------------- CODECHEF ----------------
    codechef_block = f"""
    CodeChef Summary:
    Rating: {cc.get('rating', 0)}
    Stars: {cc.get('stars', 0)}
    Contests Participated: {cc.get('contestsParticipated', 0)}
    Total Problems Solved: {cc.get('totalProblemsSolved', 0)}
    Global Rank: {cc.get('globalRank', 0)}
    Country Rank: {cc.get('countryRank', 0)}
    """

    # ---------------- RESUME ----------------
    resume_block = f"""
    Resume Summary:
    Skills: {', '.join(resume.get('skills', []))}
    Experience: {' '.join(resume.get('experience', []))}
    Projects: {' '.join(resume.get('projects', []))}
    """

    # ---------------- ACTIVITY SUMMARY ----------------
    activity_block = f"""
    Overall Coding Activity:
    GitHub Stars: {g.get('totalStars', 0)}
    GitHub PRs: {g.get('totalPRs', 0)}
    LeetCode Problems Solved: {lc.get('totalSolved', 0)}
    Codeforces Rating: {cf.get('rating', 0)}
    CodeChef Rating: {cc.get('rating', 0)}
    """

    # Generate embeddings
    github_vec = embed(github_block)
    leetcode_vec = embed(leetcode_block)
    codeforces_vec = embed(codeforces_block)
    codechef_vec = embed(codechef_block)
    resume_vec = embed(resume_block)
    activity_vec = embed(activity_block)

    try:
        result = db.embeddings.update_one(
            {"userId": user_object_id},
            {
                "$set": {
                    "github_embed": github_vec,
                    "leetcode_embed": leetcode_vec,
                    "codeforces_embed": codeforces_vec,
                    "codechef_embed": codechef_vec,
                    "resume_embed": resume_vec,
                    "activity_embed": activity_vec,
                    "updatedAt": datetime.now(timezone.utc),
                },
                "$setOnInsert": {"createdAt": datetime.now(timezone.utc)},
            },
            "$setOnInsert": {"createdAt": datetime.now(UTC)},
        },
        upsert=True,
    )

    return {
        "success": True,
        "message": "Platform-wise embeddings generated and saved",
    }