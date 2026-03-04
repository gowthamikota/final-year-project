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

# ---------------- CONFIDENCE SCORE ----------------

def calculate_confidence_score(user_id: str, scores: dict) -> float:
    """
    Calculate confidence score (0-100%) based on:
    1. Number of connected platforms (60% weight)
    2. Activity level across platforms (40% weight)
    
    Formula: confidence = (platforms/5) * 60 + (activity/100) * 40
    """
    
    # Count platforms with actual data (non-zero scores)
    # Exclude 'activity' as it's a derived metric
    platform_keys = ['github', 'leetcode', 'codeforces', 'codechef', 'resume']
    connected_platforms = sum(1 for p in platform_keys if scores.get(p, 0) > 0)
    
    # Calculate platform coverage (0-1)
    platform_coverage = connected_platforms / len(platform_keys)
    
    # Load raw profile data to calculate activity score
    try:
        user_object_id = ObjectId(user_id)
        profile = db.combineddatas.find_one({"userId": user_object_id})
        resume = db.resumeparseddatas.find_one({"userId": user_object_id})
        
        activity_metrics = []
        
        # GitHub activity - Enhanced with new metrics
        if profile and profile.get('github'):
            g = profile['github']
            # Old metrics (basic scoring)
            basic_score = (
                g.get('publicRepos', 0) * 2 +
                g.get('totalStars', 0) * 0.5 +
                g.get('totalPRs', 0) * 1 +
                g.get('followers', 0) * 0.3
            )
            # New enhanced metrics (higher weight for quality signals)
            enhanced_score = (
                g.get('totalCommits', 0) * 0.1 +  # Commit activity
                (20 if g.get('commitFrequency', 'low') in ['high', 'very-high'] else 5) +  # Commit frequency bonus
                g.get('documentationQuality', 0) * 0.3 +  # Documentation quality (README presence)
                g.get('collaborationScore', 0) * 0.2 +  # Forks + PRs collaboration
                g.get('contributionConsistency', 0) * 0.15 +  # Consistent contributions
                g.get('projectComplexity', 0) * 0.1  # Complex projects
            )
            github_activity = min(100, basic_score + enhanced_score)
            activity_metrics.append(github_activity)
        
        # LeetCode activity
        if profile and profile.get('leetcode'):
            lc = profile['leetcode']
            leetcode_activity = min(100, (
                lc.get('totalSolved', 0) * 0.2 +
                lc.get('mediumSolved', 0) * 0.5 +
                lc.get('hardSolved', 0) * 1 +
                lc.get('contestsAttended', 0) * 2
            ))
            activity_metrics.append(leetcode_activity)
        
        # Codeforces activity
        if profile and profile.get('codeforces'):
            cf = profile['codeforces']
            rating = cf.get('rating', 0)
            codeforces_activity = min(100, rating / 30)  # Normalize rating
            activity_metrics.append(codeforces_activity)
        
        # CodeChef activity
        if profile and profile.get('codechef'):
            cc = profile['codechef']
            codechef_activity = min(100, (
                cc.get('rating', 0) / 30 +
                cc.get('contestsParticipated', 0) * 2 +
                cc.get('totalProblemsSolved', 0) * 0.1
            ))
            activity_metrics.append(codechef_activity)
        
        # Resume quality (skills count as proxy)
        if resume and resume.get('skills'):
            resume_activity = min(100, len(resume.get('skills', [])) * 5)
            activity_metrics.append(resume_activity)
        
        # Average activity score across all platforms with data
        activity_score = sum(activity_metrics) / len(activity_metrics) if activity_metrics else 0
        
    except Exception as e:
        print(f"⚠️  Warning: Could not calculate activity metrics: {str(e)}")
        activity_score = 0
    
    # Calculate final confidence score
    confidence = (platform_coverage * 60) + (activity_score / 100 * 40)
    
    print(f"🎯 Confidence Score Calculation:")
    print(f"  Connected platforms: {connected_platforms}/{len(platform_keys)} ({platform_coverage:.1%})")
    print(f"  Activity score: {activity_score:.2f}/100")
    print(f"  Final confidence: {confidence:.2f}%")
    
    return round(confidence, 2)

# ---------------- MAIN ANALYSIS ----------------

def analyze_profile(user_id: str, job_role: str = ""):

    print("Received userId:", user_id, type(user_id))

    if not isinstance(user_id, str):
        return {"success": False, "message": "Invalid userId format"}

    try:
        ObjectId(user_id)
    except Exception as e:
        return {"success": False, "message": f"Invalid ObjectId: {str(e)}"}

    scores = {}

    print(f"🔍 DEBUG - Analyzing profile for user: {user_id}")
    
    for platform, ideal_vector in ideal_vectors.items():

        record = db.embeddings.find_one({
            "userId": user_id,
            "platform": platform
        })

        if not record:
            scores[platform] = 0
            print(f"  ❌ {platform}: No embedding found (score=0)")
            continue

        user_vector = np.array(record["vector"], dtype="float32")

        similarity = cosine_similarity(user_vector, ideal_vector)
        scores[platform] = round(similarity * 100, 2)
        print(f"  ✓ {platform}: similarity={similarity:.4f}, score={scores[platform]}")

    # ---------------- WEIGHTED SCORE ----------------

    weights = {
        "github": 0.20,
        "leetcode": 0.20,
        "codeforces": 0.15,
        "codechef": 0.15,
        "resume": 0.20,
        "activity": 0.10,
    }
    
    # Only count platforms that have data (non-zero scores)
    platforms_with_data = [k for k in weights.keys() if scores[k] > 0]
    
    if platforms_with_data:
        # Recalculate weights based on only provided platforms
        total_weight = sum(weights[k] for k in platforms_with_data)
        normalized_weights = {k: weights[k] / total_weight for k in platforms_with_data}
        
        final_score = round(
            sum(scores[k] * normalized_weights[k] for k in platforms_with_data),
            2
        )
        
        print(f"🔍 DEBUG - Platforms with data: {platforms_with_data}")
        print(f"  Normalized weights: {normalized_weights}")
    else:
        final_score = 0
        print(f"🔍 DEBUG - No platforms with data found")
    
    print(f"🔍 DEBUG - Final weighted score: {final_score}")

    # ---------------- CALCULATE CONFIDENCE SCORE ----------------
    
    confidence_score = calculate_confidence_score(user_id, scores)

    # ---------------- SAVE TO MONGO ----------------

    db.finalresults.update_one(
        {"userId": ObjectId(user_id)},
        {
            "$set": {
                "scores": scores,
                "finalScore": final_score,
                "confidenceScore": confidence_score,
                "updatedAt": datetime.utcnow()
            }
        },
        upsert=True
    )

    db.analysishistories.insert_one(
        {
            "userId": ObjectId(user_id),
            "jobRole": (job_role or "").strip(),
            "scores": scores,
            "finalScore": final_score,
            "confidenceScore": confidence_score,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }
    )

    return {
        "success": True,
        "scores": scores,
        "finalScore": final_score,
        "confidenceScore": confidence_score
    }