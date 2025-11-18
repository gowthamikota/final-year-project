import os
import sys
import json
import numpy as np
from dotenv import load_dotenv
from pymongo import MongoClient
from sklearn.metrics.pairwise import cosine_similarity
from openai import OpenAI


load_dotenv()

MONGO_URI = os.getenv("MONGODB_CONNECTION")
DB_NAME = os.getenv("DB_NAME", "Final_year_project")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)


mongo_client = MongoClient(MONGO_URI)
db = mongo_client[DB_NAME]

embeddings_collection = db["embeddings"]
finalresults_collection = db["finalresults"]



def embed_text(text):
    """Generate high-quality embedding for ideal profile text."""
    response = client.embeddings.create(
        model="text-embedding-3-large",
        input=text
    )
    return np.array(response.data[0].embedding)


def normalize(score):
    return round((score + 1) * 50, 2)



def compute_similarity(vec1, vec2):
    return cosine_similarity([vec1], [vec2])[0][0]


ideal_profiles = {
    "github": "Strong full stack developer with high quality GitHub projects, clean commits, strong activity and real-world applications.",
    "leetcode": "Consistent DSA problem solver with strong logic, algorithms understanding and medium-hard problem experience.",
    "codeforces": "Competitive programmer with strong thinking ability, contest experience, precise logic and time complexity mastery.",
    "codechef": "Competitive coding experience with strong performance, accuracy and regular participation.",
    "resume": "Professional resume with structured projects, clear impact, good communication and real development experience.",
    "activity": "Highly active programmer with daily/weekly coding activities across platforms, commits and problem solving."
}



def analyze_profile(user_id):

    
    user_embeds = embeddings_collection.find_one({"userId": user_id})

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

    
    ideal_vectors = {k: embed_text(text) for k, text in ideal_profiles.items()}

   
    scores = {}

    for category, uvec in platform_vectors.items():
        similarity = compute_similarity(uvec, ideal_vectors[category])
        scores[category] = normalize(similarity)

    
    final_score = round(sum(scores.values()) / len(scores), 2)

    
    final_doc = {
        "userId": user_id,
        "scores": scores,
        "finalScore": final_score
    }

    finalresults_collection.update_one(
        {"userId": user_id},
        {"$set": final_doc},
        upsert=True
    )

    return {
        "success": True,
        "scores": scores,
        "finalScore": final_score
    }



if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "message": "UserId required"}))
        sys.exit(0)

    user_id = sys.argv[1]
    result = analyze_profile(user_id)
    print(json.dumps(result))



