import os
import numpy as np
import faiss
from datetime import datetime
from dotenv import load_dotenv
from bson import ObjectId
from pymongo import MongoClient
from fastembed import TextEmbedding

load_dotenv()

# ---------------- CONFIG ----------------

MONGO_URL = os.getenv("MONGODB_CONNECTION")
DB_NAME = os.getenv("DB_NAME", "final_year_project")
VECTOR_DIM = 384

mongo_client = MongoClient(MONGO_URL)
db = mongo_client[DB_NAME]

embedder = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

# ---------------- HELPERS ----------------

def embed(text: str) -> np.ndarray:
    vector = list(embedder.embed([text]))[0]
    return np.array(vector, dtype="float32")

def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    faiss.normalize_L2(vec1.reshape(1, -1))
    faiss.normalize_L2(vec2.reshape(1, -1))
    index = faiss.IndexFlatIP(VECTOR_DIM)
    index.add(vec1.reshape(1, -1))
    D, _ = index.search(vec2.reshape(1, -1), 1)
    return float(D[0][0])

# ---------------- IDEAL PROFILES ----------------

ideal_profiles = {
    "github": "Strong GitHub profile with followers, stars, pull requests and diverse languages.",
    "leetcode": "Strong data structures and algorithms problem solving skills.",
    "codeforces": "High competitive programming rating with contest participation.",
    "codechef": "Consistent competitive coding performance with good ratings.",
    "resume": "Clear resume with strong technical skills, projects and achievements.",
    "activity": "Highly active developer across coding platforms."
}

# Precompute ideal vectors once (important optimization)
ideal_vectors = {
    key: embed(text)
    for key, text in ideal_profiles.items()
}

# ---------------- MAIN ANALYSIS ----------------

def analyze_profile(user_id: str):

    print("Received userId:", user_id, type(user_id))

    if not isinstance(user_id, str):
        return {"success": False, "message": "Invalid userId format"}

    try:
        ObjectId(user_id)
    except Exception as e:
        return {"success": False, "message": f"Invalid ObjectId: {str(e)}"}

    scores = {}

    for platform, ideal_vector in ideal_vectors.items():

        record = db.embeddings.find_one({
            "userId": user_id,
            "platform": platform
        })

        if not record:
            scores[platform] = 0
            continue

        user_vector = np.array(record["vector"], dtype="float32")

        similarity = cosine_similarity(user_vector, ideal_vector)
        scores[platform] = round(similarity * 100, 2)

    # ---------------- WEIGHTED SCORE ----------------

    weights = {
        "github": 0.20,
        "leetcode": 0.20,
        "codeforces": 0.15,
        "codechef": 0.15,
        "resume": 0.20,
        "activity": 0.10,
    }

    final_score = round(
        sum(scores[k] * weights[k] for k in weights),
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