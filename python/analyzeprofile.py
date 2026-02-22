import os
import numpy as np
from dotenv import load_dotenv
from pymongo import MongoClient
from sklearn.metrics.pairwise import cosine_similarity
from bson import ObjectId
from fastembed import TextEmbedding

load_dotenv()

MONGO_URI = os.getenv("MONGODB_CONNECTION")
DB_NAME = os.getenv("DB_NAME", "final_year_project")

embedder = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")


def embed_text(text):
    return embedder.embed([text])[0]


def normalize(score):
    return round((score + 1) * 50, 2)


def compute_similarity(vec1, vec2):
    return cosine_similarity([vec1], [vec2])[0][0]


mongo_client = MongoClient(MONGO_URI)
db = mongo_client[DB_NAME]

embeddings_collection = db["embeddings"]
finalresults_collection = db["finalresults"]


ideal_profiles = {
    "github": "Strong GitHub profile with followers, stars, forks, pull requests, and diverse languages.",
    "leetcode": "Active problem solver with strong data structures and algorithms skills.",
    "codeforces": "Competitive programmer with high rating and contest participation.",
    "codechef": "Consistent competitive coder with good ratings and contest experience.",
    "resume": "Well-structured resume highlighting skills, projects, and achievements clearly.",
    "activity": "Highly active developer with consistent coding practice across platforms."
}

ideal_vectors = {key: embed_text(val) for key, val in ideal_profiles.items()}


def analyze_profile(user_id):
    try:
        mongo_id = ObjectId(user_id)
    except:
        return {"success": False, "message": "Invalid ObjectId"}

    user_embeds = embeddings_collection.find_one({"userId": mongo_id})

    if not user_embeds:
        return {"success": False, "message": "No embeddings found for user"}

    try:
        platform_vectors = {
            "github": np.array(user_embeds.get("github_embed", [])),
            "leetcode": np.array(user_embeds.get("leetcode_embed", [])),
            "codeforces": np.array(user_embeds.get("codeforces_embed", [])),
            "codechef": np.array(user_embeds.get("codechef_embed", [])),
            "resume": np.array(user_embeds.get("resume_embed", [])),
            "activity": np.array(user_embeds.get("activity_embed", [])),
        }
    except Exception:
        return {"success": False, "message": "Invalid embedding format"}

    scores = {}

    for category, user_vec in platform_vectors.items():
        if user_vec.size == 0:
            scores[category] = 0
            continue

        similarity = compute_similarity(user_vec, ideal_vectors[category])
        scores[category] = normalize(similarity)

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

    finalresults_collection.update_one(
        {"userId": mongo_id},
        {"$set": {"scores": scores, "finalScore": final_score}},
        upsert=True
    )

    return {
        "success": True,
        "scores": scores,
        "finalScore": final_score
    }