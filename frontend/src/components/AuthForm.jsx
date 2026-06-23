import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ShieldCheck, Star } from "lucide-react";
import { useAuth } from "../AuthContext";

const EMPTY = {
  full_name: "",
  company_name: "",
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
};

const BENEFITS = [
  "200 free leads every month — no card required",
  "Verified emails & phone numbers, de-duplicated",
  "One-click CSV export into your CRM",
  "Bring your own API key for unlimited volume",
];

export default function AuthForm() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const switchMode = () => {
    setMode(isSignup ? "login" : "signup");
    setError("");
    setForm(EMPTY);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (isSignup && form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      if (isSignup) {
        await signup({
          full_name: form.full_name.trim(),
          company_name: form.company_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          confirm_password: form.confirm_password,
        });
      } else {
        await login(form.email.trim(), form.password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="authx">
      {/* Brand / value panel */}
      <aside className="authx-aside">
        <Link to="/" className="authx-brand">
          <span className="brand-mark">LS</span>
          Lead Scraper
        </Link>

        <div className="authx-aside-body">
          <h2>The fastest way to a full sales pipeline.</h2>
          <p>
            Join teams using Lead Scraper to turn Google Places into ready-to-call lead lists with
            verified contact details.
          </p>
          <ul className="authx-benefits">
            {BENEFITS.map((b) => (
              <li key={b}>
                <span className="tick">
                  <Check size={13} strokeWidth={3} />
                </span>
                {b}
              </li>
            ))}
          </ul>

          <div className="authx-quote">
            <div className="stars">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
              ))}
            </div>
            “We pulled 3,000 qualified leads in our first week.”
            <span className="who">— Jordan M., Brightside Agency</span>
          </div>
        </div>

        <div className="authx-aside-foot">
          <span>
            <ShieldCheck size={14} strokeWidth={2} /> SOC-friendly · Your data stays yours
          </span>
          <span>© {new Date().getFullYear()} Lead Scraper</span>
        </div>
      </aside>

      {/* Form panel */}
      <main className="authx-main">
        <div className="authx-card">
          <Link to="/" className="authx-brand mobile">
            <span className="brand-mark">LS</span>
            Lead Scraper
          </Link>

          <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
          <p className="authx-sub">
            {isSignup ? "Start generating leads in minutes." : "Log in to access your dashboard."}
          </p>

          <form onSubmit={submit}>
            {isSignup && (
              <>
                <div className="authx-row">
                  <label>
                    Full name
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={set("full_name")}
                      placeholder="Jane Cooper"
                      autoComplete="name"
                      required
                    />
                  </label>
                  <label>
                    Company name
                    <input
                      type="text"
                      value={form.company_name}
                      onChange={set("company_name")}
                      placeholder="Acme Inc."
                      autoComplete="organization"
                      required
                    />
                  </label>
                </div>
                <div className="authx-row">
                  <label>
                    Work email
                    <input
                      type="email"
                      value={form.email}
                      onChange={set("email")}
                      placeholder="jane@acme.com"
                      autoComplete="email"
                      required
                    />
                  </label>
                  <label>
                    Phone <span className="opt">(optional)</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={set("phone")}
                      placeholder="+1 555 123 4567"
                      autoComplete="tel"
                    />
                  </label>
                </div>
                <div className="authx-row">
                  <label>
                    Password
                    <input
                      type="password"
                      value={form.password}
                      onChange={set("password")}
                      placeholder="At least 8 characters"
                      minLength={8}
                      autoComplete="new-password"
                      required
                    />
                  </label>
                  <label>
                    Confirm password
                    <input
                      type="password"
                      value={form.confirm_password}
                      onChange={set("confirm_password")}
                      placeholder="Re-enter password"
                      minLength={8}
                      autoComplete="new-password"
                      required
                    />
                  </label>
                </div>
              </>
            )}

            {!isSignup && (
              <>
                <label>
                  Email
                  <input
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={form.password}
                    onChange={set("password")}
                    placeholder="Your password"
                    autoComplete="current-password"
                    required
                  />
                </label>
              </>
            )}

            {error && <div className="error">{error}</div>}

            <button type="submit" className="authx-submit" disabled={busy}>
              {busy ? "Please wait…" : isSignup ? "Create account" : "Log in"}
            </button>
          </form>

          <div className="authx-switch">
            {isSignup ? "Already have an account?" : "Don't have an account?"}
            <button type="button" className="link-btn" onClick={switchMode}>
              {isSignup ? "Log in" : "Sign up free"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
