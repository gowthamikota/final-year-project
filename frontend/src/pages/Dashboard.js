import React, { useState } from "react";

function Dashboard() {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState("");
  const [score, setScore] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Send file and role to backend for analysis
    setScore(82); // mock score
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">
        Resume Compatibility Dashboard
      </h1>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow">
        <input type="file" className="w-full mb-4" onChange={(e) => setFile(e.target.files[0])} required />
        <input type="text" placeholder="Target Job Role" className="w-full border p-2 mb-4 rounded"
          value={role} onChange={(e) => setRole(e.target.value)} required />
        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Analyze
        </button>
      </form>

      {score && (
        <div className="text-center mt-8">
          <h2 className="text-2xl font-semibold">Compatibility Score: {score}%</h2>
          <p className="mt-2 text-gray-600">Your resume is a good match for this role. Improve missing skills for better alignment.</p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
