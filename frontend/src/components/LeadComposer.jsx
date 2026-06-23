import { useState } from "react";
import { X } from "lucide-react";
import { api } from "../api";

/** Modal to email a single lead via the user's SMTP. */
export default function LeadComposer({ lead, onClose, onSent }) {
  const [subject, setSubject] = useState(`Quick idea for ${lead.business_name}`);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  const send = async () => {
    setBusy(true);
    setMsg("");
    try {
      const res = await api.emailLead(lead.id, { subject, body });
      setSent(true);
      setMsg(`Sent to ${res.sent_to}`);
      onSent?.();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="composer-overlay" onClick={onClose}>
      <div className="composer" onClick={(e) => e.stopPropagation()}>
        <div className="composer-head">
          <div>
            <h3>Email {lead.business_name}</h3>
            <p className="stat-sub">To: {(lead.email || "").split(";")[0]}</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <label>
          Subject
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <label>
          Message
          <textarea
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your outreach message…"
          />
        </label>
        {msg && (
          <div className={sent ? "stat-sub" : "error"} style={{ marginBottom: 10 }}>
            {msg}
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={send} disabled={busy || sent || !subject.trim() || !body.trim()}>
            {busy ? "Sending…" : sent ? "Sent" : "Send email"}
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
