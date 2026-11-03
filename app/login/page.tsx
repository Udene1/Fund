"use client";
import {useState} from "react";
export default function LoginPage(){
 const[password,setPassword]=useState("");const[error,setError]=useState("");const[busy,setBusy]=useState(false);
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");const response=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});const data=await response.json();setBusy(false);if(!response.ok){setError(data.error??"Sign-in failed.");return;}window.location.href="/";}
 return <main className="login-shell"><div className="login-card"><div className="mark">F</div><p className="eyebrow">PRIVATE DECISION INTELLIGENCE</p><h1>Your memory,<br/><em>kept intact.</em></h1><p className="muted">Sign in to access your private record of experiences, decisions and lessons.</p><form onSubmit={submit} className="capture-form"><label htmlFor="password">Owner password</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button disabled={busy}>{busy?"Signing in…":"Sign in"} <span>→</span></button>{error&&<small role="alert">{error}</small>}</form></div></main>;
}
