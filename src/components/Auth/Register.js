import React,{useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { saveToken } from '../../auth';
export default function Register({ onAuth }){
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [adminCode,setAdminCode]=useState('');
  const [err,setErr]=useState('');
  const nav=useNavigate();
  const submit=async e=>{
    e.preventDefault(); setErr('');
    try{
      const res=await fetch('http://localhost:5001/api/auth/register',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({name,email,password,adminCode})
      });
      const data=await res.json();
      if(!res.ok) throw new Error(data.message||'Registration failed');
      saveToken(data.token); onAuth(); nav('/reports');
    }catch(ex){ setErr(ex.message); }
  };
  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-6">Create Account</h2>
      {err && <div className="mb-4 text-sm text-red-600">{err}</div>}
      <form onSubmit={submit} className="space-y-4">
        <input className="w-full border rounded px-3 py-2" placeholder="Name (optional)" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" placeholder="Admin Code (if any)" value={adminCode} onChange={e=>setAdminCode(e.target.value)} />
        <button className="w-full bg-green-600 text-white py-2 rounded font-semibold">Register</button>
      </form>
      <p className="mt-4 text-xs">Have an account? <Link to="/login" className="text-blue-600">Login</Link></p>
    </div>
  );
}
