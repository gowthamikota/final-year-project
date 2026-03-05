import os
import uuid
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

mongo_client = MongoClient(MONGO_URL)
db = mongo_client[DB_NAME]

embedder = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

VECTOR_DIM = 384

# ---------------- HELPERS ----------------

def embed(text):
    return np.array(list(embedder.embed([text]))[0]).astype("float32")

def load_data(db, user_object_id):
    """Load combined profile and resume data from MongoDB"""
    # Load combined profile data
    profile = db.combineddatas.find_one({"userId": user_object_id})
    
    # Load resume parsed data
    resume = db.resumeparseddatas.find_one({"userId": user_object_id})
    
    return profile, resume

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

    print("\n" + "="*70)
    print("📊 PREPROCESSING - PROFILE DATA SUMMARY")
    print("="*70)
    print(f"User ID: {user_id}")
    print(f"  • GitHub followers: {profile.get('github', {}).get('followers', 0)}")
    print(f"  • LeetCode solved: {profile.get('leetcode', {}).get('totalSolved', 0)}")
    print(f"  • Resume skills: {len(resume.get('skills', []))}")
    print("="*70 + "\n")

    g = profile.get("github", {})
    lc = profile.get("leetcode", {})
    cf = profile.get("codeforces", {})
    cc = profile.get("codechef", {})

    # Enhanced GitHub description with new metrics
    github_desc = f"""
    GitHub Profile: 
    - Followers {g.get('followers',0)} Stars {g.get('totalStars',0)} Forks {g.get('totalForks',0)}
    - Total Commits {g.get('totalCommits',0)} Average {g.get('avgCommitsPerRepo',0)} per repo
    - Active Repos {g.get('activeRepositories',0)} of {g.get('publicRepos',0)}
    - Commit Frequency {g.get('commitFrequency','low')} with {g.get('contributionConsistency',0)}% consistency
    - Documentation Quality {g.get('documentationQuality',0)}% with {g.get('repositoriesWithREADME',0)} README files
    - Project Complexity {g.get('projectComplexity',0)}% Languages {len(g.get('topLanguages',[]))}
    - Collaboration Score {g.get('collaborationScore',0)}% with {g.get('totalPRs',0)} PRs
    """

    # Generate dynamic activity description based on actual metrics
    activity_parts = []
    
    if g.get('followers', 0) > 0:
        activity_parts.append(f"GitHub: {g.get('followers', 0)} followers, {g.get('totalCommits', 0)} commits")
    
    if lc.get('totalSolved', 0) > 0:
        activity_parts.append(f"LeetCode: {lc.get('totalSolved', 0)} problems solved, {lc.get('contestsAttended', 0)} contests")
    
    if cf.get('rating', 0) > 0:
        activity_parts.append(f"Codeforces: {cf.get('rating', 0)} rating")
    
    if cc.get('rating', 0) > 0:
        activity_parts.append(f"CodeChef: {cc.get('rating', 0)} rating")
    
    if len(resume.get('skills', [])) > 0:
        activity_parts.append(f"{len(resume.get('skills', []))} technical skills")
    
    activity_desc = " | ".join(activity_parts) if activity_parts else "Limited coding platform activity"

    blocks = {
        "github": github_desc,
        "leetcode": f"Solved {lc.get('totalSolved',0)} Ranking {lc.get('ranking',0)}",
        "codeforces": f"Rating {cf.get('rating',0)} Max {cf.get('maxRating',0)}",
        "codechef": f"Rating {cc.get('rating',0)} Stars {cc.get('stars',0)}",
        "resume": f"Skills {' '.join(resume.get('skills',[]))}",
        "activity": activity_desc
    }
    
    # FILTER: Only embed platforms with actual data (not all zeros)
    platforms_to_embed = {}
    
    if g.get('followers', 0) > 0 or g.get('totalStars', 0) > 0 or g.get('totalPRs', 0) > 0:
        platforms_to_embed['github'] = blocks['github']
    
    if lc.get('totalSolved', 0) > 0:
        platforms_to_embed['leetcode'] = blocks['leetcode']
    
    if cf.get('rating', 0) > 0 or cf.get('maxRating', 0) > 0:
        platforms_to_embed['codeforces'] = blocks['codeforces']
    
    if cc.get('rating', 0) > 0 or cc.get('stars', 0) > 0:
        platforms_to_embed['codechef'] = blocks['codechef']
    
    if resume.get('skills', []):
        platforms_to_embed['resume'] = blocks['resume']
    
    # Always include activity
    platforms_to_embed['activity'] = blocks['activity']
    
    print("\n" + "="*70)
    print("🔄 EMBEDDING GENERATION")
    print("="*70)
    for platform, text in platforms_to_embed.items():
        print(f"  ✓ {platform}: {text}")
    
    # Show skipped platforms
    skipped = set(blocks.keys()) - set(platforms_to_embed.keys())
    if skipped:
        print("\n  Skipped platforms:")
        for platform in skipped:
            print(f"  ✗ {platform}: SKIPPED (no data)")
    print("="*70 + "\n")

    # Remove old embeddings for this user
    db.embeddings.delete_many({"userId": user_id})

    for platform, text in platforms_to_embed.items():
        vector = embed(text).tolist()

        db.embeddings.insert_one({
            "userId": user_id,
            "platform": platform,
            "vector": vector,
            "updatedAt": datetime.utcnow()
        })

    return {
        "success": True,
        "message": "Embeddings stored using FAISS-compatible format"
    }