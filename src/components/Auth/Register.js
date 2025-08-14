import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { saveToken } from '../../auth';

export default function Register({ onAuth }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [err, setErr] = useState('');
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, adminCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');
      saveToken(data.token);
      onAuth();
      nav('/reports');
    } catch (ex) {
      setErr(ex.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-800 p-4">
      <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg p-8 w-full max-w-md text-white">
        <h2 className="text-3xl font-bold text-center mb-6">Create Your Account</h2>

        {err && (
          <div className="mb-4 p-3 rounded bg-red-500/20 border border-red-400 text-sm text-red-200">
            {err}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <input
            className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 placeholder-white/70 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
            placeholder="Admin Code (if any)"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
          />
          <button
            type="submit"
            className="w-full bg-cyan-400 text-gray-900 py-2 rounded-lg font-semibold shadow-md hover:bg-cyan-300 hover:-translate-y-0.5 transition-all duration-200"
          >
            Register
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-white/80">
          Have an account?{' '}
          <Link to="/login" className="text-cyan-300 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
