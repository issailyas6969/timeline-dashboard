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

  // scrollToGallery: true only when triggered from the map's "Add photos" button
  const handleSelectPlace = (place, { scrollToGallery = false } = {}) => {
    setSelectedPlace(place);
    if (scrollToGallery) {
      requestAnimationFrame(() => {
        photosSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDashboard(data))
      .finally(() => setLoadingExisting(false));
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
      {/* ...header, UploadPanel unchanged... */}

      {dashboard && (
        <div style={{ display: "grid", gap: 24 }}>
          <StatsBar stats={dashboard.stats} />
          <MapView places={dashboard.places} onSelectPlace={handleSelectPlace} />
          {/* CategoryChart / routines unchanged */}

          <div ref={photosSectionRef}>
            <h2 style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 22, margin: "8px 0 14px" }}>
              Photos
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20 }}>
              <PlacesList places={dashboard.places} selectedKey={selectedPlace?.key} onSelect={handleSelectPlace} />
              <PlaceGallery place={selectedPlace} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}