import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data - in real app, this would come from API
  const dashboardData = {
    stats: {
      profileStrength: 85,
      avgMatchScore: 78,
      jobsApplied: 12,
      interviews: 4,
      profileViews: 24
    },
    recentAnalyses: [
      { id: 1, role: "Frontend Developer", company: "Tech Corp", score: 92, date: "2024-01-15", status: "Excellent" },
      { id: 2, role: "Full Stack Engineer", company: "Startup Inc", score: 78, date: "2024-01-12", status: "Good" },
      { id: 3, role: "React Developer", company: "Digital Agency", score: 65, date: "2024-01-10", status: "Fair" },
      { id: 4, role: "UI Engineer", company: "Product Co", score: 85, date: "2024-01-08", status: "Very Good" }
    ],
    skillGaps: [
      { skill: "AWS", demand: "High", priority: "High", resources: 3 },
      { skill: "GraphQL", demand: "Medium", priority: "Medium", resources: 2 },
      { skill: "TypeScript", demand: "High", priority: "High", resources: 4 },
      { skill: "Docker", demand: "Medium", priority: "Medium", resources: 3 }
    ],
    jobRecommendations: [
      { id: 1, title: "Senior React Developer", company: "Innovation Labs", match: 94, location: "Remote", salary: "$120k-$140k" },
      { id: 2, title: "Frontend Engineer", company: "Tech Solutions", match: 87, location: "New York, NY", salary: "$110k-$130k" },
      { id: 3, title: "Full Stack Developer", company: "Digital Prime", match: 82, location: "Austin, TX", salary: "$100k-$120k" },
      { id: 4, title: "UI/UX Developer", company: "Creative Minds", match: 79, location: "Remote", salary: "$95k-$115k" }
    ],
    activities: [
      { id: 1, action: "Resume Analysis", description: "Frontend Developer at Tech Corp", time: "2 hours ago", type: "analysis" },
      { id: 2, action: "Profile Updated", description: "Added GitHub integration", time: "1 day ago", type: "update" },
      { id: 3, action: "Skill Assessment", description: "Completed React skills test", time: "2 days ago", type: "assessment" },
      { id: 4, action: "Job Applied", description: "Senior Developer at Startup Inc", time: "3 days ago", type: "application" }
    ]
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    if (score >= 60) return "text-orange-500";
    return "text-red-500";
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
              <h1 className="text-3xl font-bold text-gray-900">Career Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, <span className="font-semibold text-blue-600">{user?.name || "User"}</span>
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-transform duration-200">
                + New Analysis
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Profile Strength" 
            value={`${dashboardData.stats.profileStrength}%`}
            subtitle="Complete your profile"
            icon="💪"
            trend={{ value: 5, period: "this month" }}
          />
          <StatCard 
            title="Avg Match Score" 
            value={`${dashboardData.stats.avgMatchScore}%`}
            subtitle="Across all analyses"
            icon="🎯"
            trend={{ value: 12, period: "this month" }}
          />
          <StatCard 
            title="Jobs Applied" 
            value={dashboardData.stats.jobsApplied}
            subtitle="This month"
            icon="📨"
            trend={{ value: 3, period: "this week" }}
          />
          <StatCard 
            title="Interviews" 
            value={dashboardData.stats.interviews}
            subtitle="Upcoming & completed"
            icon="🤝"
            trend={{ value: 2, period: "this week" }}
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
                <div className="space-y-4">
                  {dashboardData.recentAnalyses.map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors duration-200">
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
                <button className="w-full mt-6 py-3 text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-colors duration-200">
                  View All Analyses →
                </button>
              </div>
            </div>

            {/* Skill Gap Analysis */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Skill Gap Analysis</h2>
                <p className="text-gray-600 mt-1">Skills to improve for better matches</p>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {dashboardData.skillGaps.map((skill, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="font-semibold text-gray-900">{skill.skill}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            skill.demand === 'High' ? 'bg-red-100 text-red-800' :
                            skill.demand === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {skill.demand} Demand
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">{skill.resources} resources</span>
                      </div>
                      <ProgressBar 
                        percentage={skill.priority === 'High' ? 30 : skill.priority === 'Medium' ? 50 : 70} 
                        color={skill.priority === 'High' ? 'red' : skill.priority === 'Medium' ? 'yellow' : 'green'}
                      />
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-3 text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-colors duration-200">
                  Explore Learning Resources →
                </button>
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
                      <span className="text-gray-500">95%</span>
                    </div>
                    <ProgressBar percentage={95} color="green" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">GitHub Profile</span>
                      <span className="text-gray-500">60%</span>
                    </div>
                    <ProgressBar percentage={60} color="yellow" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">LinkedIn Profile</span>
                      <span className="text-gray-500">45%</span>
                    </div>
                    <ProgressBar percentage={45} color="orange" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-700">Skills Verification</span>
                      <span className="text-gray-500">75%</span>
                    </div>
                    <ProgressBar percentage={75} color="blue" />
                  </div>
                </div>
                <button className="w-full mt-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-medium transition-colors duration-200">
                  Complete Your Profile
                </button>
              </div>
            </div>

            {/* Job Recommendations */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Top Job Matches</h2>
                <p className="text-gray-600 mt-1">Roles that fit your profile</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.jobRecommendations.map((job) => (
                    <div key={job.id} className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors duration-200">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{job.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(job.match)}`}>
                          {job.match}%
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{job.company} • {job.location}</p>
                      <p className="text-green-600 text-sm font-medium mb-3">{job.salary}</p>
                      <div className="flex space-x-2">
                        <button className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200">
                          Quick Apply
                        </button>
                        <button className="flex-1 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200">
                          Save
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-3 text-blue-600 hover:bg-blue-50 rounded-xl font-medium transition-colors duration-200">
                  View More Jobs →
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                <p className="text-gray-600 mt-1">Your latest actions</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboardData.activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                        activity.type === 'analysis' ? 'bg-blue-500' :
                        activity.type === 'update' ? 'bg-green-500' :
                        activity.type === 'assessment' ? 'bg-purple-500' : 'bg-orange-500'
                      }`}>
                        {activity.type === 'analysis' ? '🔍' :
                         activity.type === 'update' ? '⚡' :
                         activity.type === 'assessment' ? '📊' : '📨'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-gray-600 text-sm">{activity.description}</p>
                        <p className="text-gray-400 text-xs mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;