from flask import Flask, request, jsonify
from analyzerprofile import analyze_profile
from process import preprocess_user
from resumeparser import parse_resume

app = Flask(__name__)


@app.route("/preprocess", methods=["POST"])
def preprocess():
    data = request.get_json()
    user_id = data.get("userId")

    if not user_id:
        return jsonify({"error": "Missing userId"}), 400

    result = preprocess_user(user_id)
    return jsonify(result)


@app.route("/analyze-profile", methods=["POST"])
def analyze():
    data = request.get_json()
    user_id = data.get("userId")

    if not user_id:
        return jsonify({"error": "Missing userId"}), 400

    result = analyze_profile(user_id)
    return jsonify(result)


@app.route("/parse-resume", methods=["POST"])
def resume():
    data = request.get_json()
    file_path = data.get("filePath")

    if not file_path:
        return jsonify({"error": "Missing filePath"}), 400

    result = parse_resume(file_path)
    return jsonify(result)


@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Python Flask API is running"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
