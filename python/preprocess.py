import os
import uuid
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
DB_NAME = "Final_year_project"

mongo_client = MongoClient(MONGO_URL)
db = mongo_client[DB_NAME]

qdrant = QdrantClient("http://localhost:6333")
COLLECTION_NAME = "user_embeddings"

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

    profile = db.combineddatas.find_one({"userId": user_object_id})
    resume = db.resumedatas.find_one({"userId": user_object_id})

    if not profile or not resume:
        return {"success": False, "error": "Profile or Resume missing"}

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

    # --------- Delete Old User Vectors ---------

    try:
        qdrant.delete(
            collection_name=COLLECTION_NAME,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="userId",
                        match=MatchValue(value=user_id)
                    )
                ]
            )
        )
    except Exception as e:
        return {"success": False, "error": f"Qdrant delete error: {str(e)}"}

    # --------- Insert Fresh Vectors ---------

    points = []

    for platform, text in blocks.items():
        vector = embed(text)

        points.append(
            PointStruct(
                id=str(uuid.uuid4()),
                vector={"vector": vector},
                payload={
                    "userId": user_id,
                    "platform": platform,
                    "updatedAt": datetime.now(UTC).isoformat()
                }
            )
        )

    try:
        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=points
        )
    except Exception as e:
        return {"success": False, "error": f"Qdrant upsert error: {str(e)}"}

    return {
        "success": True,
        "message": "Embeddings refreshed and stored in Qdrant"
    }