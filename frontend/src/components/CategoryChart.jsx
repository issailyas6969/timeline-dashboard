import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function CategoryChart({ data }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "18px 18px 6px" }}>
      <h3 style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 18, margin: "0 0 12px" }}>
        Visits by category
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
          <XAxis type="number" stroke="var(--text-dim)" fontSize={12} />
          <YAxis type="category" dataKey="category" stroke="var(--text-dim)" fontSize={12} width={120} />
          <Tooltip
            contentStyle={{ background: "var(--surface-raised)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13 }}
            labelStyle={{ color: "var(--text)" }}
          />
          <Bar dataKey="visits" fill="var(--gold)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
