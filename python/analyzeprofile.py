import os
import sys
import json
import numpy as np
from dotenv import load_dotenv
from pymongo import MongoClient
from sklearn.metrics.pairwise import cosine_similarity
from bson import ObjectId
from sentence_transformers import SentenceTransformer


load_dotenv()

MONGO_URI = os.getenv("MONGODB_CONNECTION")
DB_NAME = os.getenv("DB_NAME", "Final_year_project")


model = SentenceTransformer("all-MiniLM-L6-v2")


mongo_client = MongoClient(MONGO_URI)
db = mongo_client[DB_NAME]

embeddings_collection = db["embeddings"]
finalresults_collection = db["finalresults"]


def embed_text(text):
    return model.encode([text])[0]


def normalize(score):
    return round((score + 1) * 50, 2)


def compute_similarity(vec1, vec2):
    return cosine_similarity([vec1], [vec2])[0][0]


ideal_profiles = {
    "github": "Strong GitHub portfolio with many commits, stars, and clean projects.",
    "leetcode": "Active problem solver with strong understanding of DSA.",
    "codeforces": "Competitive programmer with rating and contest experience.",
    "codechef": "Good competitive coding performance and consistent ratings.",
    "resume": "Well-structured resume with clear projects and achievements.",
    "activity": "Highly active coder with regular practice."
}


def analyze_profile(user_id):

    try:
        mongo_id = ObjectId(user_id)
    except:
        return {"success": False, "message": "Invalid ObjectId"}


    user_embeds = embeddings_collection.find_one({"userId": mongo_id})

    if not user_embeds:
        return {"success": False, "message": "No embeddings found for user"}

   
    platform_vectors = {
        "github": np.array(user_embeds["github_embed"]),
        "leetcode": np.array(user_embeds["leetcode_embed"]),
        "codeforces": np.array(user_embeds["codeforces_embed"]),
        "codechef": np.array(user_embeds["codechef_embed"]),
        "resume": np.array(user_embeds["resume_embed"]),
        "activity": np.array(user_embeds["activity_embed"]),
    }

   
    ideal_vectors = {k: embed_text(txt) for k, txt in ideal_profiles.items()}

    
    scores = {}

    for category, user_vec in platform_vectors.items():
        similarity = compute_similarity(user_vec, ideal_vectors[category])
        scores[category] = normalize(similarity)

  
    final_score = round(sum(scores.values()) / len(scores), 2)


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


if __name__ == "__main__":
    user_id = sys.argv[1]
    result = analyze_profile(user_id)
    print(json.dumps(result))
