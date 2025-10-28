import React from "react";

function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold mb-4 text-blue-700">AI-Powered Resume–Job Compatibility Analyzer</h1>
      <p className="text-lg text-gray-600 max-w-xl text-center mb-6">
        Analyze how well your resume matches your dream job. Get a compatibility score, insights, and suggestions to improve.
      </p>
      <a href="/login" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Get Started</a>
    </div>
  );
}


export default Home;
