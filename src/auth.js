export function saveToken(token){ localStorage.setItem('rw_token', token); }
export function getToken(){ return localStorage.getItem('rw_token'); }
export function logout(){ localStorage.removeItem('rw_token'); }
export function getTokenPayload(){
  const t=getToken(); if(!t) return null;
  try { return JSON.parse(atob(t.split('.')[1])); } catch { return null; }
}
export function authFetch(url,options={}){
  const token=getToken();
  return fetch(url,{
    ...options,
    headers:{ ...(options.headers||{}), ...(token?{Authorization:`Bearer ${token}`}:{}) }
  });
}
// --- NEW: remote verify against backend (MongoDB) ---
export async function verifyAuth(){
  const token = getToken();
  if(!token) return null;
  try{
    const res = await authFetch('http://localhost:5001/api/auth/verify');
    if(!res.ok) return null;
    const data = await res.json();
    return data; // { user, tokenPayload }
  }catch{
    return null;
  }
}
