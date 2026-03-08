import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const Gauge = ({ score }) => (
  <div className="relative h-40 w-40 flex items-center justify-center">
    <svg className="transform -rotate-90" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" stroke="#e5e7eb" strokeWidth="10" fill="none" />
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="#2563eb"
        strokeWidth="10"
        fill="none"
        strokeDasharray={`${Math.max(0, Math.min(100, score)) * 2.83} 283`}
        strokeLinecap="round"
      />
    </svg>
    <div className="absolute text-center">
      <div className="text-3xl font-bold text-gray-900">{score}%</div>
      <div className="text-xs text-gray-500">Compatibility</div>
    </div>
  </div>
);

const getConfidenceMeta = (score) => {
  if (score >= 70) return { label: "High", style: "bg-green-100 text-green-700" };
  if (score >= 40) return { label: "Medium", style: "bg-yellow-100 text-yellow-700" };
  return { label: "Low", style: "bg-orange-100 text-orange-700" };
};

const parseSuggestions = (text) => {
  if (!text) return [];
  const lines = text
    .split("\n")
    .map((line) => line.replace(/^[-*\d).\s]+/, "").trim())
    .filter(Boolean);
  return lines.slice(0, 6);
};

function CompatibilityDashboard() {
  const { user } = useAuth();
  const [jobRole, setJobRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isRunningAnalysis, setIsRunningAnalysis] = useState(false);
  const [isLoadingLatest, setIsLoadingLatest] = useState(true);
  const [error, setError] = useState("");
  const [analysisData, setAnalysisData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  const fetchLatestAnalysis = useCallback(async (role = "") => {
    if (!user?._id) return;

    try {
      const query = role ? `?jobRole=${encodeURIComponent(role)}` : "";
      const response = await fetch(`${API_URL}/analysis/${user._id}${query}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          setAnalysisData(null);
          setRecommendations([]);
          return;
        }
        throw new Error("Unable to fetch latest analysis");
      }

      const result = await response.json();
      if (result.success && result.data) {
        setAnalysisData(result.data);
        setRecommendations(parseSuggestions(result.suggestions));
      }
    } catch (fetchError) {
      setError(fetchError.message || "Failed to load analysis");
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setIsLoadingLatest(true);
      await fetchLatestAnalysis();
      setIsLoadingLatest(false);
    };
    load();
  }, [fetchLatestAnalysis]);

  const runAnalysis = async (event) => {
    event.preventDefault();

    if (!jobRole.trim() && !jobDescription.trim()) {
      setError("Enter at least a job role or a job description.");
      return;
    }

    try {
      setError("");
      setIsRunningAnalysis(true);

      const response = await fetch(`${API_URL}/analysis/run`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobRole, jobDescription }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Analysis request failed");
      }

      setAnalysisData(result.data || null);
      await fetchLatestAnalysis(jobRole);
    } catch (runError) {
      setError(runError.message || "Analysis failed");
    } finally {
      setIsRunningAnalysis(false);
    }
  };

  const insights = useMemo(() => {
    const scores = analysisData?.scores || {};
    const skillGaps = analysisData?.skillGaps || {};
    const matched = Array.isArray(skillGaps.matched) ? skillGaps.matched : [];
    const missing = Array.isArray(skillGaps.missing) ? skillGaps.missing : [];
    const additional = Array.isArray(skillGaps.surplus) ? skillGaps.surplus : [];

    return {
      matched,
      missing,
      additional,
      scores: {
        overall: Math.round(Number(analysisData?.finalScore || 0)),
        github: Math.round(Number(scores.github || 0)),
        leetcode: Math.round(Number(scores.leetcode || 0)),
        resume: Math.round(Number(scores.resume || 0)),
      },
      confidenceScore: Number(analysisData?.confidenceScore || 0),
      role: analysisData?.role || "unknown",
    };
  }, [analysisData]);

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email || "Student";

  const confidence = getConfidenceMeta(insights.confidenceScore);

  if (isLoadingLatest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading compatibility data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-md p-6 flex flex-col gap-3">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-sm text-blue-600 font-semibold uppercase">AI Insights</p>
              <h1 className="text-3xl font-bold text-gray-900">Resume-Job Compatibility</h1>
              <p className="text-gray-600">Hello {displayName}, run analysis with a role and job description to get live compatibility scores.</p>
            </div>

            <form onSubmit={runAnalysis} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Target Job Role</label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  placeholder="Example: Frontend Developer"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Job Description</label>
                <textarea
                  rows={4}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full JD for better matching"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isRunningAnalysis}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {isRunningAnalysis ? "Running Analysis..." : "Run Compatibility Analysis"}
                </button>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
            </form>
          </div>
        </header>

        {!analysisData && (
          <section className="bg-white border border-gray-100 rounded-2xl shadow-md p-6 text-center">
            <p className="text-gray-700 font-semibold">No analysis available yet</p>
            <p className="text-gray-500 text-sm mt-1">Run analysis above to view your real score breakdown.</p>
          </section>
        )}

        {analysisData && (
          <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white border border-gray-100 rounded-2xl shadow-md p-6 flex flex-col items-center justify-center">
            <Gauge score={insights.scores.overall} />
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold text-gray-900">Overall Compatibility</p>
              <p className="text-sm text-gray-600">Detected role: {insights.role.toUpperCase()}</p>
            </div>
          </section>

          <section className="bg-white border border-gray-100 rounded-2xl shadow-md p-6 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-semibold uppercase">Confidence</p>
                <h2 className="text-xl font-bold text-gray-900">{insights.confidenceScore.toFixed(1)}%</h2>
                <p className="text-gray-600">Reliability of current evaluation data</p>
              </div>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${confidence.style}`}>{confidence.label}</span>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-800">Matched Skills</p>
              <div className="flex flex-wrap gap-2">
                {(insights.matched.length ? insights.matched : ["No matched skills yet"]).map((skill) => (
                  <span key={skill} className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm border border-blue-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="border border-gray-100 rounded-xl p-4 bg-green-50/60">
                <p className="text-sm font-semibold text-green-700">Matched Skills</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-800 list-disc list-inside">
                  {insights.matched.length ? insights.matched.map((skill) => <li key={skill}>{skill}</li>) : <li>No matches yet</li>}
                </ul>
              </div>
              <div className="border border-gray-100 rounded-xl p-4 bg-red-50/60">
                <p className="text-sm font-semibold text-red-700">Missing / Underrepresented</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-800 list-disc list-inside">
                  {insights.missing.length ? insights.missing.map((skill) => <li key={skill}>{skill}</li>) : <li>None</li>}
                </ul>
              </div>
              <div className="border border-gray-100 rounded-xl p-4 bg-purple-50/60">
                <p className="text-sm font-semibold text-purple-700">Additional Skills</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-800 list-disc list-inside">
                  {insights.additional.length ? insights.additional.map((skill) => <li key={skill}>{skill}</li>) : <li>None</li>}
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white border border-gray-100 rounded-2xl shadow-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-semibold uppercase">Section Scores</p>
                <h2 className="text-xl font-bold text-gray-900">Compatibility Breakdown</h2>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { label: "GitHub", value: insights.scores.github, color: "bg-blue-600" },
                { label: "LeetCode", value: insights.scores.leetcode, color: "bg-emerald-600" },
                { label: "Resume", value: insights.scores.resume, color: "bg-indigo-600" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm text-gray-700 mb-1">
                    <span>{item.label}</span>
                    <span className="font-semibold">{item.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.value}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white border border-gray-100 rounded-2xl shadow-md p-6 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-semibold uppercase">AI Feedback</p>
                <h2 className="text-xl font-bold text-gray-900">Actionable Recommendations</h2>
                <p className="text-gray-600 text-sm">Generated to improve alignment with the selected job.</p>
              </div>
            </div>

            <div className="space-y-3">
              {(recommendations.length ? recommendations : (analysisData.skillRecommendations || [])).slice(0, 6).map((rec, idx) => (
                <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-blue-50/60 text-sm text-gray-800">
                  {rec}
                </div>
              ))}
              {!recommendations.length && !(analysisData.skillRecommendations || []).length && (
                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 text-sm text-gray-600">
                  Run analysis with a detailed job description to get stronger recommendations.
                </div>
              )}
            </div>
          </section>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CompatibilityDashboard;
