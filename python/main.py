from fastapi import FastAPI
from pydantic import BaseModel
from analyzeprofile import analyze_profile
from preprocess import preprocess_user
from resumeparser import parse_resume

app = FastAPI()

class UserIdRequest(BaseModel):
    userId: str

class FilePathRequest(BaseModel):
    filePath: str


@app.post("/preprocess")
def preprocess(req: UserIdRequest):
    return preprocess_user(req.userId)


@app.post("/analyze-profile")
def analyze(req: UserIdRequest):
    return analyze_profile(req.userId)


@app.post("/parse-resume")
def resume(req: FilePathRequest):
    return parse_resume(req.filePath)
