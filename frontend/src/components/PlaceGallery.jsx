import { useEffect, useState, useCallback } from "react";

export default function PlaceGallery({ place, onPhotosChanged }) {
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | uploading | error
  const [errorMsg, setErrorMsg] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState(null); // null = closed, otherwise index into `photos`

  useEffect(() => {
    if (!place) return;
    setStatus("loading");
    setLightboxIndex(null); // close lightbox if we switch places
    fetch(`/api/places/${encodeURIComponent(place.key)}/photos`)
      .then((res) => res.json())
      .then((data) => setPhotos(data.photos || []))
      .catch(() => setErrorMsg("Couldn't load photos."))
      .finally(() => setStatus("idle"));
  }, [place]);

  async function handleUpload(files) {
    if (!place || !files?.length) return;
    setStatus("uploading");
    setErrorMsg("");
    try {
      const form = new FormData();
      [...files].forEach((f) => form.append("photos", f));
      const res = await fetch(`/api/places/${encodeURIComponent(place.key)}/photos`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setPhotos((prev) => [...data.files, ...prev]);
      setStatus("idle");
      onPhotosChanged?.(place.key); // let the dashboard/map know there's a new cover photo
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  }

  async function handleDelete(filename) {
    if (!place) return;
    const prev = photos;
    const deletedIndex = photos.findIndex((ph) => ph.filename === filename);
    setPhotos((p) => p.filter((ph) => ph.filename !== filename)); // optimistic

    // Keep the lightbox in a sane state if we just deleted the photo being viewed
    if (lightboxIndex !== null) {
      const remaining = photos.length - 1;
      if (remaining <= 0) setLightboxIndex(null);
      else if (deletedIndex <= lightboxIndex) {
        setLightboxIndex((i) => Math.max(0, Math.min(i, remaining - 1)));
      }
    }

    const res = await fetch(
      `/api/places/${encodeURIComponent(place.key)}/photos/${encodeURIComponent(filename)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      setPhotos(prev); // revert on failure
    } else {
      onPhotosChanged?.(place.key);
    }
  }

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const showPrev = useCallback(
    () => setLightboxIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length)),
    [photos.length]
  );
  const showNext = useCallback(
    () => setLightboxIndex((i) => (i === null ? i : (i + 1) % photos.length)),
    [photos.length]
  );

  // Keyboard navigation while the lightbox is open
  useEffect(() => {
    if (lightboxIndex === null) return;
    function onKeyDown(e) {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") showPrev();
      else if (e.key === "ArrowRight") showNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, closeLightbox, showPrev, showNext]);

  if (!place) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: 18, height: 420, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--text-dim)", fontSize: 13.5 }}>
          Select a place on the left (or click a pin on the map) to add photos.
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: 18, height: 420, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <h3 style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 18, margin: 0 }}>{place.name}</h3>
        <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
          {place.category} · {place.visitCount} visit{place.visitCount === 1 ? "" : "s"}
        </span>
      </div>

      <label
        style={{
          display: "block",
          border: "1px dashed var(--line)",
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 12.5,
          color: "var(--text-dim)",
          marginBottom: 12,
          cursor: "pointer",
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleUpload(e.dataTransfer.files);
        }}
      >
        {status === "uploading" ? "Uploading…" : "Click or drop photos here"}
        <input
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => handleUpload(e.target.files)}
        />
      </label>

      {status === "error" && (
        <p style={{ fontSize: 12, color: "#e08585", marginTop: -6, marginBottom: 10 }}>{errorMsg}</p>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11.5, color: "var(--text-dim)" }}>
          {photos.length} photo{photos.length === 1 ? "" : "s"}
        </span>
        {photos.length > 0 && (
          <button
            onClick={() => setLightboxIndex(0)}
            style={{
              fontSize: 11.5,
              color: "var(--text)",
              background: "transparent",
              border: "1px solid var(--line)",
              borderRadius: 6,
              padding: "3px 8px",
              cursor: "pointer",
            }}
          >
            View all
          </button>
        )}
      </div>

      <div
        className="scrollbar-thin"
        style={{
          flex: 1,
          overflowY: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))",
          gap: 8,
          alignContent: "start",
        }}
      >
        {status === "loading" && <p style={{ color: "var(--text-dim)", fontSize: 12.5 }}>Loading…</p>}
        {status !== "loading" && photos.length === 0 && (
          <p style={{ color: "var(--text-dim)", fontSize: 12.5, gridColumn: "1 / -1" }}>
            No photos yet for {place.name}.
          </p>
        )}
        {photos.map((p, idx) => (
          <div key={p.filename} style={{ position: "relative", aspectRatio: "1", borderRadius: 6, overflow: "hidden", border: "1px solid var(--line)" }}>
            <img
              src={p.url}
              alt={place.name}
              onClick={() => setLightboxIndex(idx)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "pointer" }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(p.filename);
              }}
              title="Remove photo"
              style={{
                position: "absolute",
                top: 3,
                right: 3,
                background: "rgba(18,20,28,0.75)",
                color: "var(--text)",
                border: "none",
                borderRadius: 4,
                fontSize: 11,
                width: 18,
                height: 18,
                lineHeight: "18px",
                padding: 0,
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div
          onClick={closeLightbox}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,11,16,0.92)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <button
            onClick={closeLightbox}
            title="Close (Esc)"
            style={{
              position: "absolute",
              top: 18,
              right: 22,
              background: "transparent",
              border: "none",
              color: "#fff",
              fontSize: 28,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>

          <span
            style={{
              position: "absolute",
              top: 20,
              left: 24,
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
            }}
          >
            {place.name} · {lightboxIndex + 1} / {photos.length}
          </span>

          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                showPrev();
              }}
              title="Previous (←)"
              style={navArrowStyle("left")}
            >
              ‹
            </button>
          )}

          <img
            src={photos[lightboxIndex].url}
            alt={place.name}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "88vw",
              maxHeight: "86vh",
              objectFit: "contain",
              borderRadius: 4,
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            }}
          />

          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                showNext();
              }}
              title="Next (→)"
              style={navArrowStyle("right")}
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function navArrowStyle(side) {
  return {
    position: "absolute",
    [side]: 18,
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#fff",
    fontSize: 30,
    width: 44,
    height: 44,
    borderRadius: "50%",
    cursor: "pointer",
    lineHeight: 1,
  };
}