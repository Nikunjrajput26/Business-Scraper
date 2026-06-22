import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, Search } from "lucide-react";
import { api } from "../api";
import { getToken } from "../api";

const COLUMNS = [
  { key: "business_name", label: "Business", className: "col-business" },
  { key: "phone_number", label: "Phone", className: "col-phone" },
  { key: "rating", label: "Rating", className: "col-rating", numeric: true },
  { key: "city", label: "City", className: "col-city" },
  { key: "email", label: "Email", className: "col-email" },
  { key: "website", label: "Site", className: "col-website", sortable: false },
];

export default function LeadsTable({ run, leads }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState({ key: null, dir: "asc" });

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
            {filtered.map((lead) => (
              <tr key={lead.id}>
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
              </tr>
            ))}
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
    </div>
  );
}
