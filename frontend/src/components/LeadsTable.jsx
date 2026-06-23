import { Fragment, useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, Search, Sparkles, Mail } from "lucide-react";
import { api } from "../api";
import { getToken } from "../api";
import LeadComposer from "./LeadComposer";

const COLUMNS = [
  { key: "business_name", label: "Business", className: "col-business" },
  { key: "phone_number", label: "Phone", className: "col-phone" },
  { key: "rating", label: "Rating", className: "col-rating", numeric: true },
  { key: "city", label: "City", className: "col-city" },
  { key: "email", label: "Email", className: "col-email" },
  { key: "website", label: "Site", className: "col-website", sortable: false },
  { key: "actions", label: "", className: "col-actions", sortable: false },
];

export default function LeadsTable({ run, leads }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [pitches, setPitches] = useState({}); // leadId -> { loading, text, error }
  const [openPitch, setOpenPitch] = useState(null);
  const [composer, setComposer] = useState(null); // lead being emailed
  const [statuses, setStatuses] = useState({}); // leadId -> status override

  const changeStatus = async (lead, value) => {
    const prev = statuses[lead.id] ?? lead.status ?? "new";
    setStatuses((s) => ({ ...s, [lead.id]: value }));
    try {
      await api.setLeadStatus(lead.id, value);
    } catch {
      setStatuses((s) => ({ ...s, [lead.id]: prev })); // revert on failure
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = !q
      ? leads
      : leads.filter((lead) =>
          [lead.business_name, lead.phone_number, lead.city, lead.email, lead.website]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(q))
        );

    if (sort.key) {
      const col = COLUMNS.find((c) => c.key === sort.key);
      rows = [...rows].sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        if (col?.numeric) {
          const diff = (parseFloat(av) || 0) - (parseFloat(bv) || 0);
          return sort.dir === "asc" ? diff : -diff;
        }
        const cmp = String(av || "").localeCompare(String(bv || ""));
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [leads, query, sort]);

  if (!run) return <p className="empty-state">Select a search on the left to view its leads.</p>;

  if (run.status === "failed") {
    return (
      <div className="card-body">
        <div className="error">Run failed: {run.error_message}</div>
      </div>
    );
  }

  if (run.status !== "completed") {
    return <p className="empty-state">Scraping in progress... this updates automatically.</p>;
  }

  if (!leads.length) {
    return <p className="empty-state">No leads found for this search.</p>;
  }

  const downloadCsv = async () => {
    const res = await fetch(api.exportCsvUrl(run.id), {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `run_${run.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (key, sortable) => {
    if (sortable === false) return;
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  };

  const pitchFor = (lead) => pitches[lead.id] || (lead.ai_pitch ? { text: lead.ai_pitch } : null);

  const handlePitch = async (lead) => {
    setOpenPitch(lead.id);
    if (pitchFor(lead) && !pitches[lead.id]?.error) return; // already have it
    setPitches((p) => ({ ...p, [lead.id]: { loading: true } }));
    try {
      const updated = await api.generatePitch(lead.id);
      setPitches((p) => ({ ...p, [lead.id]: { text: updated.ai_pitch } }));
    } catch (err) {
      setPitches((p) => ({ ...p, [lead.id]: { error: err.message } }));
    }
  };

  return (
    <div>
      <div className="leads-header">
        <h3>
          {filtered.length}
          {filtered.length !== leads.length ? ` of ${leads.length}` : ""} leads
        </h3>
        <div className="leads-toolbar">
          <div className="search-input">
            <Search size={14} strokeWidth={2} />
            <input
              type="text"
              placeholder="Filter leads..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button onClick={downloadCsv}>Export CSV</button>
        </div>
      </div>
      <div className="table-scroll">
        <table className="leads-table">
          <thead>
            <tr>
              {COLUMNS.map((col) => {
                const isSorted = sort.key === col.key;
                const Icon = isSorted ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th
                    key={col.key}
                    className={`${col.className}${col.sortable === false ? "" : " sortable"}`}
                    onClick={() => toggleSort(col.key, col.sortable)}
                  >
                    <span className="th-content">
                      {col.label}
                      {col.sortable !== false && <Icon size={12} strokeWidth={2} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => {
              const pitch = pitchFor(lead);
              const isOpen = openPitch === lead.id;
              return (
                <Fragment key={lead.id}>
                  <tr>
                    <td className="col-business" title={lead.business_name}>
                      {lead.business_name}
                    </td>
                    <td className="col-phone">{lead.phone_number || "-"}</td>
                    <td className="col-rating">{lead.rating || "-"}</td>
                    <td className="col-city" title={lead.city}>
                      {lead.city || "-"}
                    </td>
                    <td className="col-email" title={lead.email}>
                      {lead.email || "-"}
                    </td>
                    <td className="col-website">
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noreferrer">
                          Visit
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="col-actions">
                      <div className="row-actions">
                        <select
                          className={`status-select status-${statuses[lead.id] ?? lead.status ?? "new"}`}
                          value={statuses[lead.id] ?? lead.status ?? "new"}
                          onChange={(e) => changeStatus(lead, e.target.value)}
                          title="Lead status"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="replied">Replied</option>
                          <option value="won">Won</option>
                          <option value="lost">Lost</option>
                        </select>
                        <button
                          className="row-action"
                          onClick={() => (isOpen ? setOpenPitch(null) : handlePitch(lead))}
                          title="AI service suggestions"
                        >
                          <Sparkles size={13} strokeWidth={2} />
                          Ideas
                        </button>
                        {lead.email && (
                          <button
                            className="row-action"
                            onClick={() => setComposer(lead)}
                            title="Email this lead"
                          >
                            <Mail size={13} strokeWidth={2} />
                            Email
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="pitch-row">
                      <td colSpan={COLUMNS.length}>
                        {pitch?.loading && <span className="pitch-loading">Generating ideas…</span>}
                        {pitch?.error && <span className="error">{pitch.error}</span>}
                        {pitch?.text && (
                          <div className="pitch-body">
                            <div className="pitch-title">
                              <Sparkles size={14} strokeWidth={2} /> Services you could pitch
                            </div>
                            <pre>{pitch.text}</pre>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {!filtered.length && (
              <tr>
                <td colSpan={COLUMNS.length} className="empty-state">
                  No leads match "{query}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {composer && (
        <LeadComposer lead={composer} onClose={() => setComposer(null)} />
      )}
    </div>
  );
}
