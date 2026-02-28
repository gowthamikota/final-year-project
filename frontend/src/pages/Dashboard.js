import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(1); // Step 1 or Step 2
  const [isPreprocessing, setIsPreprocessing] = useState(false);
  const [preprocessCompleted, setPreprocessCompleted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [detailedAnalysisData, setDetailedAnalysisData] = useState(null);
  const [analysisForm, setAnalysisForm] = useState({
    jobRole: "",
    jobDescription: "",
    resume: null,
    github: "",
    leetcode: "",
    codechef: "",
    codeforces: ""
  });
  const [aiRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dashboard data - will be fetched from backend
  const [dashboardData, setDashboardData] = useState({
    stats: {
      profileStrength: 0,
      avgMatchScore: 0,
      jobsApplied: 0,
      interviews: 0,
      profileViews: 0
    },
    recentAnalyses: [],
    skillGaps: []
  });

  // Individual profile scores
  const [profileScores, setProfileScores] = useState({
    resume: 0,
    github: 0,
    leetcode: 0,
    codechef: 0,
    codeforces: 0
  });

  const skillMetadata = {
    github: "Open Source Contribution",
    leetcode: "Problem Solving & DSA",
    codeforces: "Competitive Programming",
    codechef: "Algorithm Optimization",
    resume: "Resume Quality",
  };

  const getPriorityFromScore = useCallback((score) => {
    if (score < 40) return "High";
    if (score < 60) return "Medium";
    return "Low";
  }, []);

  const buildSkillGaps = useCallback((scores = {}) => {
    return Object.entries(skillMetadata)
      .map(([platform, skill]) => ({ platform, skill, score: Number(scores[platform] || 0) }))
      .filter((item) => item.score < 70)
      .map((item) => ({
        skill: item.skill,
        priority: getPriorityFromScore(item.score),
        currentScore: Math.round(item.score),
      }))
      .sort((a, b) => {
        const order = { High: 0, Medium: 1, Low: 2 };
        return order[a.priority] - order[b.priority];
      });
  }, [getPriorityFromScore]);

  const buildRecentAnalyses = useCallback((history = [], fallbackFinalScore = 0, fallbackUpdatedAt = null) => {
    if (Array.isArray(history) && history.length > 0) {
      return history.map((entry, index) => ({
        id: entry._id || `${index}`,
        role: entry.jobRole || "Profile Analysis",
        company: "Resume + Coding Profiles",
        score: Math.round(Number(entry.finalScore || 0)),
        date: entry.createdAt
          ? new Date(entry.createdAt).toLocaleDateString()
          : new Date().toLocaleDateString(),
      }));
    }

    if (fallbackFinalScore > 0) {
      return [{
        id: "latest",
        role: "Profile Analysis",
        company: "Resume + Coding Profiles",
        score: Math.round(Number(fallbackFinalScore || 0)),
        date: fallbackUpdatedAt
          ? new Date(fallbackUpdatedAt).toLocaleDateString()
          : new Date().toLocaleDateString(),
      }];
    }

    return [];
  }, []);

  const hydrateDashboardFromApi = useCallback((apiResult) => {
    if (!apiResult?.data) return;

    const { finalScore = 0, scores = {}, updatedAt } = apiResult.data;
    
    // DEBUG: Log actual scores received from API
    console.log("🔍 API Scores Received:", scores);
    console.log("🔍 Final Score:", finalScore);
    
    const normalizedScores = {
      resume: Number(scores.resume || 0),
      github: Number(scores.github || 0),
      leetcode: Number(scores.leetcode || 0),
      codechef: Number(scores.codechef || 0),
      codeforces: Number(scores.codeforces || 0),
    };

    console.log("🔍 Normalized Scores:", normalizedScores);

    const scoreValues = Object.values(normalizedScores);
    const avgScore = scoreValues.length
      ? scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length
      : 0;

    const recentAnalyses = buildRecentAnalyses(apiResult.history, finalScore, updatedAt);
    const skillGaps = buildSkillGaps(normalizedScores);
    
    console.log("🔍 Skill Gaps Generated:", skillGaps);

    setProfileScores(normalizedScores);
    setDashboardData({
      stats: {
        profileStrength: Math.round(avgScore),
        avgMatchScore: Math.round(Number(finalScore || 0)),
        jobsApplied: 0,
        interviews: 0,
        profileViews: 0,
      },
      recentAnalyses,
      skillGaps,
    });
  }, [buildRecentAnalyses, buildSkillGaps]);

  // Fetch dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?._id) return;
      
      try {
        setIsLoading(true);
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        
        // Fetch analysis results
        const analysisResponse = await fetch(`${API_URL}/analysis/${user._id}`, {
          credentials: 'include',
        });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          if (analysisData.success && analysisData.data) {
            hydrateDashboardFromApi(analysisData);
          }
        }
        // If no analysis data, stats remain at 0 (initial state)
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, hydrateDashboardFromApi]);

  const handleAnalysisNext = (e) => {
    e.preventDefault();
    
    // Validate step 1
    if (analysisStep === 1) {
      if (!analysisForm.jobRole || !analysisForm.jobDescription || !analysisForm.resume) {
        alert("Please fill in all fields");
        return;
      }
      // Move to step 2
      setAnalysisStep(2);
    }
  };

  const handleAnalysisSubmit = async (e) => {
    e.preventDefault();
    
    // Validate step 2
    if (analysisStep === 2) {
      if (!analysisForm.github && !analysisForm.leetcode && !analysisForm.codechef && !analysisForm.codeforces) {
        alert("Please provide at least one profile URL");
        return;
      }
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      // Build profileUrls payload
      const profileUrls = [];
      if (analysisForm.github) profileUrls.push({ profile: 'github', profileUrl: analysisForm.github });
      if (analysisForm.leetcode) profileUrls.push({ profile: 'leetcode', profileUrl: analysisForm.leetcode });
      if (analysisForm.codechef) profileUrls.push({ profile: 'codechef', profileUrl: analysisForm.codechef });
      if (analysisForm.codeforces) profileUrls.push({ profile: 'codeforces', profileUrl: analysisForm.codeforces });

      // Create form data: include resume + profileUrls
      const formData = new FormData();
      formData.append('resume', analysisForm.resume);
      formData.append('profileUrls', JSON.stringify(profileUrls));

      // Preprocess via resume/upload
      setIsPreprocessing(true);
      const response = await fetch(`${API_URL}/resume/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPreprocessCompleted(true);
          alert(`✅ Resume uploaded!\n\n⏳ Profiles are being scraped in the background...\nThis may take 20-30 seconds.\n\nYou can close this and click "Get Score" in a moment.`);
          
          // Wait 10 seconds before trying analysis (gives n8n time to scrape)
          console.log("Waiting for profile scraping...");
          await new Promise(resolve => setTimeout(resolve, 10000));
          
          // Then wait for preprocessor to complete
          let preprocessSucceeded = false;
          let retries = 0;
          while (retries < 5 && !preprocessSucceeded) {
            try {
              setIsAnalyzing(true);
              console.log(`Attempt ${retries + 1}: Triggering analysis...`);
              
              const analysisResponse = await fetch(`${API_URL}/analysis/run`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: user._id, jobRole: analysisForm.jobRole }),
              });
              
              if (analysisResponse.ok) {
                const analysisResult = await analysisResponse.json();
                if (analysisResult.success) {
                  preprocessSucceeded = true;
                  setAnalysisCompleted(true);
                  alert('✅ Analysis completed successfully!\n\nClick "Get Score" to view your results.');
                } else {
                  throw new Error(analysisResult.error || 'Analysis failed');
                }
              } else {
                throw new Error('Analysis request failed');
              }
            } catch (analysisError) {
              console.warn(`Analysis attempt ${retries + 1} failed:`, analysisError.message);
              retries++;
              if (retries < 5) {
                console.log(`Waiting 5 seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
              }
            } finally {
              setIsAnalyzing(false);
            }
          }
          
          if (!preprocessSucceeded) {
            alert(`⏳ Profile scraping is still in progress.\n\nClick "Get Score" button in 10-20 seconds to retrieve your analysis.`);
          }
        } else {
          throw new Error(result.error || 'Preprocess failed');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Backend error response:', response.status, errorData);
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error("Error during preprocess:", error);
      alert(`⚠️ Issue during setup:\n\n${error.message}\n\nPlease try clicking "Get Score" in 30 seconds.`);
    } finally {
      setIsPreprocessing(false);
    }
  };

  const handleGetScores = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/analysis/${user._id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch scores');
      const result = await response.json();
      if (result.success && result.data) {
        hydrateDashboardFromApi(result);
        
        // Close the modal and show success message
        setShowAnalysisModal(false);
        setAnalysisStep(1);
        setPreprocessCompleted(false);
        setAnalysisCompleted(false);
        
        alert(`✅ Scores loaded successfully!\n\nOverall Score: ${Math.round(Number(result.data.finalScore || 0))}/100\n\nCheck the dashboard for detailed breakdown.`);
      }
    } catch (err) {
      console.error('Get scores error:', err);
      alert('Unable to get scores. Please ensure analysis completed.');
    }
  };

  const handleGetCompleteAnalysis = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/analysis/${user._id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch analysis');
      const result = await response.json();
      if (result.success && result.data) {
        hydrateDashboardFromApi(result);
        
        // Set detailed analysis data and show modal
        setDetailedAnalysisData({
          finalScore: result.data.finalScore,
          scores: result.data.scores,
          suggestions: result.suggestions || 'Suggestions unavailable. Configure GEMINI_API_KEY.',
        });
        
        // Close analysis modal, open detailed analysis modal
        setShowAnalysisModal(false);
        setAnalysisStep(1);
        setPreprocessCompleted(false);
        setAnalysisCompleted(false);
        setShowDetailedAnalysis(true);
      }
    } catch (err) {
      console.error('Get analysis error:', err);
      alert('Unable to get detailed analysis. Please ensure analysis completed.');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAnalysisForm({ ...analysisForm, resume: file });
    }
  };

  const getStatusColor = (score) => {
    if (score >= 90) return "bg-green-100 text-green-800";
    if (score >= 80) return "bg-green-50 text-green-700";
    if (score >= 70) return "bg-yellow-50 text-yellow-700";
    if (score >= 60) return "bg-orange-50 text-orange-700";
    return "bg-red-50 text-red-700";
  };

  const getStatusText = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Work";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, subtitle, icon, trend }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-sm font-medium mt-2 ${trend.value > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value > 0 ? '↗' : '↘'} {trend.value}% {trend.period}
            </p>
          )}
        </div>
        <div className="text-2xl text-blue-600">{icon}</div>
      </div>
    </div>
  );

  const ProgressBar = ({ percentage, color = "blue" }) => {
    const colorClasses = {
      blue: "bg-blue-600",
      green: "bg-green-600",
      yellow: "bg-yellow-500",
      red: "bg-red-600"
    };

    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-3"
              >
                <span className="mr-2">←</span> Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Career Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, <span className="font-semibold text-blue-600">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.email || "User"}
                </span>
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button 
                onClick={() => setShowAnalysisModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                + New Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          <StatCard 
            title="Profile Completeness" 
            value={`${dashboardData.stats.profileStrength}%`}
            subtitle="Complete your profile to improve"
            icon="💪"
          />
          <StatCard 
            title="Overall Score" 
            value={`${dashboardData.stats.avgMatchScore}%`}
            subtitle="Based on all platforms"
            icon="🎯"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Analyses */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Recent Analyses</h2>
                <p className="text-gray-600 mt-1">Your latest resume compatibility results</p>
              </div>
              <div className="p-6">
                {dashboardData.recentAnalyses.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {dashboardData.recentAnalyses.slice(0, 5).map((analysis) => (
                        <div key={analysis.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors duration-200 border border-gray-100">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(analysis.score)} font-bold text-lg`}>
                              {analysis.score}%
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{analysis.role}</h3>
                              <p className="text-gray-600 text-sm">{analysis.company}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(analysis.score)}`}>
                              {getStatusText(analysis.score)}
                            </span>
                            <p className="text-gray-500 text-sm mt-1">{analysis.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setShowAnalysisModal(true)}
                      className="w-full mt-6 py-3 text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-colors duration-200"
                    >
                      Run New Analysis →
                    </button>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">📊</div>
                    <p className="text-gray-700 font-medium mb-2">No analyses yet</p>
                    <p className="text-gray-500 text-sm mb-6">Run your first profile analysis to see results here</p>
                    <button 
                      onClick={() => setShowAnalysisModal(true)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors inline-flex items-center gap-2"
                    >
                      <span>+</span> Start Analysis
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Skill Gap Analysis */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Skill Gap Analysis</h2>
                <p className="text-gray-600 mt-1">Skills to improve for better matches</p>
              </div>
              <div className="p-6">
                {dashboardData.skillGaps.length > 0 ? (
                  <>
                    <div className="space-y-6">
                      {dashboardData.skillGaps.map((skill, index) => (
                        <div key={index} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="font-semibold text-gray-900">{skill.skill}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                skill.priority === 'High' ? 'bg-red-100 text-red-800' :
                                skill.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {skill.priority} Priority
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{skill.currentScore}%</span>
                          </div>
                          <ProgressBar 
                            percentage={skill.currentScore} 
                            color={skill.currentScore >= 60 ? 'yellow' : skill.currentScore >= 40 ? 'red' : 'red'}
                          />
                          <p className="text-xs text-gray-500">Target: 70% | Gap: {70 - skill.currentScore}%</p>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-6 py-3 text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-colors duration-200">
                      Explore Learning Resources →
                    </button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">🎉</div>
                    <p className="text-gray-700 font-medium">No significant gaps detected!</p>
          
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-8">
            {/* Profile Completeness */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Profile Completeness</h2>
                <p className="text-gray-600 mt-1">Boost your match scores</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">Resume</span>
                      <span className={`font-semibold ${profileScores.resume > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                        {profileScores.resume}%
                      </span>
                    </div>
                    <ProgressBar percentage={profileScores.resume} color={profileScores.resume >= 70 ? 'green' : profileScores.resume >= 40 ? 'yellow' : 'red'} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">GitHub Profile</span>
                      <span className={`font-semibold ${profileScores.github > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                        {profileScores.github}%
                      </span>
                    </div>
                    <ProgressBar percentage={profileScores.github} color={profileScores.github >= 70 ? 'green' : profileScores.github >= 40 ? 'yellow' : 'red'} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">LeetCode Profile</span>
                      <span className={`font-semibold ${profileScores.leetcode > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                        {profileScores.leetcode}%
                      </span>
                    </div>
                    <ProgressBar percentage={profileScores.leetcode} color={profileScores.leetcode >= 70 ? 'green' : profileScores.leetcode >= 40 ? 'yellow' : 'red'} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">CodeChef Profile</span>
                      <span className={`font-semibold ${profileScores.codechef > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                        {profileScores.codechef}%
                      </span>
                    </div>
                    <ProgressBar percentage={profileScores.codechef} color={profileScores.codechef >= 70 ? 'green' : profileScores.codechef >= 40 ? 'yellow' : 'red'} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">Codeforces Profile</span>
                      <span className={`font-semibold ${profileScores.codeforces > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                        {profileScores.codeforces}%
                      </span>
                    </div>
                    <ProgressBar percentage={profileScores.codeforces} color={profileScores.codeforces >= 70 ? 'green' : profileScores.codeforces >= 40 ? 'yellow' : 'red'} />
                  </div>
                </div>
                <button className="w-full mt-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-medium transition-colors duration-200">
                  Complete Your Profile
                </button>
              </div>
            </div>

            {/* Job Recommendations and Recent Activity removed as requested */}
          </div>
        </div>

        {/* AI Recommendations Section */}
        {aiRecommendations.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">AI Recommendations</h2>
              <p className="text-gray-600 mt-1">Actionable feedback to improve your resume alignment</p>
            </div>
            <div className="space-y-3">
              {aiRecommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  <p className="text-gray-800 text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Modal */}
        {showAnalysisModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    {analysisStep === 1 ? (
                      <>
                        <h2 className="text-2xl font-bold text-gray-900">New Resume Analysis</h2>
                        <p className="text-gray-600 mt-1">Upload your resume and job details for AI-powered insights</p>
                      </>
                    ) : (
                      <>
                        <h2 className="text-2xl font-bold text-gray-900">Social Profiles</h2>
                        <p className="text-gray-600 mt-1">Add your professional profile links to enhance analysis</p>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowAnalysisModal(false);
                      setAnalysisStep(1);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>

              <form onSubmit={analysisStep === 1 ? handleAnalysisNext : handleAnalysisSubmit} className="p-6 space-y-6">
                {analysisStep === 1 ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Role/Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={analysisForm.jobRole}
                        onChange={(e) => setAnalysisForm({ ...analysisForm, jobRole: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Senior Frontend Developer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Job Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        value={analysisForm.jobDescription}
                        onChange={(e) => setAnalysisForm({ ...analysisForm, jobDescription: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Paste the complete job description here..."
                        rows={8}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Resume <span className="text-red-500">*</span>
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                        <input
                          type="file"
                          required
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="resume-upload"
                        />
                        <label htmlFor="resume-upload" className="cursor-pointer">
                          <div className="text-gray-600">
                            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="mt-2 text-sm font-medium text-blue-600">
                              {analysisForm.resume ? analysisForm.resume.name : "Click to upload"}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">PDF, DOC, or DOCX (max 5MB)</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAnalysisModal(false)}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg transition-colors"
                      >
                        Next →
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-4">
                      <p className="text-sm text-blue-900">
                        <span className="font-semibold">Job Role:</span> {analysisForm.jobRole}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        GitHub Profile URL
                      </label>
                      <input
                        type="url"
                        value={analysisForm.github}
                        onChange={(e) => setAnalysisForm({ ...analysisForm, github: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://github.com/username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        LeetCode Profile URL
                      </label>
                      <input
                        type="url"
                        value={analysisForm.leetcode}
                        onChange={(e) => setAnalysisForm({ ...analysisForm, leetcode: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://leetcode.com/username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CodeChef Profile URL
                      </label>
                      <input
                        type="url"
                        value={analysisForm.codechef}
                        onChange={(e) => setAnalysisForm({ ...analysisForm, codechef: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://codechef.com/users/username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Codeforces Profile URL
                      </label>
                      <input
                        type="url"
                        value={analysisForm.codeforces}
                        onChange={(e) => setAnalysisForm({ ...analysisForm, codeforces: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://codeforces.com/profile/username"
                      />
                    </div>

                    <p className="text-sm text-gray-600 pt-2">
                      💡 <span className="font-medium">Tip:</span> Adding social profiles helps us get a complete picture of your skills and experience.
                    </p>

                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setAnalysisStep(1)}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                      >
                        ← Back
                      </button>
                      {!preprocessCompleted && (
                        <button
                          type="submit"
                          disabled={isPreprocessing}
                          className={`flex-1 px-6 py-3 rounded-xl font-medium shadow-lg transition-colors ${isPreprocessing ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                        >
                          {isPreprocessing ? 'Processing...' : 'Preprocess'}
                        </button>
                      )}
                      {preprocessCompleted && isAnalyzing && (
                        <div className="flex-1 p-3 bg-blue-50 border border-blue-200 rounded-xl text-center text-blue-700 font-medium">
                          Running Analysis... ⏳
                        </div>
                      )}
                      {preprocessCompleted && !isAnalyzing && analysisCompleted && (
                        <div className="flex-1 space-y-3">
                          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-center text-green-700 font-medium">Analysis Completed ✅</div>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={handleGetScores}
                              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-lg transition-colors"
                            >
                              Get Score
                            </button>
                            <button
                              type="button"
                              onClick={handleGetCompleteAnalysis}
                              className="px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium shadow-lg transition-colors"
                            >
                              Get Complete Analysis
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Detailed Analysis Modal */}
        {showDetailedAnalysis && detailedAnalysisData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Detailed Analysis & Recommendations</h2>
                    <p className="text-gray-600 mt-1">Insights to improve your profile and resume</p>
                  </div>
                  <button
                    onClick={() => setShowDetailedAnalysis(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                  <div className="text-center">
                    <p className="text-gray-700 font-medium mb-2">Overall Score</p>
                    <p className="text-5xl font-bold text-blue-600">{detailedAnalysisData.finalScore}/100</p>
                    <p className="text-sm text-gray-600 mt-2">
                      {detailedAnalysisData.finalScore >= 80 ? '🎉 Excellent Profile!' :
                       detailedAnalysisData.finalScore >= 60 ? '👍 Good Profile' :
                       detailedAnalysisData.finalScore >= 40 ? '⚠️ Needs Improvement' :
                       '🔴 Significant Gaps'}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>📊</span> Profile Scores Breakdown
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(detailedAnalysisData.scores).map(([platform, score]) => (
                      <div key={platform} className={`p-4 rounded-lg border-2 transition-all ${
                        score >= 70 ? 'bg-green-50 border-green-200' :
                        score >= 40 ? 'bg-yellow-50 border-yellow-200' :
                        'bg-red-50 border-red-200'
                      }`}>
                        <p className="text-sm text-gray-600 capitalize mb-1 font-medium">{platform}</p>
                        <p className={`text-3xl font-bold ${
                          score >= 70 ? 'text-green-600' :
                          score >= 40 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>{score}%</p>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              score >= 70 ? 'bg-green-600' :
                              score >= 40 ? 'bg-yellow-500' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${score}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span>📉</span> Gaps Identified
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(detailedAnalysisData.scores)
                      .filter(([_, score]) => score < 70)
                      .map(([platform, score]) => (
                        <div key={platform} className="flex items-center justify-between p-3 bg-white rounded-lg">
                          <span className="text-gray-700 font-medium capitalize">{platform}</span>
                          <span className="text-red-600 font-bold">{70 - score}% gap</span>
                        </div>
                      ))}
                    {Object.entries(detailedAnalysisData.scores).filter(([_, score]) => score < 70).length === 0 && (
                      <p className="text-green-700 text-center py-4">✅ No significant gaps detected!</p>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span>💡</span> AI-Powered Recommendations & Improvements
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed bg-white p-4 rounded-lg">
                      {detailedAnalysisData.suggestions}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowDetailedAnalysis(false)}
                  className="w-full py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-medium transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;