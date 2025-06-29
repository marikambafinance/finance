// pages/Login.js
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      navigate("/"); // Redirect to Home
    } catch (err) {
      setError("Invalid credentials or user does not exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white flex flex-col items-center p-6">
      <Navbar />
      <div className="w-full max-w-md bg-gray-800 bg-opacity-50 p-8 rounded-2xl shadow-2xl backdrop-blur-md z-10">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Login to Continue
        </h2>

        {error && (
          <div className="text-red-500 mb-4 text-sm text-center">{error}</div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 rounded bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email ID"
            />
          </div>
          <div>
            <label className="block text-gray-300 text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 rounded bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter Password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-400 hover:bg-teal-500 transition duration-200 text-white py-2 rounded mt-4"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>

      <footer className="absolute bottom-4 text-sm text-gray-500">
        © 2025 Maarikamba Finance Pvt Ltd. All rights reserved.
      </footer>
    </div>
  );
};

export default Login;
