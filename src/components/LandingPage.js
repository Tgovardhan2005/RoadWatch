import React from 'react';
import { Link } from 'react-router-dom';
export default function LandingPage(){
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-fuchsia-600 opacity-90" />
      <div className="relative max-w-5xl mx-auto px-6 py-24 text-white">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight hero-glow">Crowdsource Road Damage Reporting</h1>
        <p className="mt-6 text-lg md:text-xl max-w-2xl text-blue-100">Report potholes & hazards. Help prioritize repairs with transparent community data.</p>
        <div className="mt-10 flex gap-4">
          <Link to="/register" className="px-6 py-3 bg-white text-blue-700 font-semibold rounded shadow hover:shadow-lg">Get Started</Link>
          <Link to="/reports" className="px-6 py-3 border border-white/60 rounded font-semibold hover:bg-white/10">View Reports</Link>
        </div>
      </div>
    </div>
  );
}
