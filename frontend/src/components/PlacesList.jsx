import { useState } from "react";

export default function PlacesList({ places, selectedKey, onSelect }) {
  const [query, setQuery] = useState("");

  const filtered = places.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", height: 420 }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search a place, e.g. London"
        style={{
          background: "var(--surface-raised)",
          border: "1px solid var(--line)",
          borderRadius: 6,
          padding: "8px 10px",
          color: "var(--text)",
          fontSize: 13.5,
          marginBottom: 12,
          outline: "none",
        }}
      />
      <div className="scrollbar-thin" style={{ overflowY: "auto", flex: 1 }}>
        {filtered.length === 0 && (
          <p style={{ color: "var(--text-dim)", fontSize: 13 }}>No places match "{query}".</p>
        )}
        {filtered.map((p) => (
          <button
            key={p.key}
            onClick={() => onSelect(p)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              background: p.key === selectedKey ? "var(--surface-raised)" : "transparent",
              border: "none",
              borderRadius: 6,
              padding: "9px 10px",
              marginBottom: 2,
              color: "var(--text)",
            }}
          >
            <div style={{ fontSize: 13.5 }}>{p.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--text-dim)" }}>
              {p.category} · {p.visitCount} visit{p.visitCount === 1 ? "" : "s"}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
