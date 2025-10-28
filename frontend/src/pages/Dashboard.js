import React, { useState } from "react";

function Dashboard() {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState("");
  const [score, setScore] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsAnalyzing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock analysis data
    setScore(82);
    setAnalysis({
      strengths: [
        "Strong programming skills match",
        "Relevant project experience",
        "Good educational background"
      ],
      improvements: [
        "Add more cloud computing experience",
        "Include specific framework expertise",
        "Enhance leadership examples"
      ],
      missingKeywords: ["AWS", "React", "Agile"],
      roleSuggestions: ["Full Stack Developer", "Software Engineer", "Frontend Developer"]
    });
    setIsAnalyzing(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreRing = (score) => {
    if (score >= 80) return "from-green-400 to-green-600";
    if (score >= 60) return "from-yellow-400 to-yellow-600";
    return "from-red-400 to-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Profile Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your resume and target role to get detailed compatibility insights
          </p>
        </div>

        {/* Analysis Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 max-w-4xl mx-auto mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Upload Resume
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors duration-200">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  id="resume-upload"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-lg font-medium text-gray-600 mb-1">
                      {file ? file.name : "Choose resume file"}
                    </p>
                    <p className="text-sm text-gray-500">PDF, DOC, or DOCX (Max 5MB)</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Job Role Input */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-3">
                Target Job Role
              </label>
              <div className="relative">
                <input
                  id="role"
                  type="text"
                  placeholder="e.g., Full Stack Developer, Data Scientist, Product Manager"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm text-lg"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Analyze Button */}
            <button
              type="submit"
              disabled={isAnalyzing}
              className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isAnalyzing ? (
                <div className="flex items-center">
                  <div className="w-6 h-6 border-t-2 border-white rounded-full animate-spin mr-3"></div>
                  Analyzing Compatibility...
                </div>
              ) : (
                <div className="flex items-center">
                  Analyze Compatibility
                  <svg className="w-6 h-6 ml-3 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        {score && analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Score Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 lg:col-span-1">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Compatibility Score</h3>
                <div className="relative inline-block">
                  <div className={`w-48 h-48 rounded-full flex items-center justify-center bg-gradient-to-r ${getScoreRing(score)} shadow-lg`}>
                    <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center">
                      <span className={`text-5xl font-bold ${getScoreColor(score)}`}>
                        {score}%
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-6 text-lg text-gray-600">
                  {score >= 80 ? "Excellent match!" : score >= 60 ? "Good potential" : "Needs improvement"}
                </p>
              </div>
            </div>

            {/* Analysis Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Strengths */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-xl font-bold text-green-600 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Key Strengths
                </h3>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start text-gray-700">
                      <span className="text-green-500 mr-2">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                <h3 className="text-xl font-bold text-yellow-600 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {analysis.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start text-gray-700">
                      <span className="text-yellow-500 mr-2">•</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Additional Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Missing Keywords */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Missing Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missingKeywords.map((keyword, index) => (
                      <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Suggested Roles */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                  <h4 className="font-semibold text-gray-800 mb-3">Suggested Roles</h4>
                  <div className="space-y-2">
                    {analysis.roleSuggestions.map((suggestion, index) => (
                      <div key={index} className="flex items-center text-gray-700">
                        <span className="text-blue-500 mr-2">→</span>
                        {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;