import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirm: "" });
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: API call to backend for registration
    navigate("/login");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-semibold text-center mb-6">Create Account</h2>
        <input type="text" placeholder="Full Name" className="w-full border p-2 mb-4 rounded"
          onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
        <input type="email" placeholder="Email" className="w-full border p-2 mb-4 rounded"
          onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
        <input type="password" placeholder="Password" className="w-full border p-2 mb-4 rounded"
          onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
        <input type="password" placeholder="Confirm Password" className="w-full border p-2 mb-4 rounded"
          onChange={(e) => setFormData({ ...formData, confirm: e.target.value })} required />
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
          Sign Up
        </button>
        <p className="text-center mt-4 text-sm">
          Already have an account? <a href="/login" className="text-blue-600 underline">Login</a>
        </p>
      </form>
    </div>
  );
}
export default Signup;