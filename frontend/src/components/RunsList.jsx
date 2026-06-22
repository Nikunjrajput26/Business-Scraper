const STATUS_LABELS = {
  pending: "Queued",
  running: "Running...",
  completed: "Completed",
  failed: "Failed",
};

export default function RunsList({ runs, selectedRunId, onSelect }) {
  if (!runs.length) {
    return <p className="empty-state">No searches yet. Start one to see results here.</p>;
  }

  return (
    <table className="runs-table">
      <thead>
        <tr>
          <th>Terms</th>
          <th>Location</th>
          <th>Status</th>
          <th>Leads</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {runs.map((run) => (
          <tr
            key={run.id}
            className={run.id === selectedRunId ? "selected" : ""}
            onClick={() => onSelect(run.id)}
          >
            <td>{run.search_terms}</td>
            <td>{run.location_query}</td>
            <td>
              <span className={`badge badge-${run.status}`}>{STATUS_LABELS[run.status] || run.status}</span>
            </td>
            <td>{run.record_count}</td>
            <td>{new Date(run.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
