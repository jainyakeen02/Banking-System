import { useState } from "react";

export default function AuthCard({ onLogin, busy }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [portal, setPortal] = useState("USER");
  const submit = event => { event.preventDefault(); onLogin({ email, password }, portal); };
  return <main className="auth-layout">
    <section className="auth-copy"><span className="eyebrow">Backend learning project</span><h1>See how every banking action moves through the system.</h1><p>FlowLedger is a transaction demo: customers make PIN-protected online transfers while cashiers complete offline counter activity.</p><div className="trust-row"><span>MongoDB transaction history</span><span>Online & offline audit</span></div></section>
    <form className="card auth-card" onSubmit={submit}>
      <div className="portal-switch"><button type="button" className={portal === "USER" ? "active" : ""} onClick={() => setPortal("USER")}>Customer login</button><button type="button" className={portal === "ADMIN" ? "active" : ""} onClick={() => setPortal("ADMIN")}>Admin login</button></div>
      <span className="eyebrow">{portal === "ADMIN" ? "Cashier workspace" : "Customer banking"}</span><h2>{portal === "ADMIN" ? "Admin sign in" : "Customer sign in"}</h2><p className="muted">{portal === "ADMIN" ? "Review the complete audit trail and operate the cash counter." : "Customers are onboarded by a cashier. Use your issued credentials."}</p>
      <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
      <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required /></label>
      <button className="button primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      {portal === "ADMIN" && <p className="helper">Use the administrator credentials configured on the server.</p>}
    </form>
  </main>;
}
