export default function TimeInput({
  naturalTime,
  onChange,
  onConvert,
  onGetCached,
  loading,
  validationError,
  statusMessage
}) {
  return (
    <section className={`card input-card ${loading ? 'is-loading' : ''}`}>
      <h2>Resolve Natural Language Time</h2>
      <p className="input-subtext">
        Example inputs: "2 hours ago", "yesterday", "next Friday at noon", "March 1 2025 14:30 UTC".
      </p>

      <input
        type="text"
        value={naturalTime}
        onChange={(event) => onChange(event.target.value)}
        className="time-input"
        placeholder="Enter natural language time"
      />

      {validationError ? <p className="error-inline">{validationError}</p> : null}

      <div className="input-actions">
        <button type="button" className="btn-primary" disabled={loading} onClick={onConvert}>
          {loading ? <span className="spinner" aria-label="Loading" /> : 'Convert On-Chain'}
        </button>
        <button type="button" className="btn-secondary" disabled={loading} onClick={onGetCached}>
          Get Cached Timestamp
        </button>
      </div>

      {loading && statusMessage ? <p className="status-inline">{statusMessage}</p> : null}
    </section>
  );
}
