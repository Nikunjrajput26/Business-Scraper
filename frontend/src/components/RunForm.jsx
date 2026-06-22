import { useState } from "react";
import { api } from "../api";

export default function RunForm({ onCreated }) {
  const [prompt, setPrompt] = useState("");
  const [location, setLocation] = useState("");
  const [terms, setTerms] = useState("");
  const [maxRecords, setMaxRecords] = useState(100);
  const [includeEmail, setIncludeEmail] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const searchTerms = terms
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const run = await api.createRun({
        prompt,
        search_terms: searchTerms,
        location,
        include_email_scrape: includeEmail,
        max_records: Number(maxRecords),
      });
      setPrompt("");
      setLocation("");
      setTerms("");
      onCreated(run);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="run-form" onSubmit={submit}>
      <label>
        Quick prompt
        <input
          type="text"
          placeholder="e.g. fridge repair in Vadodara"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </label>
      <label>
        Keywords
        <input
          type="text"
          placeholder="electrician, electrical contractor"
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
        />
        <span className="field-hint">Separate multiple keywords with commas</span>
      </label>
      <label>
        Location
        <input
          type="text"
          placeholder="Vadodara, India"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </label>
      <div className="row">
        <label style={{ flex: "0 0 130px" }}>
          Max records
          <input
            type="number"
            min={1}
            max={5000}
            value={maxRecords}
            onChange={(e) => setMaxRecords(e.target.value)}
          />
        </label>
        <label className="checkbox-label" style={{ flex: 1 }}>
          <input type="checkbox" checked={includeEmail} onChange={(e) => setIncludeEmail(e.target.checked)} />
          Scrape emails from websites
        </label>
      </div>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={busy}>
        {busy ? "Starting..." : "Run Scraper"}
      </button>
    </form>
  );
}
