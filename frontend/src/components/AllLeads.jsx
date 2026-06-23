import { useCallback, useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { api } from "../api";
import LeadComposer from "./LeadComposer";

const STATUSES = [
  ["new", "New"],
  ["contacted", "Contacted"],
  ["replied", "Replied"],
  ["won", "Won"],
  ["lost", "Lost"],
];

const toDateInput = (iso) => (iso ? String(iso).slice(0, 10) : "");
const isOverdue = (iso) => iso && new Date(iso) <= new Date();

export default function AllLeads({ statusFilter, onChanged }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composer, setComposer] = useState(null);
  const [notesDraft, setNotesDraft] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAllLeads(statusFilter || undefined);
      setLeads(data);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (lead, body) => {
    try {
      const updated = await api.updateLead(lead.id, body);
      setLeads((rows) => rows.map((r) => (r.id === lead.id ? updated : r)));
      onChanged?.();
    } catch (err) {
      window.alert(err.message);
    }
  };

  if (loading) return <p className="empty-state">Loading leads…</p>;
  if (!leads.length)
    return (
      <p className="empty-state">
        No leads{statusFilter ? ` in “${statusFilter}”` : " yet"}. Run a search to collect some.
      </p>
    );

  return (
    <div className="table-scroll">
      <table className="all-leads-table">
        <thead>
          <tr>
            <th>Business</th>
            <th>Search</th>
            <th>Email</th>
            <th>Status</th>
            <th>Follow-up</th>
            <th>Notes</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td className="b" title={lead.business_name}>{lead.business_name}</td>
              <td className="dim" title={`${lead.run_search_terms} · ${lead.run_location}`}>
                {lead.run_search_terms} · {lead.run_location}
              </td>
              <td className="dim" title={lead.email}>{lead.email || "—"}</td>
              <td>
                <select
                  className={`status-select status-${lead.status || "new"}`}
                  value={lead.status || "new"}
                  onChange={(e) => patch(lead, { status: e.target.value })}
                >
                  {STATUSES.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="date"
                  className={`followup-input${isOverdue(lead.follow_up_date) && !["won", "lost"].includes(lead.status) ? " overdue" : ""}`}
                  value={toDateInput(lead.follow_up_date)}
                  onChange={(e) => patch(lead, { follow_up_date: e.target.value || null })}
                />
              </td>
              <td>
                <input
                  type="text"
                  className="notes-input"
                  placeholder="Add a note…"
                  value={notesDraft[lead.id] ?? lead.notes ?? ""}
                  onChange={(e) => setNotesDraft((d) => ({ ...d, [lead.id]: e.target.value }))}
                  onBlur={(e) => {
                    if ((e.target.value || "") !== (lead.notes || "")) {
                      patch(lead, { notes: e.target.value });
                    }
                  }}
                />
              </td>
              <td className="acts">
                {lead.email && (
                  <button className="row-action" onClick={() => setComposer(lead)} title="Email this lead">
                    <Mail size={13} strokeWidth={2} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {composer && (
        <LeadComposer
          lead={composer}
          onClose={() => setComposer(null)}
          onSent={() => {
            load();
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}
