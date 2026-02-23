import os
import json
from pymongo import MongoClient
from datetime import datetime, UTC
from dotenv import load_dotenv
from bson import ObjectId
from pymongo import MongoClient
from fastembed import TextEmbedding
from qdrant_client import QdrantClient
from qdrant_client.models import (
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)

load_dotenv()

# ---------------- CONFIG ----------------

MONGO_URL = os.getenv("MONGODB_CONNECTION")
DB_NAME = os.getenv("DB_NAME", "final_year_project")


embedder = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

# ---------------- HELPERS ----------------

def embed(text):
    return list(embedder.embed([text]))[0]

# ---------------- MAIN ----------------

def preprocess_user(user_id):
    try:
        user_object_id = ObjectId(user_id)
    except:
        return {"success": False, "error": "Invalid ObjectId"}

    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]

    profile, resume = load_data(db, user_object_id)

    if not profile:
        return {"success": False, "error": "Combined profile missing"}
    if not resume:
        return {"success": False, "error": "Resume data missing"}

    g = profile.get("github", {})
    lc = profile.get("leetcode", {})
    cf = profile.get("codeforces", {})
    cc = profile.get("codechef", {})

    # --------- Richer Embedding Blocks ---------

    blocks = {
        "github": f"""
        GitHub Profile:
        Followers: {g.get('followers',0)}
        Public Repos: {g.get('publicRepos',0)}
        Stars: {g.get('totalStars',0)}
        Forks: {g.get('totalForks',0)}
        PRs: {g.get('totalPRs',0)}
        Issues: {g.get('totalIssues',0)}
        Languages: {', '.join(g.get('topLanguages',[]))}
        """,

        "leetcode": f"""
        LeetCode Profile:
        Total Solved: {lc.get('totalSolved',0)}
        Easy: {lc.get('easySolved',0)}
        Medium: {lc.get('mediumSolved',0)}
        Hard: {lc.get('hardSolved',0)}
        Ranking: {lc.get('ranking',0)}
        Reputation: {lc.get('reputation',0)}
        """,

        "codeforces": f"""
        Codeforces Profile:
        Rating: {cf.get('rating',0)}
        Max Rating: {cf.get('maxRating',0)}
        Rank: {cf.get('rank','')}
        Max Rank: {cf.get('maxRank','')}
        """,

        "codechef": f"""
        CodeChef Profile:
        Rating: {cc.get('rating',0)}
        Stars: {cc.get('stars',0)}
        Contests: {cc.get('contestsParticipated',0)}
        Problems Solved: {cc.get('totalProblemsSolved',0)}
        Global Rank: {cc.get('globalRank',0)}
        Country Rank: {cc.get('countryRank',0)}
        """,

        "resume": f"""
        Resume:
        Skills: {', '.join(resume.get('skills',[]))}
        Experience: {' '.join(resume.get('experience',[]))}
        Projects: {' '.join(resume.get('projects',[]))}
        Education: {' '.join(resume.get('education',[]))}
        """,

        "activity": f"""
        Overall Activity Summary:
        GitHub Stars: {g.get('totalStars',0)}
        GitHub PRs: {g.get('totalPRs',0)}
        LeetCode Solved: {lc.get('totalSolved',0)}
        Codeforces Rating: {cf.get('rating',0)}
        CodeChef Rating: {cc.get('rating',0)}
        """
    }

    # Generate embeddings
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
                "github_embed": github_vec,
                "leetcode_embed": leetcode_vec,
                "codeforces_embed": codeforces_vec,
                "codechef_embed": codechef_vec,
                "resume_embed": resume_vec,
                "activity_embed": activity_vec,
                "updatedAt": datetime.now(UTC),
            },
            "$setOnInsert": {"createdAt": datetime.now(UTC)},
        },
        upsert=True,
    )

    return {
        "success": True,
        "message": "Embeddings refreshed and stored in Qdrant"
    }