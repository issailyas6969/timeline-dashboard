import { useEffect, useRef, useState } from "react";
import UploadPanel from "./components/UploadPanel.jsx";
import StatsBar from "./components/StatsBar.jsx";
import CategoryChart from "./components/CategoryChart.jsx";
import MapView from "./components/MapView.jsx";
import PlacesList from "./components/PlacesList.jsx";
import PlaceGallery from "./components/PlaceGallery.jsx";

export default function App() {
  const [dashboard, setDashboard] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const photosSectionRef = useRef(null);

  // scrollToGallery is only passed as true from the map popup's "Add photos" link,
  // so clicking a place in the list doesn't jump the page.
  const handleSelectPlace = (place, { scrollToGallery = false } = {}) => {
    setSelectedPlace(place);
    if (scrollToGallery) {
      requestAnimationFrame(() => {
        photosSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const fetchDashboard = () =>
    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setDashboard(data);
        return data;
      });

  // Called by PlaceGallery after a photo upload/delete so the map pin
  // thumbnail and any other coverPhoto-dependent UI stay in sync.
  const refreshDashboard = () => {
    fetchDashboard().then((data) => {
      // Keep selectedPlace pointing at the freshest place object (in case
      // anything about it, like visitCount, changed) instead of a stale copy.
      if (data && selectedPlace) {
        const updated = data.places.find((p) => p.key === selectedPlace.key);
        if (updated) setSelectedPlace(updated);
      }
    });
  };

  useEffect(() => {
    fetchDashboard().finally(() => setLoadingExisting(false));
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: 34, fontWeight: 600, margin: 0 }}>
          Footprint
        </h1>
        <p style={{ color: "var(--text-dim)", marginTop: 6, fontSize: 15 }}>
          Your places, mapped — built from your Google Maps Timeline export.
        </p>
      </header>

      <div style={{ marginBottom: 28 }}>
        <UploadPanel onUploaded={setDashboard} />
      </div>

      {loadingExisting && <p style={{ color: "var(--text-dim)" }}>Loading…</p>}

      {!loadingExisting && !dashboard && (
        <p style={{ color: "var(--text-dim)" }}>
          No data yet — upload a Timeline.json above to build your dashboard.
        </p>
      )}

      {dashboard && (
        <div style={{ display: "grid", gap: 24 }}>
          <StatsBar stats={dashboard.stats} />

          <MapView places={dashboard.places} onSelectPlace={handleSelectPlace} />

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
            <CategoryChart data={dashboard.categoryChart} />
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: 18 }}>
              <h3 style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 18, margin: "0 0 12px" }}>
                Your routines
              </h3>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.9, color: "var(--text)" }}>
                {dashboard.routines.map((r, i) => (
                  <li key={i}>
                    {r.name} <span style={{ color: "var(--text-dim)" }}>— {r.visitCount} visits · {r.category}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div ref={photosSectionRef}>
            <h2 style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 22, margin: "8px 0 14px" }}>
              Photos
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20 }}>
              <PlacesList
                places={dashboard.places}
                selectedKey={selectedPlace?.key}
                onSelect={handleSelectPlace}
              />
              <PlaceGallery place={selectedPlace} onPhotosChanged={refreshDashboard} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}