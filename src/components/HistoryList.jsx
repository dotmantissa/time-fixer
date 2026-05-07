export default function HistoryList({ history, onSelect }) {
  return (
    <section className="history-wrap">
      <p className="history-title">This Session</p>

      {history.length === 0 ? (
        <p className="history-empty">No queries yet this session</p>
      ) : (
        <div>
          {history.map((item, index) => (
            <button
              key={`${item.input}-${item.retrievedAt}-${index}`}
              type="button"
              className="history-row"
              onClick={() => onSelect(item)}
            >
              <span className="history-input" title={item.input}>{item.input}</span>
              <span className="history-ts">{item.timestamp}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
