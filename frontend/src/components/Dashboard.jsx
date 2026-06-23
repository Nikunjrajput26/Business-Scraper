import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutDashboard, CreditCard, Settings, LogOut, Search, ListChecks, Users, History, Target, Send, Clock } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import RunForm from "./RunForm";
import RunsList from "./RunsList";
import LeadsTable from "./LeadsTable";
import AllLeads from "./AllLeads";
import PlanCards from "./marketing/PlanCards";
import AddonBanner from "./marketing/AddonBanner";

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const [tab, setTab] = useState("dashboard");
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [leads, setLeads] = useState([]);
  const [busyPlan, setBusyPlan] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyMsg, setKeyMsg] = useState("");
  const [aiKeyInput, setAiKeyInput] = useState("");
  const [aiProvider, setAiProvider] = useState("anthropic");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState("");
  const [smtp, setSmtp] = useState({ smtp_host: "", smtp_port: 587, smtp_username: "", smtp_password: "", smtp_from_name: "" });
  const [smtpBusy, setSmtpBusy] = useState(false);
  const [smtpMsg, setSmtpMsg] = useState("");
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const pollRef = useRef(null);

  const loadStats = useCallback(() => {
    api.getStats().then(setStats).catch(() => setStats(null));
  }, []);

  useEffect(() => {
    if (tab === "pipeline") loadStats();
  }, [tab, loadStats]);

  const handleChangePassword = async () => {
    setPwMsg("");
    if (pw.next !== pw.confirm) {
      setPwMsg("New passwords do not match.");
      return;
    }
    setPwBusy(true);
    try {
      await api.changePassword(pw.current, pw.next);
      setPw({ current: "", next: "", confirm: "" });
      setPwMsg("Password updated.");
    } catch (err) {
      setPwMsg(err.message);
    } finally {
      setPwBusy(false);
    }
  };

  const handleSaveAiKey = async () => {
    setAiBusy(true);
    setAiMsg("");
    try {
      await api.saveAiKey(aiProvider, aiKeyInput.trim());
      setAiKeyInput("");
      setAiMsg("AI key saved — suggestions are now enabled.");
      await refreshUser();
    } catch (err) {
      setAiMsg(err.message);
    } finally {
      setAiBusy(false);
    }
  };

  const handleRemoveAiKey = async () => {
    setAiBusy(true);
    setAiMsg("");
    try {
      await api.deleteAiKey();
      setAiMsg("AI key removed.");
      await refreshUser();
    } catch (err) {
      setAiMsg(err.message);
    } finally {
      setAiBusy(false);
    }
  };

  const handleSaveSmtp = async () => {
    setSmtpBusy(true);
    setSmtpMsg("");
    try {
      await api.saveSmtp({ ...smtp, smtp_port: Number(smtp.smtp_port) || 587 });
      setSmtp((s) => ({ ...s, smtp_password: "" }));
      setSmtpMsg("Email settings saved — you can now send outreach to leads.");
      await refreshUser();
    } catch (err) {
      setSmtpMsg(err.message);
    } finally {
      setSmtpBusy(false);
    }
  };

  const handleRemoveSmtp = async () => {
    setSmtpBusy(true);
    setSmtpMsg("");
    try {
      await api.deleteSmtp();
      setSmtpMsg("Email settings removed.");
      await refreshUser();
    } catch (err) {
      setSmtpMsg(err.message);
    } finally {
      setSmtpBusy(false);
    }
  };

  const handleSelectPlan = async (planId) => {
    setBusyPlan(planId);
    try {
      await api.selectPlan(planId);
      await refreshUser();
    } catch (err) {
      window.alert(err.message);
    } finally {
      setBusyPlan(null);
    }
  };

  const handleSaveKey = async () => {
    setKeyBusy(true);
    setKeyMsg("");
    try {
      await api.saveApiKey(apiKeyInput.trim());
      setApiKeyInput("");
      setKeyMsg("API key saved — your scrapes now run unlimited on your own key.");
      await refreshUser();
    } catch (err) {
      setKeyMsg(err.message);
    } finally {
      setKeyBusy(false);
    }
  };

  const handleRemoveKey = async () => {
    setKeyBusy(true);
    setKeyMsg("");
    try {
      await api.deleteApiKey();
      setKeyMsg("API key removed. Scrapes now use the plan quota again.");
      await refreshUser();
    } catch (err) {
      setKeyMsg(err.message);
    } finally {
      setKeyBusy(false);
    }
  };

  const loadRuns = useCallback(async () => {
    const data = await api.listRuns();
    setRuns(data);
    return data;
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const selectedRun = runs.find((r) => r.id === selectedRunId) || null;

  const loadLeadsForSelected = useCallback(async (runId) => {
    if (!runId) return;
    const data = await api.getLeads(runId);
    setLeads(data);
  }, []);

  useEffect(() => {
    if (selectedRun && selectedRun.status === "completed") {
      loadLeadsForSelected(selectedRun.id);
    } else {
      setLeads([]);
    }
  }, [selectedRun, loadLeadsForSelected]);

  // Poll while any run is still pending/running.
  useEffect(() => {
    const hasActive = runs.some((r) => r.status === "pending" || r.status === "running");
    if (!hasActive) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      const updated = await loadRuns();
      const stillActive = updated.some((r) => r.status === "pending" || r.status === "running");
      if (!stillActive) {
        clearInterval(pollRef.current);
        refreshUser();
      }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [runs, loadRuns, refreshUser]);

  const handleCreated = (run) => {
    setRuns((prev) => [run, ...prev]);
    setSelectedRunId(run.id);
  };

  const quotaRemaining = user ? user.monthly_lead_quota - user.leads_used_this_period : 0;
  const quotaPct = user ? Math.min(100, Math.round((user.leads_used_this_period / user.monthly_lead_quota) * 100)) : 0;
  const completedRuns = runs.filter((r) => r.status === "completed").length;
  const totalLeads = runs.reduce((sum, r) => sum + (r.record_count || 0), 0);
  const initial = user?.email ? user.email[0].toUpperCase() : "?";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">LS</span>
          Lead Scraper
        </div>

        <div className="nav-section-label">Workspace</div>
        <nav className="nav-list">
          <button
            type="button"
            className={`nav-item${tab === "dashboard" ? " active" : ""}`}
            onClick={() => setTab("dashboard")}
          >
            <LayoutDashboard size={16} strokeWidth={2} />
            Dashboard
          </button>
          <button
            type="button"
            className={`nav-item${tab === "pipeline" ? " active" : ""}`}
            onClick={() => setTab("pipeline")}
          >
            <Target size={16} strokeWidth={2} />
            Pipeline
          </button>
          <button
            type="button"
            className={`nav-item${tab === "history" ? " active" : ""}`}
            onClick={() => setTab("history")}
          >
            <History size={16} strokeWidth={2} />
            History
          </button>
          <button
            type="button"
            className={`nav-item${tab === "billing" ? " active" : ""}`}
            onClick={() => setTab("billing")}
          >
            <CreditCard size={16} strokeWidth={2} />
            Billing
          </button>
          <button
            type="button"
            className={`nav-item${tab === "settings" ? " active" : ""}`}
            onClick={() => setTab("settings")}
          >
            <Settings size={16} strokeWidth={2} />
            Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="quota-block">
            <div className="quota-label">
              <span>Monthly quota</span>
              <span>{quotaPct}%</span>
            </div>
            <div className="quota-bar-track">
              <span style={{ width: `${quotaPct}%` }} />
            </div>
          </div>
          <div className="user-row">
            <span className="user-avatar">{initial}</span>
            <span className="user-email">{user?.email}</span>
          </div>
          <button className="btn-secondary" onClick={logout} style={{ width: "100%", marginTop: 10 }}>
            <LogOut size={14} strokeWidth={2} />
            Log out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <h1>
            {tab === "dashboard" && "Dashboard"}
            {tab === "pipeline" && "Pipeline"}
            {tab === "history" && "History"}
            {tab === "billing" && "Billing"}
            {tab === "settings" && "Settings"}
          </h1>
        </header>

        <div className="page">
          {tab === "dashboard" && (
            <>
              <div className="stat-row">
                <div className="stat-card">
                  <div className="stat-icon">
                    <Users size={16} strokeWidth={2} />
                  </div>
                  <div className="stat-label">Leads remaining</div>
                  <div className="stat-value">{quotaRemaining}</div>
                  <div className="stat-sub">of {user?.monthly_lead_quota} this period</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <Search size={16} strokeWidth={2} />
                  </div>
                  <div className="stat-label">Total searches</div>
                  <div className="stat-value">{runs.length}</div>
                  <div className="stat-sub">{completedRuns} completed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <ListChecks size={16} strokeWidth={2} />
                  </div>
                  <div className="stat-label">Leads collected</div>
                  <div className="stat-value">{totalLeads}</div>
                  <div className="stat-sub">across all searches</div>
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="card new-search-card">
                  <div className="card-header">
                    <div>
                      <h3>New Search</h3>
                      <p>Find businesses by keyword and location</p>
                    </div>
                  </div>
                  <div className="card-body">
                    <RunForm onCreated={handleCreated} />
                  </div>
                </div>

                <section className="card runs-card">
                  <div className="card-header">
                    <h3>Recent Searches</h3>
                  </div>
                  <RunsList runs={runs.slice(0, 5)} selectedRunId={selectedRunId} onSelect={setSelectedRunId} />
                </section>
              </div>

              <section className="panel card leads-panel">
                <LeadsTable run={selectedRun} leads={leads} />
              </section>
            </>
          )}

          {tab === "pipeline" && (
            <>
              <div className="stat-row" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                <div className="stat-card">
                  <div className="stat-icon">
                    <ListChecks size={16} strokeWidth={2} />
                  </div>
                  <div className="stat-label">Leads collected</div>
                  <div className="stat-value">{stats?.total_leads ?? "—"}</div>
                  <div className="stat-sub">across all searches</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <Send size={16} strokeWidth={2} />
                  </div>
                  <div className="stat-label">Emails sent</div>
                  <div className="stat-value">{stats?.emailed ?? "—"}</div>
                  <div className="stat-sub">
                    {stats && stats.total_leads
                      ? `${Math.round((stats.emailed / stats.total_leads) * 100)}% of leads contacted`
                      : "via your SMTP"}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <Clock size={16} strokeWidth={2} />
                  </div>
                  <div className="stat-label">Avg. time to contact</div>
                  <div className="stat-value">
                    {stats?.avg_days_to_contact != null ? `${stats.avg_days_to_contact}d` : "—"}
                  </div>
                  <div className="stat-sub">collected → first email</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">
                    <Target size={16} strokeWidth={2} />
                  </div>
                  <div className="stat-label">Follow-ups due</div>
                  <div className="stat-value">{stats?.follow_ups_due ?? "—"}</div>
                  <div className="stat-sub">on or before today</div>
                </div>
              </div>

              <section className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                  <div>
                    <h3>Pipeline</h3>
                    <p>Click a stage to filter the leads below. Win rate counts active+closed leads.</p>
                  </div>
                </div>
                <div className="card-body">
                  <div className="pipeline-row">
                    {[
                      ["", "All"],
                      ["new", "New"],
                      ["contacted", "Contacted"],
                      ["replied", "Replied"],
                      ["won", "Won"],
                      ["lost", "Lost"],
                    ].map(([key, label]) => (
                      <button
                        type="button"
                        className={`pipeline-stage stage-${key || "all"}${statusFilter === key ? " active" : ""}`}
                        key={key || "all"}
                        onClick={() => setStatusFilter(key)}
                      >
                        <div className="pipeline-count">
                          {key === "" ? stats?.total_leads ?? "—" : stats ? stats[key] : "—"}
                        </div>
                        <div className="pipeline-label">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="card leads-panel">
                <div className="card-header">
                  <div>
                    <h3>{statusFilter ? `${statusFilter} leads` : "All leads"}</h3>
                    <p>Set status, add a follow-up date and notes, or email any lead.</p>
                  </div>
                </div>
                <AllLeads statusFilter={statusFilter} onChanged={loadStats} />
              </section>
            </>
          )}

          {tab === "history" && (
            <>
              <section className="card" style={{ width: "100%", marginBottom: 24 }}>
                <div className="card-header">
                  <div>
                    <h3>Search History</h3>
                    <p>All your past searches — click one to view its leads below</p>
                  </div>
                </div>
                <RunsList runs={runs} selectedRunId={selectedRunId} onSelect={setSelectedRunId} />
              </section>

              <section className="panel card leads-panel">
                <LeadsTable run={selectedRun} leads={leads} />
              </section>
            </>
          )}

          {tab === "billing" && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Plan & usage</h3>
                  <p>Manage your subscription and monthly lead quota</p>
                </div>
              </div>
              <div className="card-body">
                <div className="stat-row" style={{ marginBottom: 0 }}>
                  <div className="stat-card">
                    <div className="stat-label">Current plan</div>
                    <div className="stat-value" style={{ textTransform: "capitalize" }}>
                      {user?.plan || "Free"}
                    </div>
                    <div className="stat-sub">Billed monthly</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Lead quota</div>
                    <div className="stat-value">{user?.monthly_lead_quota}</div>
                    <div className="stat-sub">{user?.leads_used_this_period} used this period</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">API key</div>
                    <div className="stat-value" style={{ fontSize: 16 }}>
                      {user?.has_own_api_key ? "Your own key" : "Shared"}
                    </div>
                    <div className="stat-sub">
                      {user?.has_own_api_key ? "Unlimited — quota not enforced" : "Add yours in Settings"}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 28 }}>
                  <h3 style={{ margin: "0 0 4px" }}>Choose a plan</h3>
                  <p className="stat-sub" style={{ marginBottom: 16 }}>
                    Switching takes effect immediately. No payment is collected in this demo.
                  </p>
                  <PlanCards currentPlan={user?.plan} onSelect={handleSelectPlan} busyPlan={busyPlan} />
                  {!user?.has_own_api_key && (
                    <AddonBanner onBuy={() => setTab("settings")} ctaLabel="Add your API key" />
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Account settings</h3>
                  <p>Your account details</p>
                </div>
              </div>
              <div className="card-body">
                <label style={{ maxWidth: 380, marginBottom: 16 }}>
                  Email
                  <input type="text" value={user?.email || ""} disabled />
                </label>
                <label style={{ maxWidth: 380 }}>
                  Plan
                  <input type="text" value={user?.plan || "Free"} disabled style={{ textTransform: "capitalize" }} />
                </label>
                <button style={{ marginTop: 14 }} onClick={() => setTab("billing")}>
                  Upgrade plan
                </button>

                <div style={{ borderTop: "1px solid var(--border)", margin: "24px 0 0", paddingTop: 20 }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: 15 }}>Change password</h3>
                  <p className="stat-sub" style={{ marginBottom: 16 }}>
                    Update the password you use to log in.
                  </p>
                  <label style={{ maxWidth: 380, marginBottom: 14 }}>
                    Current password
                    <input
                      type="password"
                      value={pw.current}
                      onChange={(e) => setPw({ ...pw, current: e.target.value })}
                      autoComplete="current-password"
                    />
                  </label>
                  <label style={{ maxWidth: 380, marginBottom: 14 }}>
                    New password
                    <input
                      type="password"
                      value={pw.next}
                      onChange={(e) => setPw({ ...pw, next: e.target.value })}
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </label>
                  <label style={{ maxWidth: 380 }}>
                    Confirm new password
                    <input
                      type="password"
                      value={pw.confirm}
                      onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </label>
                  <button
                    style={{ marginTop: 14 }}
                    onClick={handleChangePassword}
                    disabled={pwBusy || !pw.current || pw.next.length < 8 || !pw.confirm}
                  >
                    {pwBusy ? "Updating…" : "Update password"}
                  </button>
                  {pwMsg && <div className="stat-sub" style={{ marginTop: 12 }}>{pwMsg}</div>}
                </div>
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="card" style={{ marginTop: 24 }}>
              <div className="card-header">
                <div>
                  <h3>Google Places API key</h3>
                  <p>
                    Bring your own key to scrape with no monthly lead cap — searches run on your
                    Google billing and rate limits.
                  </p>
                </div>
              </div>
              <div className="card-body">
                {user?.has_own_api_key ? (
                  <div className="byo-key-active">
                    <div style={{ marginBottom: 14 }}>
                      <span className="badge badge-completed">Your API key is active — unlimited scraping enabled</span>
                    </div>
                    <button className="btn-secondary" onClick={handleRemoveKey} disabled={keyBusy}>
                      {keyBusy ? "Removing…" : "Remove key"}
                    </button>
                  </div>
                ) : (
                  <>
                    <label style={{ maxWidth: 480 }}>
                      API key
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder="AIza..."
                        autoComplete="off"
                      />
                    </label>
                    <button
                      onClick={handleSaveKey}
                      disabled={keyBusy || apiKeyInput.trim().length < 10}
                      style={{ marginTop: 14 }}
                    >
                      {keyBusy ? "Saving…" : "Save key"}
                    </button>
                  </>
                )}
                {keyMsg && (
                  <div className="stat-sub" style={{ marginTop: 12 }}>
                    {keyMsg}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="card" style={{ marginTop: 24 }}>
              <div className="card-header">
                <div>
                  <h3>AI provider key</h3>
                  <p>
                    Bring your own AI key to generate service suggestions for each lead. Choose your
                    provider and paste its API key — Anthropic (Claude), OpenAI (GPT), or Google Gemini.
                  </p>
                </div>
              </div>
              <div className="card-body">
                {user?.has_ai_key ? (
                  <div>
                    <div style={{ marginBottom: 14 }}>
                      <span className="badge badge-completed">
                        AI suggestions enabled · {user?.ai_provider || "anthropic"}
                      </span>
                    </div>
                    <button className="btn-secondary" onClick={handleRemoveAiKey} disabled={aiBusy}>
                      {aiBusy ? "Removing…" : "Remove key"}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
                      <label style={{ flex: "0 0 200px" }}>
                        Provider
                        <select value={aiProvider} onChange={(e) => setAiProvider(e.target.value)}>
                          <option value="anthropic">Anthropic (Claude)</option>
                          <option value="openai">OpenAI (GPT)</option>
                          <option value="gemini">Google Gemini</option>
                        </select>
                      </label>
                      <label style={{ flex: "1 1 260px" }}>
                        API key
                        <input
                          type="password"
                          value={aiKeyInput}
                          onChange={(e) => setAiKeyInput(e.target.value)}
                          placeholder={
                            aiProvider === "anthropic"
                              ? "sk-ant-..."
                              : aiProvider === "openai"
                              ? "sk-..."
                              : "AIza..."
                          }
                          autoComplete="off"
                        />
                      </label>
                    </div>
                    <button
                      onClick={handleSaveAiKey}
                      disabled={aiBusy || aiKeyInput.trim().length < 10}
                      style={{ marginTop: 14 }}
                    >
                      {aiBusy ? "Saving…" : "Save key"}
                    </button>
                  </>
                )}
                {aiMsg && <div className="stat-sub" style={{ marginTop: 12 }}>{aiMsg}</div>}
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="card" style={{ marginTop: 24 }}>
              <div className="card-header">
                <div>
                  <h3>Email (SMTP)</h3>
                  <p>
                    Connect your own email so you can send outreach to leads. For Gmail, use an
                    App Password (Google Account → Security → App passwords), host{" "}
                    <code>smtp.gmail.com</code>, port 587.
                  </p>
                </div>
              </div>
              <div className="card-body">
                {user?.has_smtp && (
                  <div style={{ marginBottom: 16 }}>
                    <span className="badge badge-completed">
                      Email connected{user?.smtp_username ? ` · ${user.smtp_username}` : ""}
                    </span>
                  </div>
                )}
                <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
                  <label style={{ flex: "1 1 220px" }}>
                    SMTP host
                    <input
                      type="text"
                      value={smtp.smtp_host}
                      onChange={(e) => setSmtp({ ...smtp, smtp_host: e.target.value })}
                      placeholder="smtp.gmail.com"
                    />
                  </label>
                  <label style={{ flex: "0 0 110px" }}>
                    Port
                    <input
                      type="number"
                      value={smtp.smtp_port}
                      onChange={(e) => setSmtp({ ...smtp, smtp_port: e.target.value })}
                      placeholder="587"
                    />
                  </label>
                </div>
                <div className="row" style={{ gap: 16, flexWrap: "wrap", marginTop: 14 }}>
                  <label style={{ flex: "1 1 220px" }}>
                    Email / username
                    <input
                      type="text"
                      value={smtp.smtp_username}
                      onChange={(e) => setSmtp({ ...smtp, smtp_username: e.target.value })}
                      placeholder="you@gmail.com"
                      autoComplete="off"
                    />
                  </label>
                  <label style={{ flex: "1 1 220px" }}>
                    From name
                    <input
                      type="text"
                      value={smtp.smtp_from_name}
                      onChange={(e) => setSmtp({ ...smtp, smtp_from_name: e.target.value })}
                      placeholder="Your Company"
                    />
                  </label>
                </div>
                <label style={{ maxWidth: 480, marginTop: 14 }}>
                  Password / App password
                  <input
                    type="password"
                    value={smtp.smtp_password}
                    onChange={(e) => setSmtp({ ...smtp, smtp_password: e.target.value })}
                    placeholder={user?.has_smtp ? "•••••••• (saved)" : "App password"}
                    autoComplete="new-password"
                  />
                </label>
                <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                  <button
                    onClick={handleSaveSmtp}
                    disabled={
                      smtpBusy ||
                      !smtp.smtp_host.trim() ||
                      !smtp.smtp_username.trim() ||
                      !smtp.smtp_password.trim()
                    }
                  >
                    {smtpBusy ? "Saving…" : "Save email settings"}
                  </button>
                  {user?.has_smtp && (
                    <button className="btn-secondary" onClick={handleRemoveSmtp} disabled={smtpBusy}>
                      Disconnect
                    </button>
                  )}
                </div>
                {smtpMsg && <div className="stat-sub" style={{ marginTop: 12 }}>{smtpMsg}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
