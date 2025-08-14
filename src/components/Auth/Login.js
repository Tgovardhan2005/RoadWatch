import React,{useState} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { saveToken } from '../../auth';
export default function Login({ onAuth }){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [err,setErr]=useState('');
  const nav=useNavigate();
  const submit=async e=>{
    e.preventDefault(); setErr('');
    try{
      const res=await fetch('http://localhost:5001/api/auth/login',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email,password})
      });
      const data=await res.json();
      if(!res.ok) throw new Error(data.message||'Login failed');
      saveToken(data.token); onAuth(); nav('/reports');
    }catch(ex){ setErr(ex.message); }
  };
  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-6">Login</h2>
      {err && <div className="mb-4 text-sm text-red-600">{err}</div>}
      <form onSubmit={submit} className="space-y-4">
        <input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 text-white py-2 rounded font-semibold">Login</button>
      </form>
      <p className="mt-4 text-xs">No account? <Link to="/register" className="text-blue-600">Register</Link></p>
    </div>
  );
}
