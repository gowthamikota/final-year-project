# Final Year Project - AI-Powered Candidate Evaluation System

An intelligent system that analyzes resumes and validates skills using external profile data (GitHub, LeetCode, CodeChef, Codeforces) to provide accurate candidate compatibility scores and recommendations.

## 🚀 Features

- **Resume Parsing**: Extract structured information from PDF resumes
- **Profile Validation**: Verify skills using GitHub, LeetCode, CodeChef, and Codeforces activity
- **AI-Powered Analysis**: Generate compatibility scores and personalized recommendations
- **Job Matching**: Compare candidate skills with job requirements
- **Dashboard**: Visual analytics and insights

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd final-year-project
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

**Required Environment Variables:**
- `MONGODB_CONNECTION`: Your MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `GEMINI_API_KEY` or `OPENAI_API_KEY`: For AI analysis features
- `PYTHON_SERVICE_URL`: Python microservice URL (default: http://localhost:8000)

### 3. Frontend Setup

```bash
cd frontend
npm install
# Edit .env if needed (default points to http://localhost:5000/api)
npm start
```

The frontend will run on `http://localhost:3000`

### 4. Python Microservice Setup

```bash
cd python
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your MongoDB connection
python main.py
```

The Python service will run on `http://localhost:8000`

## 📚 Project Structure

```
final-year-project/
├── backend/          # Node.js/Express backend
│   ├── src/
│   │   ├── config/      # Database and LLM configuration
│   │   ├── middlewares/ # Authentication and file upload
│   │   ├── models/      # MongoDB schemas
│   │   ├── routes/      # API endpoints
│   │   └── services/    # Business logic
│   └── package.json
├── frontend/         # React frontend
│   ├── src/
│   │   ├── context/     # Auth context
│   │   ├── pages/       # Main pages
│   │   └── App.js
│   └── package.json
└── python/           # Python microservice
    ├── main.py          # Flask server
    ├── analyzeprofile.py # Profile scoring
    ├── preprocess.py    # Data preprocessing
    ├── resumeparser.py  # PDF parsing
    └── requirements.txt
```

## 🔄 Workflow

1. **Sign Up / Login**: User creates account
2. **Upload Resume**: User uploads PDF resume
3. **Add Profiles**: User provides GitHub, LeetCode, CodeChef, Codeforces URLs
4. **Profile Scraping**: System scrapes profile data (via n8n webhooks)
5. **Preprocessing**: Python service generates embeddings from profile data
6. **Analysis**: System calculates compatibility scores
7. **Results**: User views scores, strengths, gaps, and recommendations

## 🔌 API Endpoints

### Authentication
- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout

### Resume & Profiles
- `POST /api/resume/upload` - Upload resume and trigger profile scraping
- `GET /api/resume/parsed/:userId` - Get parsed resume data

### Analysis
- `POST /api/analysis/run` - Run profile analysis
- `GET /api/analysis/:userId` - Get analysis results
- `POST /api/analysis/job` - Job-resume compatibility analysis

### Profile Management
- `GET /api/profile` - Get user profile
- `PATCH /api/profile` - Update profile
- `DELETE /api/profile` - Delete profile

## 🧪 Testing

### Prerequisites for Testing
1. Start MongoDB
2. Start backend: `cd backend && npm start`
3. Start Python service: `cd python && python main.py`
4. Start frontend: `cd frontend && npm start`

### Test Workflow
1. Open `http://localhost:3000`
2. Sign up with a new account
3. Navigate to Dashboard → New Analysis
4. Fill in job details and upload resume
5. Add profile URLs (at least one)
6. Click "Preprocess" and wait 20-30 seconds
7. Click "Get Detailed Analysis" to view results

## 🔑 Required API Keys

### Gemini API (Recommended)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to backend `.env` as `GEMINI_API_KEY`

### OpenAI API (Alternative)
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create API key
3. Add to backend `.env` as `OPENAI_API_KEY`

## 🐛 Common Issues

### Issue: "Python service unavailable"
- **Solution**: Ensure Python microservice is running on port 8000
- Check: `python main.py` in the python directory

### Issue: "Database connection failed"
- **Solution**: Verify MongoDB is running and connection string is correct
- Check: `mongod` service status

### Issue: "Resume parsing failed"
- **Solution**: Ensure Python dependencies are installed
- Run: `pip install -r requirements.txt`

### Issue: "Profile scraping takes too long"
- **Solution**: n8n webhooks may take 20-30 seconds to complete
- Wait and retry "Get Score" button after scraping completes

### Issue: "No embeddings found"
- **Solution**: Preprocessing requires combined profile data
- Ensure profiles are scraped before running analysis

## 📝 Environment Variables Summary

| Variable | Location | Required | Description |
|----------|----------|----------|-------------|
| `MONGODB_CONNECTION` | Backend + Python | ✅ | MongoDB connection string |
| `JWT_SECRET` | Backend | ✅ | JWT secret key |
| `GEMINI_API_KEY` | Backend | ⚠️ | Google Gemini API key (recommended) |
| `OPENAI_API_KEY` | Backend | ⚠️ | OpenAI API key (alternative) |
| `PYTHON_SERVICE_URL` | Backend | ✅ | Python service URL |
| `CLIENT_URL` | Backend | ✅ | Frontend URL for CORS |
| `PORT` | Backend | ✅ | Backend server port |
| `REACT_APP_API_URL` | Frontend | ✅ | Backend API URL |
| `N8N_WEBHOOK_BASE_URL` | Backend | ⚠️ | n8n webhook base URL |

⚠️ = Optional but recommended for full functionality

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- Your Name
- Team Members

## 🙏 Acknowledgments

- n8n for profile scraping workflows
- OpenAI/Google for AI capabilities
- FastEmbed for embeddings
