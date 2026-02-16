import React, { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const sampleJobs = [
  {
    id: "frontend-dev",
    title: "Frontend Developer",
    company: "Tech Corp",
    requiredSkills: ["React", "JavaScript", "TypeScript", "CSS", "REST"],
  },
  {
    id: "fullstack",
    title: "Full Stack Engineer",
    company: "Startup Inc",
    requiredSkills: ["Node.js", "React", "MongoDB", "Docker", "CI/CD"],
  },
];

const sampleResume = {
  skills: ["React", "JavaScript", "CSS", "Node.js", "MongoDB", "Git"],
  education: "B.Tech in Computer Science (2025)",
  experience: [
    "Frontend Intern – dashboards with React/Tailwind",
    "Backend Intern – REST APIs with Express/MongoDB",
  ],
};

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
        strokeDasharray={`${score * 2.83} 283`}
        strokeLinecap="round"
      />
    </svg>
    <div className="absolute text-center">
      <div className="text-3xl font-bold text-gray-900">{score}%</div>
      <div className="text-xs text-gray-500">Compatibility</div>
    </div>
  </div>
);

function CompatibilityDashboard() {
  const { user } = useAuth();
  const [selectedJob, setSelectedJob] = useState(sampleJobs[0]);

  const insights = useMemo(() => {
    const matched = selectedJob.requiredSkills.filter((skill) => sampleResume.skills.includes(skill));
    const missing = selectedJob.requiredSkills.filter((skill) => !sampleResume.skills.includes(skill));
    const additional = sampleResume.skills.filter((skill) => !selectedJob.requiredSkills.includes(skill));

    const skillScore = Math.round((matched.length / selectedJob.requiredSkills.length) * 100) || 0;
    const educationScore = 85; // placeholder
    const experienceScore = 78; // placeholder
    const overall = Math.round(skillScore * 0.5 + educationScore * 0.25 + experienceScore * 0.25);

    return {
      matched,
      missing,
      additional,
      scores: {
        overall,
        skills: skillScore,
        education: educationScore,
        experience: experienceScore,
      },
      recommendations: [
        missing.length > 0
          ? `Highlight or add: ${missing.join(", ")}`
          : "Great skill alignment. Emphasize key wins in bullet points.",
        "Tailor your summary to mirror the job title and company context.",
        "Quantify impact in experience bullets (metrics, outcomes).",
      ],
    };
  }, [selectedJob]);

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email || "Student";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl shadow-md p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-semibold uppercase">AI Insights</p>
              <h1 className="text-3xl font-bold text-gray-900">Resume–Job Compatibility</h1>
              <p className="text-gray-600">Hello {displayName}, here are AI-driven comparisons between your resume and the selected job.</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Select Job</label>
              <select
                className="ml-2 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedJob.id}
                onChange={(e) => setSelectedJob(sampleJobs.find((job) => job.id === e.target.value) || sampleJobs[0])}
              >
                {sampleJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} · {job.company}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white border border-gray-100 rounded-2xl shadow-md p-6 flex flex-col items-center justify-center">
            <Gauge score={insights.scores.overall} />
            <div className="mt-4 text-center">
              <p className="text-lg font-semibold text-gray-900">Overall Compatibility</p>
              <p className="text-sm text-gray-600">Aggregated from skills, education, and experience.</p>
            </div>
          </section>

          <section className="bg-white border border-gray-100 rounded-2xl shadow-md p-6 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-semibold uppercase">Job Details</p>
                <h2 className="text-xl font-bold text-gray-900">{selectedJob.title}</h2>
                <p className="text-gray-600">{selectedJob.company}</p>
              </div>
              <div className="text-right text-sm text-gray-500">
                Required skills: {selectedJob.requiredSkills.length}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-800">Required Skills</p>
              <div className="flex flex-wrap gap-2">
                {selectedJob.requiredSkills.map((skill) => (
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
                <p className="text-sm font-semibold text-purple-700">Additional Skills (Resume)</p>
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
                { label: "Skills", value: insights.scores.skills, color: "bg-blue-600" },
                { label: "Education", value: insights.scores.education, color: "bg-emerald-600" },
                { label: "Experience", value: insights.scores.experience, color: "bg-indigo-600" },
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
              {insights.recommendations.map((rec, idx) => (
                <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-blue-50/60 text-sm text-gray-800">
                  {rec}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default CompatibilityDashboard;
