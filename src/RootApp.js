import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import App from './App';
import LandingPage from './components/LandingPage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import AdminDashboard from './components/AdminDashboard';
import { getTokenPayload, logout, verifyAuth } from './auth';

export default function RootApp() {
  const [auth, setAuth] = useState(() => getTokenPayload());
  useEffect(() => {
    const h = () => setAuth(getTokenPayload());
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, []);
  useEffect(() => {
    let active = true;
    (async () => {
      const verified = await verifyAuth();
      if (!active) return;
      if (!verified) {
        logout();
        setAuth(null);
      } else {
        setAuth(verified.tokenPayload);
      }
    })();
    return () => { active = false; };
  }, []);
  const isAdmin = auth?.role === 'admin';

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <nav className="flex items-center justify-between px-6 py-3 bg-white shadow">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xl font-bold text-blue-600">RoadWatch</Link>
            {auth && <Link to="/reports" className="text-sm text-gray-600 hover:text-blue-600">Reports</Link>}
            {isAdmin && <Link to="/admin" className="text-sm text-gray-600 hover:text-blue-600">Admin</Link>}
          </div>
          <div className="flex items-center gap-3">
            {auth ? (
              <>
                <span className="text-xs md:text-sm">{auth.email} ({auth.role})</span>
                <button onClick={() => { logout(); setAuth(null); window.location.href = '/'; }} className="text-xs md:text-sm px-3 py-1 bg-red-500 text-white rounded">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-xs md:text-sm px-3 py-1 bg-blue-500 text-white rounded">Login</Link>
                <Link to="/register" className="text-xs md:text-sm px-3 py-1 border border-blue-500 text-blue-600 rounded">Register</Link>
              </>
            )}
          </div>
        </nav>
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={auth ? <Navigate to="/reports" /> : <Login onAuth={() => setAuth(getTokenPayload())} />} />
            <Route path="/register" element={auth ? <Navigate to="/reports" /> : <Register onAuth={() => setAuth(getTokenPayload())} />} />
            <Route path="/reports" element={auth ? <App /> : <Navigate to="/login" />} />
            <Route
              path="/admin"
              element={
                isAdmin
                  ? <AdminDashboard />
                  : auth
                    ? <Navigate to="/reports" />
                    : <Navigate to="/login" />
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        <footer className="py-4 text-center text-xs text-gray-500">© {new Date().getFullYear()} RoadWatch</footer>
      </div>
    </BrowserRouter>
  );
}
