import os
from datetime import datetime
from dotenv import load_dotenv
from bson import ObjectId
from pymongo import MongoClient
from fastembed import TextEmbedding
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

load_dotenv()

# ---------------- CONFIG ----------------

MONGO_URI = os.getenv("MONGODB_CONNECTION")
DB_NAME = "Final_year_project"

mongo_client = MongoClient(MONGO_URI)
db = mongo_client[DB_NAME]

qdrant = QdrantClient("http://localhost:6333")
COLLECTION_NAME = "user_embeddings"

embedder = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

# ---------------- HELPERS ----------------

def embed(text):
    return list(embedder.embed([text]))[0]

# ---------------- IDEAL PROFILES ----------------

ideal_profiles = {
    "github": "Strong GitHub profile with stars and pull requests",
    "leetcode": "Strong data structures and algorithms problem solving",
    "codeforces": "High competitive programming rating",
    "codechef": "Consistent competitive coding performance",
    "resume": "Clear resume with strong projects and skills",
    "activity": "Highly active developer across platforms"
}

# ---------------- MAIN ANALYSIS ----------------

# ---------------- MAIN ANALYSIS ----------------

def analyze_profile(user_id):
    try:
        ObjectId(user_id)
    except:
        return {"success": False, "message": "Invalid ObjectId"}

    scores = {}

    for platform, ideal_text in ideal_profiles.items():
        ideal_vector = embed(ideal_text)

        try:
            results = qdrant.query_points(
                collection_name=COLLECTION_NAME,
                query=ideal_vector,
                using="vector",
                limit=1,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="userId",
                            match=MatchValue(value=user_id)
                        ),
                        FieldCondition(
                            key="platform",
                            match=MatchValue(value=platform)
                        )
                    ]
                )
            )
        except Exception as e:
            return {"success": False, "message": f"Qdrant search error: {str(e)}"}

        if results.points:
            similarity = results.points[0].score
            scores[platform] = round(similarity * 100, 2)
        else:
            scores[platform] = 0

    weights = {
        "github": 0.20,
        "leetcode": 0.20,
        "codeforces": 0.15,
        "codechef": 0.15,
        "resume": 0.20,
        "activity": 0.10,
    }

    final_score = round(
        sum(scores[k] * weights[k] for k in scores),
        2
    )

    # ---------------- SAVE TO MONGO ----------------

    db.finalresults.update_one(
        {"userId": user_id},
        {
            "$set": {
                "scores": scores,
                "finalScore": final_score,
                "updatedAt": datetime.utcnow()
            }
        },
        upsert=True
    )

    return {
        "success": True,
        "scores": scores,
        "finalScore": final_score
    }