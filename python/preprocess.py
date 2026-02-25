import os
import uuid
import numpy as np
import faiss
from datetime import datetime, UTC
from dotenv import load_dotenv
from bson import ObjectId
from pymongo import MongoClient
from fastembed import TextEmbedding

load_dotenv()

# ---------------- CONFIG ----------------

MONGO_URL = os.getenv("MONGODB_CONNECTION")
DB_NAME = os.getenv("DB_NAME", "final_year_project")

mongo_client = MongoClient(MONGO_URL)
db = mongo_client[DB_NAME]

embedder = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

VECTOR_DIM = 384

# ---------------- HELPERS ----------------

def embed(text):
    return np.array(list(embedder.embed([text]))[0]).astype("float32")

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

    blocks = {
        "github": f"Followers {g.get('followers',0)} Stars {g.get('totalStars',0)} PRs {g.get('totalPRs',0)}",
        "leetcode": f"Solved {lc.get('totalSolved',0)} Ranking {lc.get('ranking',0)}",
        "codeforces": f"Rating {cf.get('rating',0)} Max {cf.get('maxRating',0)}",
        "codechef": f"Rating {cc.get('rating',0)} Stars {cc.get('stars',0)}",
        "resume": f"Skills {' '.join(resume.get('skills',[]))}",
        "activity": f"Overall coding activity"
    }

    # Remove old embeddings for this user
    db.embeddings.delete_many({"userId": user_id})

    for platform, text in blocks.items():
        vector = embed(text).tolist()

        db.embeddings.insert_one({
            "userId": user_id,
            "platform": platform,
            "vector": vector,
            "updatedAt": datetime.now(UTC)
        })

    return {
        "success": True,
        "message": "Embeddings stored using FAISS-compatible format"
    }