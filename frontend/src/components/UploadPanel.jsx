import { useState, useRef } from "react";

export default function UploadPanel({ onUploaded }) {
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const form = new FormData();
      form.append("timeline", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onUploaded(data);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  return (
    <div
      style={{
        border: `1px dashed var(--line)`,
        borderRadius: 10,
        padding: "20px 18px",
        background: "var(--surface)",
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files?.[0]);
      }}
    >
      <p style={{ margin: "0 0 4px", fontSize: 14, color: "var(--text)" }}>
        Drop your <code>Timeline.json</code> here
      </p>
      <p style={{ margin: "0 0 14px", fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.5 }}>
        Export it on your phone: Settings → Location → Timeline → Export Timeline data.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={status === "loading"}
        style={{
          background: "var(--gold)",
          color: "var(--ink)",
          border: "none",
          borderRadius: 6,
          padding: "8px 14px",
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        {status === "loading" ? "Parsing…" : "Choose file"}
      </button>
      {status === "error" && (
        <p style={{ marginTop: 10, fontSize: 12.5, color: "#e08585" }}>{errorMsg}</p>
      )}
    </div>
  );
}
