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
