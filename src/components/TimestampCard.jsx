function formatUTC(timestamp) {
  if (!timestamp || Number(timestamp) <= 0) return 'N/A';
  return new Date(Number(timestamp) * 1000).toISOString();
}

function formatLocal(timestamp) {
  if (!timestamp || Number(timestamp) <= 0) return 'N/A';
  return new Date(Number(timestamp) * 1000).toLocaleString();
}

export default function TimestampCard({ entry }) {
  if (!entry) return null;

  return (
    <section className="card result-card">
      <h3>Resolved Timestamp</h3>
      <p className="query-text" title={entry.input}>{entry.input}</p>
      <p className="timestamp-value">{entry.timestamp}</p>
      <p className="timestamp-row">
        <span>UTC:</span> {formatUTC(entry.timestamp)}
      </p>
      <p className="timestamp-row">
        <span>Local:</span> {formatLocal(entry.timestamp)}
      </p>
      <p className="timestamp-row">
        <span>Retrieved:</span> {new Date(entry.retrievedAt).toLocaleString()}
      </p>
    </section>
  );
}
