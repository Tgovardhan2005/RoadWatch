import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden min-h-screen flex items-center justify-center bg-gray-900">
      {/* Background gradient with animated overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-indigo-700 to-fuchsia-700 animate-gradient-x" />
      <div className="absolute inset-0 backdrop-blur-sm bg-black/30" />

      {/* Content container */}
      <div className="relative max-w-5xl mx-auto px-6 py-24 text-center text-white">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight drop-shadow-lg">
          <span className="bg-gradient-to-r from-cyan-300 via-pink-300 to-yellow-300 bg-clip-text text-transparent">
            Crowdsource Road Damage Reporting
          </span>
        </h1>
        <p className="mt-6 text-lg md:text-xl max-w-2xl mx-auto text-blue-100">
          Report potholes & hazards. Help prioritize repairs with transparent community data.
        </p>

        {/* Buttons with hover animations */}
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/register"
            className="px-8 py-3 bg-white text-blue-700 font-semibold rounded-xl shadow-lg 
                       hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            🚀 Get Started
          </Link>
          <Link
            to="/reports"
            className="px-8 py-3 border border-white/60 rounded-xl font-semibold 
                       hover:bg-white/20 hover:-translate-y-1 transition-all duration-300"
          >
            📊 View Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
