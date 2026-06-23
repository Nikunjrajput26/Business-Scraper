import { useCallback, useEffect, useRef, useState } from "react";
import { LayoutDashboard, CreditCard, Settings, LogOut, Search, ListChecks, Users, History } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import RunForm from "./RunForm";
import RunsList from "./RunsList";
import LeadsTable from "./LeadsTable";
import PlanCards from "./marketing/PlanCards";

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
  const pollRef = useRef(null);

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
        </div>
      </div>
    </div>
  );
}
