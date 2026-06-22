import { useState } from "react";
import { useAuth } from "../AuthContext";

export default function AuthForm() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <div className="hero-top">
          <div className="brand">
            <span className="brand-mark">LS</span>
            Lead Scraper
          </div>
        </div>
        <div className="hero-copy">
          <h2>Find your next customer before your competitors do.</h2>
          <p>
            Search Google Places by keyword and location, pull verified contact details, and
            export ready-to-use lead lists in minutes.
          </p>
          <div className="hero-stats">
            <div>
              <strong>10k+</strong>
              <span>Leads scraped</span>
            </div>
            <div>
              <strong>200+</strong>
              <span>Cities covered</span>
            </div>
            <div>
              <strong>98%</strong>
              <span>Data accuracy</span>
            </div>
          </div>
        </div>
        <div className="hero-footer">© {new Date().getFullYear()} Lead Scraper</div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-brand">
            <span className="brand-mark">LS</span>
            <span className="brand">Lead Scraper</span>
          </div>
          <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
          <p className="subtitle">
            {mode === "login" ? "Log in to access your dashboard" : "Start generating leads in minutes"}
          </p>
          <form onSubmit={submit}>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </label>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={busy}>
              {busy ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
            </button>
          </form>
          <div className="switch-row">
            <button className="link-btn" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "Need an account? Sign up" : "Have an account? Log in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
