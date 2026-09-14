const STAT_DEFS = [
  { key: "totalPlaces", label: "distinct places" },
  { key: "totalVisits", label: "total visits" },
  { key: "totalDistanceKm", label: "km traveled" },
  { key: "radiusKm", label: "km radius of life" },
  { key: "noveltyScore", label: "% novelty score", suffix: "" },
];

export default function StatsBar({ stats }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
      {STAT_DEFS.map((def) => (
        <div
          key={def.key}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            padding: "14px 18px",
            minWidth: 130,
            flex: "1 1 130px",
          }}
        >
          <div style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 600, color: "var(--gold)" }}>
            {stats[def.key] ?? "—"}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 2 }}>{def.label}</div>
        </div>
      ))}
    </div>
  );
}
