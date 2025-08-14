import React,{useEffect,useState} from 'react';
import { authFetch } from '../auth';
export default function AdminDashboard(){
  const [reports,setReports]=useState([]);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState('');
  const load=async()=>{
    try{
      setLoading(true);
      const res=await fetch('http://localhost:5001/api/reports');
      setReports(await res.json());
    }catch{ setErr('Failed loading reports'); }
    finally{ setLoading(false); }
  };
  useEffect(()=>{ load(); },[]);
  const updateStatus=async(id,status)=>{
    await authFetch(`http://localhost:5001/api/reports/${id}/status`,{
      method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})
    });
    setReports(r=>r.map(x=>x._id===id?{...x,status}:x));
  };
  if(loading) return <div className="p-6">Loading...</div>;
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      {err && <div className="mb-4 text-red-600 text-sm">{err}</div>}
      <div className="space-y-4">
        {reports.map(r=>(
          <div key={r._id} className="p-4 border rounded flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="font-semibold">{r.description}</div>
              <div className="text-xs text-gray-500">{new Date(r.timestamp).toLocaleString()}</div>
              <div className="text-xs mt-1">{r.location && `${r.location.latitude.toFixed(4)}, ${r.location.longitude.toFixed(4)}`}</div>
              <div className="text-xs mt-1">Status: <span className="font-medium">{r.status}</span></div>
            </div>
            <div className="flex items-center gap-2">
              <select value={r.status} onChange={e=>updateStatus(r._id,e.target.value)} className="border rounded px-2 py-1 text-sm">
                {['Reported','In Progress','Resolved','Rejected'].map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ))}
        {!reports.length && <div className="text-sm text-gray-500">No reports.</div>}
      </div>
    </div>
  );
}
